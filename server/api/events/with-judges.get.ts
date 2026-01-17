import { useDB } from "../../utils/db"
import { events, eventJudges, judges } from "../../database/schema"
import { eq, desc, asc, count, like, or, inArray } from "drizzle-orm"
import { getPaginationParams, createPaginatedResponse } from "../../utils/pagination"

// Get events with their assigned judges (paginated)
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
        like(events.name, searchPattern),
        like(events.eventType, searchPattern),
        like(events.ageCategory, searchPattern)
      )
    }

    // Build order by clause
    let orderByClause: any = asc(events.name) // default
    if (sortBy === "name") {
      orderByClause = sortOrder === "desc" ? desc(events.name) : asc(events.name)
    } else if (sortBy === "createdAt") {
      orderByClause = sortOrder === "desc" ? desc(events.createdAt) : asc(events.createdAt)
    }

    // Apply pagination
    const offset = (page - 1) * limit

    // Run count and events query in parallel for better performance
    const [totalResult, paginatedEvents] = await Promise.all([
      // Get total count
      db
        .select({ count: count() })
        .from(events)
        .where(whereClause)
        .then((results) => results[0]),

      // Get paginated events
      db
        .select()
        .from(events)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset),
    ])

    const total = totalResult.count

    // Get event IDs from paginated events
    const eventIds = paginatedEvents.map((e) => e.id)

    // Early return if no events
    if (eventIds.length === 0) {
      const paginatedResponse = createPaginatedResponse([], total, {
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
    }

    // Get all event-judge assignments for these events
    // Optimized: Use Map for O(1) lookup during grouping
    const filteredAssignments = await db
      .select({
        assignmentId: eventJudges.id,
        eventId: eventJudges.eventId,
        judgeId: judges.id,
        judgeName: judges.judgeName,
        judgeMobileNumber: judges.mobileNumber,
        enabled: eventJudges.enabled,
        assignedAt: eventJudges.createdAt,
      })
      .from(eventJudges)
      .innerJoin(judges, eq(eventJudges.judgeId, judges.id))
      .where(inArray(eventJudges.eventId, eventIds))
      .orderBy(judges.judgeName)

    // Group assignments by event ID using Map for O(1) operations
    const assignmentsByEventId = new Map<string, typeof filteredAssignments>()
    for (const assignment of filteredAssignments) {
      const eventId = assignment.eventId
      if (!assignmentsByEventId.has(eventId)) {
        assignmentsByEventId.set(eventId, [])
      }
      assignmentsByEventId.get(eventId)!.push(assignment)
    }

    // Combine events with their assignments
    const eventsWithAssignments = paginatedEvents.map((eventItem) => {
      const assignments = assignmentsByEventId.get(eventItem.id) || []
      return {
        ...eventItem,
        assignments,
        assignedJudgesCount: assignments.length,
      }
    })

    const paginatedResponse = createPaginatedResponse(eventsWithAssignments, total, {
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
    console.error("Error fetching events with judges:", error)

    throw createError({
      statusCode: 500,
      message: "Failed to fetch events with judges",
    })
  }
})
