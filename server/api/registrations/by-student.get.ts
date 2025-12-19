import { useDB } from "../../utils/db"
import { registrations, events, students, registrationParticipants } from "../../database/schema"
import { eq, desc, asc, inArray, count, and } from "drizzle-orm"
import { getPaginationParams, createPaginatedResponse } from "../../utils/pagination"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const { studentId } = query
  const { page, limit, search, sortBy, sortOrder, filters } = getPaginationParams(query)

  if (!studentId) {
    throw createError({
      statusCode: 400,
      message: "Student ID is required",
    })
  }

  try {
    // Find registrations that include this student
    const participantRecords = await db
      .select()
      .from(registrationParticipants)
      .where(
        and(
          eq(registrationParticipants.participantId, studentId as string),
          eq(registrationParticipants.participantType, "student")
        )
      )

    const registrationIds = participantRecords.map((p) => p.registrationId)

    if (registrationIds.length === 0) {
      return {
        success: true,
        ...createPaginatedResponse([], 0, { page, limit, search, sortBy, sortOrder, filters }),
      }
    }

    const whereClause = inArray(registrations.id, registrationIds)

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

        // Get all participants for this registration
        const allParticipantRecords = await db
          .select()
          .from(registrationParticipants)
          .where(eq(registrationParticipants.registrationId, reg.id))

        const studentParticipantIds = allParticipantRecords
          .filter((p) => p.participantType === "student")
          .map((p) => p.participantId)

        let participants: (typeof students.$inferSelect)[] = []
        if (studentParticipantIds.length > 0) {
          participants = await db
            .select()
            .from(students)
            .where(inArray(students.id, studentParticipantIds))
        }

        return {
          ...reg,
          event: eventData,
          participants,
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
        r.participants?.some(p => p.studentName?.toLowerCase().includes(searchLower))
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
