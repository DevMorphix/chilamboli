import { connectDB } from "../../utils/db"
import { Registration } from "../../database/models"

export default defineEventHandler(async (event) => {
  await connectDB()
  const id = event.context.params?.id

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Registration ID is required",
    })
  }

  try {
    const registration = await Registration.findOne({ id }).lean()

    if (!registration) {
      throw createError({
        statusCode: 404,
        message: "Registration not found",
      })
    }

    // Fetch related data
    const { Event, School, Student } = await import("../../database/models")
    const event = await Event.findOne({ id: (registration as any).eventId }).lean()
    const school = await School.findOne({ id: (registration as any).schoolId }).lean()
    const participants = await Student.find({ id: { $in: (registration as any).participantIds || [] } }).lean()

    return {
      id: (registration as any).id,
      teamName: (registration as any).teamName,
      createdAt: (registration as any).createdAt,
      event,
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
