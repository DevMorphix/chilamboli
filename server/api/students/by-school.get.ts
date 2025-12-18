import { useDB } from "../../utils/db"
import { students } from "../../database/schema"
import { eq, and, desc } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const { schoolId, ageCategory } = query

  if (!schoolId) {
    throw createError({
      statusCode: 400,
      message: "School ID is required",
    })
  }

  try {
    let result

    if (ageCategory) {
      result = await db
        .select()
        .from(students)
        .where(
          and(
            eq(students.schoolId, schoolId as string),
            eq(students.ageCategory, ageCategory as string)
          )
        )
        .orderBy(desc(students.createdAt))
    } else {
      result = await db
        .select()
        .from(students)
        .where(eq(students.schoolId, schoolId as string))
        .orderBy(desc(students.createdAt))
    }

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
