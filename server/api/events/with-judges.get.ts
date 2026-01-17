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

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(events)
      .where(whereClause)

    const total = totalResult.count

    // Build order by clause
    let orderByClause: any = asc(events.name) // default
    if (sortBy === "name") {
      orderByClause = sortOrder === "desc" ? desc(events.name) : asc(events.name)
    } else if (sortBy === "createdAt") {
      orderByClause = sortOrder === "desc" ? desc(events.createdAt) : asc(events.createdAt)
    }

    // Apply pagination
    const offset = (page - 1) * limit

    // Get paginated events
    const paginatedEvents = await db
      .select()
      .from(events)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset)

    // Get event IDs from paginated events
    const eventIds = paginatedEvents.map((e) => e.id)

    // Get all event-judge assignments for these events
    const filteredAssignments = eventIds.length > 0
      ? await db
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
      : []

    // Group assignments by event ID
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
