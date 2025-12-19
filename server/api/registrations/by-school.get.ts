import { useDB } from "../../utils/db"
import { registrations, events, students, registrationParticipants, faculty } from "../../database/schema"
import { eq, desc, asc, inArray, count, and } from "drizzle-orm"
import { getPaginationParams, createPaginatedResponse } from "../../utils/pagination"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const { schoolId } = query
  const { page, limit, search, sortBy, sortOrder, filters } = getPaginationParams(query)

  if (!schoolId) {
    throw createError({
      statusCode: 400,
      message: "School ID is required",
    })
  }

  try {
    let whereClause: any = eq(registrations.schoolId, schoolId as string)

    // Apply filters
    if (filters?.eventId) {
      whereClause = and(
        eq(registrations.schoolId, schoolId as string),
        eq(registrations.eventId, filters.eventId as string)
      )
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
    const registrationList = await db
      .select()
      .from(registrations)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset)

    // Populate event and participant details
    const registrationsWithDetails = await Promise.all(
      registrationList.map(async (reg) => {
        const [eventData] = await db
          .select()
          .from(events)
          .where(eq(events.id, reg.eventId))
          .limit(1)

        // Get participant IDs from junction table
        const participantRecords = await db
          .select()
          .from(registrationParticipants)
          .where(eq(registrationParticipants.registrationId, reg.id))

        const studentIds = participantRecords
          .filter((p) => p.participantType === "student")
          .map((p) => p.participantId)
        const facultyIds = participantRecords
          .filter((p) => p.participantType === "faculty")
          .map((p) => p.participantId)

        let participants: (typeof students.$inferSelect)[] = []
        let facultyParticipants: (typeof faculty.$inferSelect)[] = []
        
        if (studentIds.length > 0) {
          participants = await db
            .select()
            .from(students)
            .where(inArray(students.id, studentIds))
        }
        
        if (facultyIds.length > 0) {
          facultyParticipants = await db
            .select()
            .from(faculty)
            .where(inArray(faculty.id, facultyIds))
        }

        return {
          ...reg,
          event: eventData || null,
          participants,
          facultyParticipants,
          participantIds: studentIds,
        }
      })
    )

    // Apply search filter in memory if needed
    let filteredResults = registrationsWithDetails
    if (search) {
      const searchLower = search.toLowerCase()
      filteredResults = registrationsWithDetails.filter(r =>
        r.teamName?.toLowerCase().includes(searchLower) ||
        r.event?.name?.toLowerCase().includes(searchLower) ||
        r.participants?.some(p => p.studentName?.toLowerCase().includes(searchLower)) ||
        r.facultyParticipants?.some(p => p.facultyName?.toLowerCase().includes(searchLower))
      )
    }

    return {
      success: true,
      ...createPaginatedResponse(filteredResults, total, { page, limit, search, sortBy, sortOrder, filters }),
    }
  } catch (error) {
    console.error("Error fetching registrations:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch registrations",
    })
  }
})
