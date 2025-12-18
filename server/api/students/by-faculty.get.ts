import { useDB } from "../../utils/db"
import { students } from "../../database/schema"
import { eq, desc, asc, count, like, or, and } from "drizzle-orm"
import { getPaginationParams, createPaginatedResponse } from "../../utils/pagination"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const { facultyId } = query
  const { page, limit, search, sortBy, sortOrder, filters } = getPaginationParams(query)

  if (!facultyId) {
    throw createError({
      statusCode: 400,
      message: "Faculty ID is required",
    })
  }

  try {
    let whereClause: any = eq(students.addedByFacultyId, facultyId as string)
    
    // Apply filters
    if (filters) {
      const filterConditions: any[] = [whereClause]
      if (filters.ageCategory) {
        filterConditions.push(eq(students.ageCategory, filters.ageCategory as "Sub Junior" | "Junior" | "Senior"))
      }
      if (filters.class) {
        filterConditions.push(like(students.class, `%${filters.class}%`))
      }
      if (filterConditions.length > 1) {
        whereClause = and(...filterConditions)
      }
    }
    
    // Apply search
    if (search) {
      const searchPattern = `%${search}%`
      const searchClause = or(
        like(students.studentName, searchPattern),
        like(students.studentId, searchPattern),
        like(students.chestNumber, searchPattern)
      )
      whereClause = whereClause ? and(whereClause, searchClause) : searchClause
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(students)
      .where(whereClause)

    const total = totalResult.count

    // Apply sorting
    let orderByClause: any = desc(students.createdAt) // default
    if (sortBy) {
      const sortField = students[sortBy as keyof typeof students] as any
      if (sortField) {
        orderByClause = sortOrder === 'desc' ? desc(sortField) : asc(sortField)
      }
    }

    const offset = (page - 1) * limit
    const result = await db
      .select()
      .from(students)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset)

    return {
      success: true,
      ...createPaginatedResponse(result, total, { page, limit, search, sortBy, sortOrder, filters }),
    }
  } catch (error) {
    console.error("Error fetching students:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch students",
    })
  }
})
