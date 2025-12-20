import { useDB } from "../../utils/db"
import { students } from "../../database/schema"
import { eq } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const id = event.context.params?.id

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Student ID is required",
    })
  }

  try {
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, id))
      .limit(1)

    if (!student) {
      throw createError({
        statusCode: 404,
        message: "Student not found",
      })
    }

    return {
      success: true,
      student,
    }
  } catch (error: any) {
    console.error("Error fetching student:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to fetch student",
    })
  }
})

