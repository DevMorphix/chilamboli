import { connectDB } from "../../utils/db"
import { Student } from "../../database/models"

export default defineEventHandler(async (event) => {
  await connectDB(event)
  const query = getQuery(event)
  const searchTerm = query.q as string
  const schoolId = query.schoolId as string | null

  if (!searchTerm || searchTerm.length < 2) {
    return []
  }

  try {
    const filter: any = {
      $or: [
        { firstName: { $regex: searchTerm, $options: "i" } },
        { lastName: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
      ],
    }

    if (schoolId) {
      filter.schoolId = schoolId
    }

    const students = await Student.find(filter).limit(10).lean()
    return students
  } catch (error) {
    console.error("Error searching students:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to search students",
    })
  }
})
