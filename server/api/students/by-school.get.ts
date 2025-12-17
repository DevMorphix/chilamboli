import { connectDB } from "../../utils/db"
import { Student } from "../../database/models"

export default defineEventHandler(async (event) => {
  await connectDB(event)
  const query = getQuery(event)
  const { schoolId, ageCategory } = query

  if (!schoolId) {
    throw createError({
      statusCode: 400,
      message: "School ID is required",
    })
  }

  try {
    const filter: any = { schoolId: schoolId as string }

    if (ageCategory) {
      filter.ageCategory = ageCategory as string
    }

    const students = await Student.find(filter).sort({ createdAt: -1 }).lean()

    return {
      success: true,
      students,
    }
  } catch (error) {
    console.error("Error fetching students:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch students",
    })
  }
})
