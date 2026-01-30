import { useDB } from "../../../utils/db"
import { events } from "../../../database/schema"
import { eq } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const eventId = getRouterParam(event, "id")
  const body = await readBody(event).catch(() => ({}))
  const registrationClosed = body.registrationClosed !== undefined ? Boolean(body.registrationClosed) : true

  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: "Event ID is required",
    })
  }

  try {
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

    await db
      .update(events)
      .set({ registrationClosed })
      .where(eq(events.id, eventId))

    return {
      success: true,
      message: registrationClosed ? "Registration closed for this event." : "Registration reopened for this event.",
      data: { id: eventId, registrationClosed },
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error("Error updating event registration status:", err)
    throw createError({
      statusCode: 500,
      message: "Failed to update registration status",
    })
  }
})
