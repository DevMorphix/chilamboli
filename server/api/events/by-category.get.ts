import { connectDB } from "../../utils/db"
import { Event } from "../../database/models"

export default defineEventHandler(async (event) => {
  await connectDB(event)
  const query = getQuery(event)
  const { ageCategory, eventType } = query

  try {
    const filter: any = {}

    if (ageCategory) {
      // Include combined category events for all age categories
      filter.$or = [{ ageCategory: ageCategory as string }, { ageCategory: "Combined" }]
    }

    if (eventType) {
      filter.eventType = eventType as string
    }

    const events = await Event.find(filter).sort({ ageCategory: 1, eventType: 1, name: 1 }).lean()

    return {
      success: true,
      events,
    }
  } catch (error) {
    console.error("Error fetching events:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch events",
    })
  }
})
