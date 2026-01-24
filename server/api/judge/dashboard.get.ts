import { useDB } from "../../utils/db"
import { judges, eventJudges, events, registrations, registrationParticipants, judgments } from "../../database/schema"
import { eq, and, sql, inArray } from "drizzle-orm"

// Get judge dashboard data - assigned event with registrations
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const judgeId = query.judgeId as string

  if (!judgeId) {
    throw createError({
      statusCode: 400,
      message: "Judge ID is required",
    })
  }

  try {
    const [judge] = await db
      .select({ id: judges.id, judgeName: judges.judgeName, mobileNumber: judges.mobileNumber })
      .from(judges)
      .where(eq(judges.id, judgeId))
      .limit(1)

    if (!judge) {
      throw createError({
        statusCode: 404,
        message: "Judge not found",
      })
    }

    const [assignedEvent] = await db
      .select({
        eventId: events.id,
        eventName: events.name,
        eventDescription: events.description,
        eventType: events.eventType,
        ageCategory: events.ageCategory,
        gender: events.gender,
        enabled: eventJudges.enabled,
        assignedAt: eventJudges.createdAt,
      })
      .from(eventJudges)
      .innerJoin(events, eq(eventJudges.eventId, events.id))
      .where(
        and(
          eq(eventJudges.judgeId, judgeId),
          eq(eventJudges.enabled, true)
        )
      )
      .orderBy(eventJudges.createdAt)
      .limit(1)

    if (!assignedEvent) {
      return {
        success: true,
        judge: {
          id: judge.id,
          judgeName: judge.judgeName,
          mobileNumber: judge.mobileNumber,
        },
        event: null,
        registrations: [],
      }
    }

    const registrationsList = await db
      .select({ registration: registrations })
      .from(registrations)
      .where(eq(registrations.eventId, assignedEvent.eventId))

    // Get all judges assigned to this event
    const eventJudgesList = await db
      .select({
        judgeId: eventJudges.judgeId,
        judgeName: judges.judgeName,
      })
      .from(eventJudges)
      .innerJoin(judges, eq(eventJudges.judgeId, judges.id))
      .where(eq(eventJudges.eventId, assignedEvent.eventId))

    const registrationIds = registrationsList.map((r) => r.registration.id)
    const judgeIds = eventJudgesList.map((ej) => ej.judgeId)
    const judgmentsList =
      registrationIds.length > 0 && judgeIds.length > 0
        ? await db
            .select({
              id: judgments.id,
              judgeId: judgments.judgeId,
              registrationId: judgments.registrationId,
              score: judgments.score,
              comments: judgments.comments,
              createdAt: judgments.createdAt,
              updatedAt: judgments.updatedAt,
            })
            .from(judgments)
            .where(
              and(
                inArray(judgments.registrationId, registrationIds),
                inArray(judgments.judgeId, judgeIds)
              )
            )
        : []

    const judgmentsMap = new Map<string, Map<string, (typeof judgmentsList)[0]>>()
    judgmentsList.forEach((j) => {
      if (!judgmentsMap.has(j.registrationId)) {
        judgmentsMap.set(j.registrationId, new Map())
      }
      judgmentsMap.get(j.registrationId)!.set(j.judgeId, j)
    })

    // Get this judge's judgments separately for easy access
    const thisJudgeJudgmentsMap = new Map(
      judgmentsList.filter((j) => j.judgeId === judgeId).map((j) => [j.registrationId, j])
    )

    // Get participant counts for each registration
    const participantCounts = registrationIds.length > 0
      ? await db
          .select({
            registrationId: registrationParticipants.registrationId,
            count: sql<number>`COUNT(*)`.as("count"),
          })
          .from(registrationParticipants)
          .where(inArray(registrationParticipants.registrationId, registrationIds))
          .groupBy(registrationParticipants.registrationId)
      : []

    const participantCountsMap = new Map(participantCounts.map((p) => [p.registrationId, p.count]))

    // Format registrations with judgment status
    // Optimized: Only store judge IDs that have judged (instead of full judge objects per registration)
    const formattedRegistrations = registrationsList.map((row) => {
      const registrationJudgments = judgmentsMap.get(row.registration.id) || new Map()
      const thisJudgeJudgment = thisJudgeJudgmentsMap.get(row.registration.id) || null
      
      // Only store judge IDs that have completed judgments (compact format)
      const judgedBy = Array.from(registrationJudgments.keys())

      return {
        id: row.registration.id,
        registrationCode: row.registration.registrationCode,
        participantCount: participantCountsMap.get(row.registration.id) || 0,
        judgment: thisJudgeJudgment
          ? {
              id: thisJudgeJudgment.id,
              score: thisJudgeJudgment.score,
              comments: thisJudgeJudgment.comments,
              createdAt: thisJudgeJudgment.createdAt,
              updatedAt: thisJudgeJudgment.updatedAt,
            }
          : null,
        judgedBy, // Array of judge IDs that have completed judgments (optimized)
      }
    })

    // Calculate stats
    const totalRegistrations = formattedRegistrations.length
    const judgedRegistrations = formattedRegistrations.filter((r) => r.judgment).length

    // Format judges list for event (moved here to avoid repetition in each registration)
    const eventJudgesFormatted = eventJudgesList.map((ej) => ({
      judgeId: ej.judgeId,
      judgeName: ej.judgeName,
    }))

    return {
      success: true,
      judge: {
        id: judge.id,
        judgeName: judge.judgeName,
        mobileNumber: judge.mobileNumber,
      },
      event: assignedEvent
        ? {
            id: assignedEvent.eventId,
            name: assignedEvent.eventName,
            description: assignedEvent.eventDescription,
            eventType: assignedEvent.eventType,
            ageCategory: assignedEvent.ageCategory,
            gender: assignedEvent.gender,
            totalRegistrations,
            judgedRegistrations,
            pendingRegistrations: totalRegistrations - judgedRegistrations,
            assignedAt: assignedEvent.assignedAt,
            totalJudges: eventJudgesList.length,
            judges: eventJudgesFormatted, // Full judges list (avoid repetition)
          }
        : null,
      registrations: formattedRegistrations,
    }
  } catch (error: any) {
    console.error("Error fetching judge dashboard:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to fetch judge dashboard",
    })
  }
})
