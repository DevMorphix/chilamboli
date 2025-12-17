import { connectDB } from "../utils/db"
import { Event } from "../database/models"

export default defineEventHandler(async () => {
  await connectDB()

  try {
    const events = await Event.find().lean()
    return events
  } catch (error) {
    console.error("Error fetching events:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch events",
    })
  }
})
