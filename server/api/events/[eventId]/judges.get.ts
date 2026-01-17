import { useDB } from "../../../utils/db"
import { events, eventJudges, judges } from "../../../database/schema"
import { eq } from "drizzle-orm"

// Get judges assigned to an event with their assignment details
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const eventId = getRouterParam(event, "eventId")

  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: "Event ID is required",
    })
  }

  try {
    // Check if event exists
    const [existingEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!existingEvent) {
      throw createError({
        statusCode: 404,
        message: "Event not found",
      })
    }

    // Get assigned judges with assignment details
    const assignedJudges = await db
      .select({
        assignmentId: eventJudges.id,
        judgeId: judges.id,
        judgeName: judges.judgeName,
        judgeMobileNumber: judges.mobileNumber,
        enabled: eventJudges.enabled,
        assignedAt: eventJudges.createdAt,
      })
      .from(eventJudges)
      .innerJoin(judges, eq(eventJudges.judgeId, judges.id))
      .where(eq(eventJudges.eventId, eventId))
      .orderBy(judges.judgeName)

    return {
      success: true,
      event: {
        id: existingEvent.id,
        name: existingEvent.name,
      },
      assignments: assignedJudges,
    }
  } catch (error: any) {
    console.error("Error fetching event judges:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to fetch event judges",
    })
  }
})
