import { useDB } from "../../../utils/db"
import { judges, events, eventJudges } from "../../../database/schema"
import { eq, and, inArray } from "drizzle-orm"
import { nanoid } from "nanoid"

// Assign judge to one or more events
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const judgeId = getRouterParam(event, "id")
  const body = await readBody(event)

  const { eventIds } = body // Array of event IDs

  if (!judgeId) {
    throw createError({
      statusCode: 400,
      message: "Judge ID is required",
    })
  }

  if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: "Event IDs array is required",
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

    // Verify all events exist
    const existingEvents = await db
      .select()
      .from(events)
      .where(inArray(events.id, eventIds))

    if (existingEvents.length !== eventIds.length) {
      throw createError({
        statusCode: 404,
        message: "One or more events not found",
      })
    }

    // Get existing assignments for this judge
    const existingAssignments = await db
      .select()
      .from(eventJudges)
      .where(eq(eventJudges.judgeId, judgeId))

    const existingEventIds = new Set(existingAssignments.map((ea) => ea.eventId))

    // Filter out events that are already assigned
    const newEventIds = eventIds.filter((eventId) => !existingEventIds.has(eventId))

    // Create new assignments
    if (newEventIds.length > 0) {
      await db.insert(eventJudges).values(
        newEventIds.map((eventId) => ({
          id: nanoid(),
          judgeId,
          eventId,
        }))
      )
    }

    return {
      success: true,
      message: `Judge assigned to ${newEventIds.length} event(s) successfully`,
      assignedEvents: newEventIds.length,
      skippedEvents: eventIds.length - newEventIds.length,
    }
  } catch (error: any) {
    console.error("Error assigning judge to events:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to assign judge to events",
    })
  }
})
