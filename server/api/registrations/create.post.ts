import { connectDB, withTransaction } from "../../utils/db"
import { Event, Student, Registration } from "../../database/models"

export default defineEventHandler(async (event) => {
  await connectDB(event)
  const body = await readBody(event)

  const { eventId, schoolId, teamName, participantIds, registeredByFacultyId } = body

  if (!eventId || !schoolId || !participantIds || participantIds.length === 0 || !registeredByFacultyId) {
    throw createError({
      statusCode: 400,
      message: "Missing required fields",
    })
  }

  try {
    // Fetch the event
    const eventData = await Event.findOne({ id: eventId })

    if (!eventData) {
      throw createError({
        statusCode: 404,
        message: "Event not found",
      })
    }

    // Use transaction for all operations
    const result = await withTransaction(async (session) => {
      // Fetch all participants
      const participants = await Student.find({ id: { $in: participantIds } }).session(session)

      if (participants.length !== participantIds.length) {
        throw createError({
          statusCode: 404,
          message: "One or more participants not found",
        })
      }

      // Validate all participants are from the same school
      const allFromSameSchool = participants.every((p) => p.schoolId === schoolId)
      if (!allFromSameSchool) {
        throw createError({
          statusCode: 400,
          message: "All participants must be from the same school",
        })
      }

      // Validate age category for non-combined events
      if (eventData.ageCategory !== "Combined") {
        const wrongCategoryParticipants = participants.filter((p) => p.ageCategory !== eventData.ageCategory)

        if (wrongCategoryParticipants.length > 0) {
          throw createError({
            statusCode: 400,
            message: `All participants must be in ${eventData.ageCategory} category for this event`,
          })
        }
      }

      // Validate gender requirements
      if (eventData.gender && eventData.gender !== "All") {
        // This would require gender field in student model
        // For now, we'll skip gender validation
      }

      // Validate team size for group events
      if (eventData.eventType === "Group" && eventData.maxTeamSize) {
        if (participants.length > eventData.maxTeamSize) {
          throw createError({
            statusCode: 400,
            message: `Team size cannot exceed ${eventData.maxTeamSize} members`,
          })
        }

        if (!teamName) {
          throw createError({
            statusCode: 400,
            message: "Team name is required for group events",
          })
        }
      }

      // Check participation limits for each participant
      // Rule: 1 Individual + 1 Group (+ Fashion Show special, + Combined not counted)
      for (const participant of participants) {
        const existingRegistrations = await Registration.find({
          participantIds: participant.id,
        }).session(session)

        // Count registrations by type
        let individualCount = 0
        let groupCount = 0

        for (const reg of existingRegistrations) {
          const regEvent = await Event.findOne({ id: reg.eventId }).session(session)
          if (!regEvent) continue

          // Skip combined category events - they don't count toward limit
          if (regEvent.ageCategory === "Combined") continue

          // Skip Fashion Show - it's a special exception
          if (regEvent.name === "Fashion Show") continue

          if (regEvent.eventType === "Individual") {
            individualCount++
          } else if (regEvent.eventType === "Group") {
            groupCount++
          }
        }

        // Validate against current event type (if not Combined or Fashion Show)
        if (eventData.ageCategory !== "Combined" && eventData.name !== "Fashion Show") {
          if (eventData.eventType === "Individual" && individualCount >= 1) {
            throw createError({
              statusCode: 400,
              message: `${participant.studentName} has already registered for an individual event`,
            })
          }

          if (eventData.eventType === "Group" && groupCount >= 1) {
            throw createError({
              statusCode: 400,
              message: `${participant.studentName} has already registered for a group event`,
            })
          }
        }
      }

      // Create the registration
      const registration = await Registration.create(
        [
          {
            eventId,
            schoolId,
            teamName: teamName || null,
            participantIds,
            registeredByFacultyId,
          },
        ],
        { session },
      )

      return {
        success: true,
        registrationId: registration[0].id,
        message: "Registration completed successfully",
      }
    }, event)

    return result
  } catch (error: any) {
    console.error("Error creating registration:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to create registration",
    })
  }
})
