import { useDB } from "../utils/db"
import { schools } from "../database/schema"
import { getPaginationParams, createPaginatedResponse } from "../utils/pagination"
import { count, like, or, asc, desc } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const { page, limit, search, sortBy, sortOrder, filters } = getPaginationParams(query)

  try {
    let whereClause: any = undefined
    if (search) {
      const searchPattern = `%${search}%`
      whereClause = or(
        like(schools.name, searchPattern),
        like(schools.schoolCode, searchPattern)
      )
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(schools)
      .where(whereClause)

    const total = totalResult.count

    // Apply sorting
    let orderByClause: any = asc(schools.name) // default
    if (sortBy) {
      const sortField = schools[sortBy as keyof typeof schools] as any
      if (sortField) {
        orderByClause = sortOrder === 'desc' ? desc(sortField) : asc(sortField)
      }
    }

    const offset = (page - 1) * limit
    const allSchools = await db
      .select()
      .from(schools)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset)

    return createPaginatedResponse(allSchools, total, { page, limit, search, sortBy, sortOrder, filters })
  } catch (error) {
    console.error("Error fetching schools:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch schools",
    })
  }
})
