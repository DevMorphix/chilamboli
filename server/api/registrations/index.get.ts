import { connectDB } from "../../utils/db"
import { Registration } from "../../database/models"

export default defineEventHandler(async (event) => {
  await connectDB(event)
  const query = getQuery(event)

  const eventId = query.eventId as string | null
  const schoolId = query.schoolId as string | null

  try {
    const filter: any = {}
    if (eventId) filter.eventId = eventId
    if (schoolId) filter.schoolId = schoolId

    const registrations = await Registration.find(filter).lean()

    // Fetch related data
    const Event = (await import("../../database/models")).Event
    const School = (await import("../../database/models")).School

    const results = await Promise.all(
      registrations.map(async (reg: any) => {
        const event = await Event.findOne({ id: reg.eventId }).lean()
        const school = await School.findOne({ id: reg.schoolId }).lean()
        return {
          id: reg.id,
          teamName: reg.teamName,
          createdAt: reg.createdAt,
          event: event ? { id: event.id, name: event.name, eventType: event.eventType } : null,
          school: school ? { id: school.id, name: school.name } : null,
          participantCount: reg.participantIds?.length || 0,
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
