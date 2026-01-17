import { useDB } from "../../../../utils/db"
import { judges, eventJudges, events, registrations, registrationParticipants, students, faculty, schools, judgments } from "../../../../database/schema"
import { eq, and } from "drizzle-orm"

// Get registrations for an event assigned to a judge
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const eventId = getRouterParam(event, "eventId")
  const query = getQuery(event)
  const judgeId = query.judgeId as string

  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: "Event ID is required",
    })
  }

  if (!judgeId) {
    throw createError({
      statusCode: 400,
      message: "Judge ID is required",
    })
  }

  try {
    // Verify judge is assigned to this event
    const [assignment] = await db
      .select()
      .from(eventJudges)
      .where(and(eq(eventJudges.judgeId, judgeId), eq(eventJudges.eventId, eventId)))
      .limit(1)

    if (!assignment) {
      throw createError({
        statusCode: 403,
        message: "Judge is not assigned to this event",
      })
    }

    // Get event details
    const [eventData] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!eventData) {
      throw createError({
        statusCode: 404,
        message: "Event not found",
      })
    }

    // Get all registrations for this event
    const registrationsList = await db
      .select({
        registration: registrations,
        school: schools,
        participants: registrationParticipants,
      })
      .from(registrations)
      .innerJoin(schools, eq(registrations.schoolId, schools.id))
      .leftJoin(registrationParticipants, eq(registrations.id, registrationParticipants.registrationId))
      .where(eq(registrations.eventId, eventId))

    // Get all registration IDs
    const registrationIds = Array.from(new Set(registrationsList.map((r) => r.registration.id)))

    // Get judgments for these registrations by this judge
    const judgmentsList = registrationIds.length > 0
      ? await db
          .select()
          .from(judgments)
          .where(and(eq(judgments.judgeId, judgeId)))
      : []

    // Filter judgments for this event's registrations
    const relevantJudgments = judgmentsList.filter((j) =>
      registrationIds.includes(j.registrationId)
    )

    const judgmentsMap = new Map(relevantJudgments.map((j) => [j.registrationId, j]))

    // Group participants by registration
    const registrationsMap = new Map<string, any>()
    for (const row of registrationsList) {
      const regId = row.registration.id
      if (!registrationsMap.has(regId)) {
        registrationsMap.set(regId, {
          ...row.registration,
          school: row.school,
          participants: [],
          judgment: judgmentsMap.get(regId) || null,
        })
      }
      if (row.participants) {
        registrationsMap.get(regId)!.participants.push(row.participants)
      }
    }

    // Fetch participant details (students and faculty)
    const registrationArray = Array.from(registrationsMap.values())
    for (const reg of registrationArray) {
      for (const participant of reg.participants) {
        if (participant.participantType === "student") {
          const [student] = await db
            .select()
            .from(students)
            .where(eq(students.id, participant.participantId))
            .limit(1)
          participant.details = student
        } else if (participant.participantType === "faculty") {
          const [facultyMember] = await db
            .select()
            .from(faculty)
            .where(eq(faculty.id, participant.participantId))
            .limit(1)
          participant.details = facultyMember
        }
      }
    }

    return {
      success: true,
      event: eventData,
      registrations: registrationArray,
    }
  } catch (error: any) {
    console.error("Error fetching event registrations:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to fetch event registrations",
    })
  }
})
