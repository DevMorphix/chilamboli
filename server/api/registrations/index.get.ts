import { useDB } from "../../utils/db"
import { registrations, events, schools, registrationParticipants } from "../../database/schema"
import { eq, and, count, asc, desc } from "drizzle-orm"
import { getPaginationParams, createPaginatedResponse } from "../../utils/pagination"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const { page, limit, search, sortBy, sortOrder, filters } = getPaginationParams(query)

  // Backward compatibility: support eventId and schoolId from query params
  const eventId = filters?.eventId || query.eventId as string | null
  const schoolId = filters?.schoolId || query.schoolId as string | null

  try {
    let whereClause: any = undefined

    if (eventId && schoolId) {
      whereClause = and(eq(registrations.eventId, eventId), eq(registrations.schoolId, schoolId))
    } else if (eventId) {
      whereClause = eq(registrations.eventId, eventId)
    } else if (schoolId) {
      whereClause = eq(registrations.schoolId, schoolId)
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(registrations)
      .where(whereClause)

    const total = totalResult.count

    // Apply sorting
    let orderByClause: any = desc(registrations.createdAt) // default
    if (sortBy) {
      const sortField = registrations[sortBy as keyof typeof registrations] as any
      if (sortField) {
        orderByClause = sortOrder === 'desc' ? desc(sortField) : asc(sortField)
      }
    }

    const offset = (page - 1) * limit
    let registrationList = await db
      .select()
      .from(registrations)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset)

    // Fetch related data
    const results = await Promise.all(
      registrationList.map(async (reg) => {
        const [eventData] = await db
          .select()
          .from(events)
          .where(eq(events.id, reg.eventId))
          .limit(1)

        const [school] = await db
          .select()
          .from(schools)
          .where(eq(schools.id, reg.schoolId))
          .limit(1)

        const participants = await db
          .select()
          .from(registrationParticipants)
          .where(eq(registrationParticipants.registrationId, reg.id))

        return {
          id: reg.id,
          teamName: reg.teamName,
          createdAt: reg.createdAt,
          event: eventData ? { id: eventData.id, name: eventData.name, eventType: eventData.eventType } : null,
          school: school ? { id: school.id, name: school.name } : null,
          participantCount: participants.length,
        }
      })
    )

    // Apply search filter in memory if needed
    let filteredResults = results
    if (search) {
      const searchLower = search.toLowerCase()
      filteredResults = results.filter(r =>
        r.teamName?.toLowerCase().includes(searchLower) ||
        r.event?.name?.toLowerCase().includes(searchLower) ||
        r.school?.name?.toLowerCase().includes(searchLower)
      )
    }

    return createPaginatedResponse(filteredResults, total, { page, limit, search, sortBy, sortOrder, filters })
  } catch (error) {
    console.error("Error fetching registrations:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch registrations",
    })
  }
})
