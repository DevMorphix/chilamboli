import { useDB } from "../../../utils/db"
import { events } from "../../../database/schema"
import { eq } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const eventId = getRouterParam(event, "id")
  const body = await readBody(event).catch(() => ({}))
  const isCompleted = body.isCompleted !== undefined ? Boolean(body.isCompleted) : true

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

    // Toggle event completion status
    const [updatedEvent] = await db
      .update(events)
      .set({ isCompleted })
      .where(eq(events.id, eventId))
      .returning()

    return {
      success: true,
      message: isCompleted 
        ? "Event marked as complete successfully" 
        : "Event marked as incomplete successfully",
      event: updatedEvent,
    }
  } catch (error: any) {
    console.error("Error toggling event completion:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to toggle event completion status",
    })
  }
})
