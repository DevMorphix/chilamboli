import { useDB } from "../../utils/db"
import { students } from "../../database/schema"
import { like, and, eq, or, count, asc, desc } from "drizzle-orm"
import { getPaginationParams, createPaginatedResponse } from "../../utils/pagination"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const searchTerm = query.q as string
  const schoolId = query.schoolId as string | null
  const ageCategory = query.ageCategory as string | null
  const { page, limit, sortBy, sortOrder } = getPaginationParams({ ...query, search: searchTerm })

  if (!searchTerm || searchTerm.length < 2) {
    return createPaginatedResponse([], 0, { page, limit, search: searchTerm, sortBy, sortOrder })
  }

  try {
    const searchPattern = `%${searchTerm}%`
    const searchWhere = or(
      like(students.studentName, searchPattern),
      like(students.studentId, searchPattern)
    )
    
    let whereClause: any = searchWhere
    const conditions: any[] = [searchWhere]
    
    if (schoolId) {
      conditions.push(eq(students.schoolId, schoolId))
    }
    
    if (ageCategory) {
      if (ageCategory === 'Combined') {
        // Combined events allow all age categories, so no filter needed
      } else {
        conditions.push(eq(students.ageCategory, ageCategory as "Sub Junior" | "Junior" | "Senior"))
      }
    }
    
    if (conditions.length > 1) {
      whereClause = and(...conditions)
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(students)
      .where(whereClause)

    const total = totalResult.count

    // Apply sorting
    let orderByClause: any = asc(students.studentName) // default
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

    return createPaginatedResponse(result, total, { page, limit, search: searchTerm, sortBy, sortOrder })
  } catch (error) {
    console.error("Error searching students:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to search students",
    })
  }
})
