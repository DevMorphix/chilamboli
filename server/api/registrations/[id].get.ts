import { useDB } from "../../utils/db"
import { registrations, events, schools, students, registrationParticipants } from "../../database/schema"
import { eq, inArray } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const id = event.context.params?.id

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Registration ID is required",
    })
  }

  try {
    const [registration] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, id))
      .limit(1)

    if (!registration) {
      throw createError({
        statusCode: 404,
        message: "Registration not found",
      })
    }

    // Fetch related data
    const [eventData] = await db
      .select()
      .from(events)
      .where(eq(events.id, registration.eventId))
      .limit(1)

    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.id, registration.schoolId))
      .limit(1)

    // Get participant IDs from junction table
    const participantRecords = await db
      .select()
      .from(registrationParticipants)
      .where(eq(registrationParticipants.registrationId, registration.id))

    const participantIds = participantRecords.map((p) => p.studentId)

    let participants: (typeof students.$inferSelect)[] = []
    if (participantIds.length > 0) {
      participants = await db
        .select()
        .from(students)
        .where(inArray(students.id, participantIds))
    }

    return {
      id: registration.id,
      teamName: registration.teamName,
      createdAt: registration.createdAt,
      event: eventData,
      school,
      participants,
    }
  } catch (error: any) {
    console.error("Error fetching registration:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to fetch registration",
    })
  }
})
