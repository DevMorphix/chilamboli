import { useDB } from "../../utils/db"
import { registrations, events } from "../../database/schema"
import { eq, asc, count } from "drizzle-orm"
import { getPaginationParams, createPaginatedResponse } from "../../utils/pagination"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const { page, limit, sortBy, sortOrder, filters } = getPaginationParams(query)

  try {
    const hasEventFilter = !!filters?.eventId
    const whereClause = hasEventFilter
      ? eq(registrations.eventId, filters!.eventId as string)
      : undefined

    const [totalResult] = await db
      .select({ count: count() })
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .where(hasEventFilter ? whereClause : (undefined as any))

    const total = totalResult.count
    const offset = (page - 1) * limit

    let q = db
      .select({
        id: registrations.id,
        eventId: registrations.eventId,
        chestNumber: registrations.chestNumber,
        teamName: registrations.teamName,
        schoolId: registrations.schoolId,
        createdAt: registrations.createdAt,
        event: {
          id: events.id,
          name: events.name,
          ageCategory: events.ageCategory,
        },
      })
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
    if (hasEventFilter) q = q.where(whereClause) as typeof q
    const rows = await q
      .orderBy(
        asc(events.name),
        asc(events.ageCategory),
        asc(registrations.createdAt)
      )
      .limit(limit)
      .offset(offset)

    const data = rows.map((r) => ({
      id: r.id,
      eventId: r.eventId,
      chestNumber: r.chestNumber,
      teamName: r.teamName,
      schoolId: r.schoolId,
      createdAt: r.createdAt,
      event: r.event,
    }))

    return {
      success: true,
      ...createPaginatedResponse(data, total, {
        page,
        limit,
        sortBy,
        sortOrder,
        filters,
      }),
    }
  } catch (err) {
    console.error("Error fetching registrations:", err)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch registrations",
    })
  }
})
