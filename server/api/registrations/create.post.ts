import { connectDB, withTransaction } from "../../utils/db"
import { Event, Student, Registration } from "../../database/models"

export default defineEventHandler(async (event) => {
  await connectDB()
  const body = await readBody(event)

  const { eventId, schoolId, teamName, captainData, teamMembers } = body

  if (!eventId || !schoolId) {
    throw createError({
      statusCode: 400,
      message: "Missing required fields",
    })
  }

  try {
    // Fetch the event to validate (outside transaction for read-only)
    const eventData = await Event.findOne({ id: eventId })

    if (!eventData) {
      throw createError({
        statusCode: 404,
        message: "Event not found",
      })
    }

    // Validate team size
    const totalMembers = teamMembers ? teamMembers.length + 1 : 1 // +1 for captain
    if (eventData.maxTeamSize && totalMembers > eventData.maxTeamSize) {
      throw createError({
        statusCode: 400,
        message: `Team size exceeds maximum of ${eventData.maxTeamSize}`,
      })
    }

    // Use transaction for all write operations
    const result = await withTransaction(async (session) => {
      // Step 1: Create or get captain student record
      let captainId: string

      if (captainData.isNew) {
        // Create new student for captain within transaction
        const newCaptain = await Student.create(
          [
            {
              firstName: captainData.firstName,
              lastName: captainData.lastName,
              email: captainData.email || null,
              phone: captainData.phone || null,
              dateOfBirth: captainData.dateOfBirth,
              schoolId,
            },
          ],
          { session }
        )

        captainId = newCaptain[0].id
      } else {
        captainId = captainData.id
      }

      // Step 2: Create new team members if any
      const newMemberIds: string[] = []
      if (teamMembers && teamMembers.length > 0) {
        for (const member of teamMembers) {
          if (member.isNew) {
            const newMember = await Student.create(
              [
                {
                  firstName: member.firstName,
                  lastName: member.lastName,
                  email: member.email || null,
                  phone: member.phone || null,
                  dateOfBirth: member.dateOfBirth,
                  schoolId,
                },
              ],
              { session }
            )
            newMemberIds.push(newMember[0].id)
          } else {
            newMemberIds.push(member.id)
          }
        }
      }

      // Step 3: Validate age restrictions for group events
      if (eventData.eventType === "group" && (newMemberIds.length > 0 || captainData.isNew)) {
        const allStudentIds = [captainId, ...newMemberIds]
        const students = await Student.find({ id: { $in: allStudentIds } }).session(session)

        // Validate all students are in the correct age range
        const today = new Date()
        for (const student of students) {
          const birthDate = new Date(student.dateOfBirth)
          let age = today.getFullYear() - birthDate.getFullYear()
          const monthDiff = today.getMonth() - birthDate.getMonth()

          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--
          }

          if (age < eventData.minAge || age > eventData.maxAge) {
            throw createError({
              statusCode: 400,
              message: `Student ${student.firstName} ${student.lastName} (age ${age}) is not in the required age range (${eventData.minAge}-${eventData.maxAge})`,
            })
          }
        }
      }

      // Step 4: Create the registration with participants embedded
      const participantIdsList = [captainId, ...newMemberIds]

      const registration = await Registration.create(
        [
          {
            eventId,
            schoolId,
            teamName: teamName || null,
            participantIds: participantIdsList,
          },
        ],
        { session }
      )

      return {
        success: true,
        registrationId: registration[0].id,
        message: "Registration completed successfully",
      }
    })

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
