import { useDB } from "../../utils/db"
import { events, students, registrations, registrationParticipants } from "../../database/schema"
import { eq, inArray } from "drizzle-orm"
import { nanoid } from "nanoid"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
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

    // Fetch all participants
    const participants = await db
      .select()
      .from(students)
      .where(inArray(students.id, participantIds))

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
      // Find all registrations this participant is part of
      const participantRegistrations = await db
        .select()
        .from(registrationParticipants)
        .where(eq(registrationParticipants.studentId, participant.id))

      const existingRegIds = participantRegistrations.map((pr) => pr.registrationId)

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

    // Create the registration
    const registrationId = nanoid()
    await db.insert(registrations).values({
      id: registrationId,
      eventId,
      schoolId,
      teamName: teamName || null,
      registeredByFacultyId,
    })

    // Create participant entries in the junction table
    const participantEntries = participantIds.map((studentId: string) => ({
      id: nanoid(),
      registrationId,
      studentId,
    }))

    await db.insert(registrationParticipants).values(participantEntries)

    return {
      success: true,
      registrationId,
      message: "Registration completed successfully",
    }
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
