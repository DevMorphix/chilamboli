import { useDB } from "../../utils/db"
import { events } from "../../database/schema"
import { eq, or, asc } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const { ageCategory, eventType } = query

  try {
    let result

    if (ageCategory && eventType) {
      result = await db
        .select()
        .from(events)
        .where(
          or(
            eq(events.ageCategory, ageCategory as string),
            eq(events.ageCategory, "Combined")
          )
        )
        .orderBy(asc(events.ageCategory), asc(events.eventType), asc(events.name))
      
      // Filter by eventType in memory since SQLite doesn't support complex AND/OR easily
      result = result.filter(e => e.eventType === eventType)
    } else if (ageCategory) {
      result = await db
        .select()
        .from(events)
        .where(
          or(
            eq(events.ageCategory, ageCategory as string),
            eq(events.ageCategory, "Combined")
          )
        )
        .orderBy(asc(events.ageCategory), asc(events.eventType), asc(events.name))
    } else if (eventType) {
      result = await db
        .select()
        .from(events)
        .where(eq(events.eventType, eventType as string))
        .orderBy(asc(events.ageCategory), asc(events.eventType), asc(events.name))
    } else {
      result = await db
        .select()
        .from(events)
        .orderBy(asc(events.ageCategory), asc(events.eventType), asc(events.name))
    }

    return {
      success: true,
      events: result,
    }
  } catch (error) {
    console.error("Error fetching events:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch events",
    })
  }
})
