import { useDB } from "../../../utils/db"
import { judges, eventJudges, events } from "../../../database/schema"
import { eq } from "drizzle-orm"

// Get events assigned to a judge
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const judgeId = getRouterParam(event, "id")

  if (!judgeId) {
    throw createError({
      statusCode: 400,
      message: "Judge ID is required",
    })
  }

  try {
    // Check if judge exists
    const [judge] = await db
      .select()
      .from(judges)
      .where(eq(judges.id, judgeId))
      .limit(1)

    if (!judge) {
      throw createError({
        statusCode: 404,
        message: "Judge not found",
      })
    }

    // Get assigned events with assignment details
    const assignedEvents = await db
      .select({
        assignmentId: eventJudges.id,
        id: events.id,
        name: events.name,
        description: events.description,
        eventType: events.eventType,
        ageCategory: events.ageCategory,
        gender: events.gender,
        maxTeamSize: events.maxTeamSize,
        enabled: eventJudges.enabled,
        assignedAt: eventJudges.createdAt,
      })
      .from(eventJudges)
      .innerJoin(events, eq(eventJudges.eventId, events.id))
      .where(eq(eventJudges.judgeId, judgeId))
      .orderBy(events.name)

    return {
      success: true,
      judge: {
        id: judge.id,
        judgeName: judge.judgeName,
        mobileNumber: judge.mobileNumber,
      },
      events: assignedEvents,
    }
  } catch (error: any) {
    console.error("Error fetching judge events:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to fetch judge events",
    })
  }
})
