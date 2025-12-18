import { useDB } from "../../utils/db"
import { registrations, events, schools, registrationParticipants } from "../../database/schema"
import { eq, and } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)

  const eventId = query.eventId as string | null
  const schoolId = query.schoolId as string | null

  try {
    let registrationList

    if (eventId && schoolId) {
      registrationList = await db
        .select()
        .from(registrations)
        .where(and(eq(registrations.eventId, eventId), eq(registrations.schoolId, schoolId)))
    } else if (eventId) {
      registrationList = await db
        .select()
        .from(registrations)
        .where(eq(registrations.eventId, eventId))
    } else if (schoolId) {
      registrationList = await db
        .select()
        .from(registrations)
        .where(eq(registrations.schoolId, schoolId))
    } else {
      registrationList = await db.select().from(registrations)
    }

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

    return results
  } catch (error) {
    console.error("Error fetching registrations:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch registrations",
    })
  }
})
