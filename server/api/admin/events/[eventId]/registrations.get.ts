import { useDB } from "../../../../utils/db"
import { events, registrations, schools } from "../../../../database/schema"
import { eq, asc } from "drizzle-orm"

// Get event and its registrations (for scoring sheet etc.). No judgments required.
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const eventId = getRouterParam(event, "eventId")

  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: "Event ID is required",
    })
  }

  try {
    const [eventData] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!eventData) {
      throw createError({
        statusCode: 404,
        message: "Event not found",
      })
    }

    const regsWithSchools = await db
      .select({
        id: registrations.id,
        chestNumber: registrations.chestNumber,
        teamName: registrations.teamName,
        schoolId: registrations.schoolId,
        schoolName: schools.name,
        schoolCode: schools.schoolCode,
      })
      .from(registrations)
      .leftJoin(schools, eq(registrations.schoolId, schools.id))
      .where(eq(registrations.eventId, eventId))
      .orderBy(asc(registrations.chestNumber), asc(registrations.createdAt))

    const registrationsList = regsWithSchools.map((r) => ({
      id: r.id,
      chestNumber: r.chestNumber ?? null,
      teamName: r.teamName ?? null,
      schoolId: r.schoolId ?? null,
      schoolName: r.schoolName ?? "-",
      schoolCode: r.schoolCode ?? null,
    }))

    return {
      success: true,
      event: {
        id: eventData.id,
        name: eventData.name,
        eventType: eventData.eventType,
        ageCategory: eventData.ageCategory,
        gender: eventData.gender,
      },
      registrations: registrationsList,
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error("Error fetching event registrations:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch event registrations",
    })
  }
})
