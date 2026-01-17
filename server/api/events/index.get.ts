import { useDB } from "../../utils/db"
import { events } from "../../database/schema"
import { getPaginationParams, createPaginatedResponse } from "../../utils/pagination"
import { count, like, or, eq, and, asc, desc } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const { page, limit, search, sortBy, sortOrder, filters } = getPaginationParams(query)

  try {
    let whereClause: any = undefined
    
    // Apply filters
    if (filters) {
      const filterConditions: any[] = []
      if (filters.ageCategory) {
        filterConditions.push(eq(events.ageCategory, filters.ageCategory as any))
      }
      if (filters.eventType) {
        filterConditions.push(eq(events.eventType, filters.eventType as any))
      }
      if (filters.gender) {
        filterConditions.push(eq(events.gender, filters.gender as any))
      }
      if (filterConditions.length > 0) {
        whereClause = filterConditions.length === 1 ? filterConditions[0] : and(...filterConditions)
      }
    }
    
    // Apply search
    if (search) {
      const searchPattern = `%${search}%`
      const searchClause = or(
        like(events.name, searchPattern),
        like(events.eventType, searchPattern),
        like(events.ageCategory, searchPattern)
      )
      whereClause = whereClause ? and(whereClause, searchClause) : searchClause
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(events)
      .where(whereClause)

    const total = totalResult.count

    // Apply sorting
    let orderByClause: any = asc(events.createdAt) // default
    if (sortBy) {
      const sortField = events[sortBy as keyof typeof events] as any
      if (sortField) {
        orderByClause = sortOrder === 'desc' ? desc(sortField) : asc(sortField)
      }
    }

    const offset = (page - 1) * limit
    const allEvents = await db
      .select()
      .from(events)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset)

    return createPaginatedResponse(allEvents, total, { page, limit, search, sortBy, sortOrder, filters })
  } catch (error) {
    console.error("Error fetching events:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch events",
    })
  }
})
