import { connectDB } from "../../utils/db"
import { Student } from "../../database/models"

export default defineEventHandler(async (event) => {
  await connectDB(event)
  const query = getQuery(event)
  const { facultyId } = query

  if (!facultyId) {
    throw createError({
      statusCode: 400,
      message: "Faculty ID is required",
    })
  }

  try {
    const students = await Student.find({ addedByFacultyId: facultyId as string })
      .sort({ createdAt: -1 })
      .lean()

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
