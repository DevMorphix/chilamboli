import { useDB } from "../../utils/db"
import { registrations, events, students, registrationParticipants } from "../../database/schema"
import { eq, desc, inArray } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const { schoolId } = query

  if (!schoolId) {
    throw createError({
      statusCode: 400,
      message: "School ID is required",
    })
  }

  try {
    const registrationList = await db
      .select()
      .from(registrations)
      .where(eq(registrations.schoolId, schoolId as string))
      .orderBy(desc(registrations.createdAt))

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

        const participantIds = participantRecords.map((p) => p.studentId)

        let participants: (typeof students.$inferSelect)[] = []
        if (participantIds.length > 0) {
          participants = await db
            .select()
            .from(students)
            .where(inArray(students.id, participantIds))
        }

        return {
          ...reg,
          event: eventData,
          participants,
        }
      })
    )

    return {
      success: true,
      registrations: registrationsWithDetails,
    }
  } catch (error) {
    console.error("Error fetching registrations:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch registrations",
    })
  }
})
