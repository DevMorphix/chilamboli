import { useDB } from "../../utils/db"
import { students } from "../../database/schema"
import { eq, desc } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const { facultyId } = query

  if (!facultyId) {
    throw createError({
      statusCode: 400,
      message: "Faculty ID is required",
    })
  }

  try {
    const result = await db
      .select()
      .from(students)
      .where(eq(students.addedByFacultyId, facultyId as string))
      .orderBy(desc(students.createdAt))

    return {
      success: true,
      students: result,
    }
  } catch (error) {
    console.error("Error fetching students:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch students",
    })
  }
})
