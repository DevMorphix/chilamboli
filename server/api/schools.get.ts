import { connectDB } from "../utils/db"
import { School } from "../database/models"

export default defineEventHandler(async () => {
  await connectDB()

  try {
    const schools = await School.find().lean()
    return schools
  } catch (error) {
    console.error("Error fetching schools:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch schools",
    })
  }
})
