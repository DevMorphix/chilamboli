import { connectDB } from "../../utils/db"
import { Registration, Event, Student } from "../../database/models"

export default defineEventHandler(async (event) => {
  await connectDB(event)
  const query = getQuery(event)
  const { schoolId } = query

  if (!schoolId) {
    throw createError({
      statusCode: 400,
      message: "School ID is required",
    })
  }

  try {
    const registrations = await Registration.find({
      schoolId: schoolId as string,
    })
      .sort({ createdAt: -1 })
      .lean()

    // Populate event and participant details
    const registrationsWithDetails = await Promise.all(
      registrations.map(async (reg) => {
        const eventData = await Event.findOne({ id: reg.eventId }).lean()
        const participants = await Student.find({ id: { $in: reg.participantIds } }).lean()

        return {
          ...reg,
          event: eventData,
          participants,
        }
      }),
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
