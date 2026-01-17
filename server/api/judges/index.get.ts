import { useDB } from "../../utils/db"
import { judges, eventJudges, events } from "../../database/schema"
import { eq, sql, like, or, count, desc, asc } from "drizzle-orm"
import { getPaginationParams, createPaginatedResponse } from "../../utils/pagination"

// List all judges with their assigned events count (paginated)
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const { page, limit, search, sortBy, sortOrder } = getPaginationParams(query)

  try {
    let whereClause: any = undefined

    // Apply search
    if (search) {
      const searchPattern = `%${search}%`
      whereClause = or(
        like(judges.judgeName, searchPattern),
        like(judges.mobileNumber, searchPattern)
      )
    }

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(judges)
      .where(whereClause)

    const total = totalResult.count

    // Build order by clause
    let orderByClause: any = desc(judges.createdAt) // default
    if (sortBy === "judgeName") {
      orderByClause = sortOrder === "desc" ? desc(judges.judgeName) : asc(judges.judgeName)
    } else if (sortBy === "createdAt") {
      orderByClause = sortOrder === "desc" ? desc(judges.createdAt) : asc(judges.createdAt)
    }

    // Apply pagination
    const offset = (page - 1) * limit

    // Get paginated judges with their assigned events count
    const judgesList = await db
      .select({
        id: judges.id,
        judgeName: judges.judgeName,
        mobileNumber: judges.mobileNumber,
        createdAt: judges.createdAt,
        assignedEventsCount: sql<number>`COUNT(${eventJudges.id})`.as("assigned_events_count"),
      })
      .from(judges)
      .leftJoin(eventJudges, eq(judges.id, eventJudges.judgeId))
      .where(whereClause)
      .groupBy(judges.id)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset)

    const formattedJudges = judgesList.map((judge) => ({
      id: judge.id,
      judgeName: judge.judgeName,
      mobileNumber: judge.mobileNumber,
      createdAt: judge.createdAt,
      assignedEventsCount: judge.assignedEventsCount || 0,
    }))

    const paginatedResponse = createPaginatedResponse(formattedJudges, total, {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
    })

    return {
      success: true,
      ...paginatedResponse,
    }
  } catch (error: any) {
    console.error("Error fetching judges:", error)

    throw createError({
      statusCode: 500,
      message: "Failed to fetch judges",
    })
  }
})
