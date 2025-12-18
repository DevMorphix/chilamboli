import { useDB } from "../utils/db"
import { events } from "../database/schema"

export default defineEventHandler(async (event) => {
  const db = useDB(event)

  try {
    const allEvents = await db.select().from(events)
    return allEvents
  } catch (error) {
    console.error("Error fetching events:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch events",
    })
  }
})
