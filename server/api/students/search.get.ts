import { useDB } from "../../utils/db"
import { students } from "../../database/schema"
import { like, and, eq, or } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const searchTerm = query.q as string
  const schoolId = query.schoolId as string | null

  if (!searchTerm || searchTerm.length < 2) {
    return []
  }

  try {
    const searchPattern = `%${searchTerm}%`
    
    let result
    if (schoolId) {
      result = await db
        .select()
        .from(students)
        .where(
          and(
            eq(students.schoolId, schoolId),
            or(
              like(students.studentName, searchPattern),
              like(students.studentId, searchPattern),
              like(students.chestNumber, searchPattern)
            )
          )
        )
        .limit(10)
    } else {
      result = await db
        .select()
        .from(students)
        .where(
          or(
            like(students.studentName, searchPattern),
            like(students.studentId, searchPattern),
            like(students.chestNumber, searchPattern)
          )
        )
        .limit(10)
    }

    return result
  } catch (error) {
    console.error("Error searching students:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to search students",
    })
  }
})
