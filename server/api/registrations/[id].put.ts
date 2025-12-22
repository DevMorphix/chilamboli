import { useDB } from "../../utils/db"
import { events, students, registrations, registrationParticipants, faculty } from "../../database/schema"
import { eq, inArray, and } from "drizzle-orm"
import { nanoid } from "nanoid"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const id = event.context.params?.id
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Registration ID is required",
    })
  }

  const { teamName, participantIds } = body

  if (!participantIds || participantIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: "At least one participant is required",
    })
  }

  try {
    // Fetch existing registration
    const [existingRegistration] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, id))
      .limit(1)

    if (!existingRegistration) {
      throw createError({
        statusCode: 404,
        message: "Registration not found",
      })
    }

    // Fetch the event
    const [eventData] = await db
      .select()
      .from(events)
      .where(eq(events.id, existingRegistration.eventId))
      .limit(1)

    if (!eventData) {
      throw createError({
        statusCode: 404,
        message: "Event not found",
      })
    }

    // Prevent editing special individual events (faculty self-registrations)
    if (eventData.ageCategory === "Special" && eventData.eventType === "Individual") {
      throw createError({
        statusCode: 400,
        message: "Special events (faculty self-registrations) cannot be edited",
      })
    }

    // Check if this is a special group event (faculty participants)
    const isSpecialGroupEvent = eventData.ageCategory === "Special" && eventData.eventType === "Group"

    // Fetch all participants (students or faculty based on event type)
    let participants: any[] = []
    let participantType: "student" | "faculty" = "student"

    if (isSpecialGroupEvent) {
      // For special group events, participants are faculty members
      participants = await db
        .select()
        .from(faculty)
        .where(inArray(faculty.id, participantIds))
      participantType = "faculty"
    } else {
      // For regular events, participants are students
      participants = await db
        .select()
        .from(students)
        .where(inArray(students.id, participantIds))
      participantType = "student"
    }

    if (participants.length !== participantIds.length) {
      throw createError({
        statusCode: 404,
        message: "One or more participants not found",
      })
    }

    // Validate all participants are from the same school
    const allFromSameSchool = participants.every((p) => p.schoolId === existingRegistration.schoolId)
    if (!allFromSameSchool) {
      throw createError({
        statusCode: 400,
        message: "All participants must be from the same school",
      })
    }

    // Validate age category for non-combined and non-special events (only for students)
    if (!isSpecialGroupEvent && eventData.ageCategory !== "Combined" && eventData.ageCategory !== "Special") {
      const wrongCategoryParticipants = participants.filter((p) => p.ageCategory !== eventData.ageCategory)

      if (wrongCategoryParticipants.length > 0) {
        throw createError({
          statusCode: 400,
          message: `All participants must be in ${eventData.ageCategory} category for this event`,
        })
      }
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

    // Validate individual events - must have exactly 1 participant
    if (eventData.eventType === "Individual") {
      if (participants.length !== 1) {
        throw createError({
          statusCode: 400,
          message: "Individual events must have exactly one participant",
        })
      }
    }

    // Check participation limits for each participant
    // Rule: 1 Individual + 1 Group (+ Fashion Show special, + Combined not counted)
    // But exclude the current registration when checking
    // Note: This validation only applies to students, not faculty
    if (!isSpecialGroupEvent) {
      for (const participant of participants) {
        // Find all registrations this participant is part of
        const participantRegistrations = await db
          .select()
          .from(registrationParticipants)
          .where(
            and(
              eq(registrationParticipants.participantId, participant.id),
              eq(registrationParticipants.participantType, "student")
            )
          )

      const existingRegIds = participantRegistrations
        .map((pr) => pr.registrationId)
        .filter((regId) => regId !== id) // Exclude current registration

      if (existingRegIds.length === 0) continue

      const existingRegs = await db
        .select()
        .from(registrations)
        .where(inArray(registrations.id, existingRegIds))

      // Count registrations by type
      let individualCount = 0
      let groupCount = 0

      for (const reg of existingRegs) {
        const [regEvent] = await db
          .select()
          .from(events)
          .where(eq(events.id, reg.eventId))
          .limit(1)

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
    }

    // Update the registration
    const updateData: Partial<typeof registrations.$inferInsert> = {}
    if (teamName !== undefined) {
      updateData.teamName = teamName || null
    }

    await db
      .update(registrations)
      .set(updateData)
      .where(eq(registrations.id, id))

    // Delete existing participants
    await db
      .delete(registrationParticipants)
      .where(eq(registrationParticipants.registrationId, id))

    // Create new participant entries in the junction table
    const participantEntries = participantIds.map((participantId: string) => ({
      id: nanoid(),
      registrationId: id,
      participantId: participantId,
      participantType: participantType,
    }))

    await db.insert(registrationParticipants).values(participantEntries)

    return {
      success: true,
      registrationId: id,
      message: "Registration updated successfully",
    }
  } catch (error: any) {
    console.error("Error updating registration:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to update registration",
    })
  }
})

