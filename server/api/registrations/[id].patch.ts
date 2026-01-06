import { useDB } from "../../utils/db"
import { events, students, registrations, registrationParticipants, faculty } from "../../database/schema"
import { eq, inArray, and } from "drizzle-orm"
import { nanoid } from "nanoid"

// Batch arrays to avoid SQLite's 999 variable limit
function chunkArray<T>(array: T[], chunkSize: number = 500): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

// Batch SELECT queries with inArray to avoid SQLite limits
async function batchSelect<T>(
  db: ReturnType<typeof useDB>,
  table: any,
  column: any,
  ids: string[]
): Promise<T[]> {
  if (ids.length === 0) return []
  
  const results: T[] = []
  for (const chunk of chunkArray(ids, 500)) {
    const chunkResults = await db.select().from(table).where(inArray(column, chunk))
    results.push(...chunkResults)
  }
  return results
}

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

    let participants: any[] = []
    let participantType: "student" | "faculty" = "student"

    if (isSpecialGroupEvent) {
      participants = await batchSelect(db, faculty, faculty.id, participantIds)
      participantType = "faculty"
    } else {
      participants = await batchSelect(db, students, students.id, participantIds)
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

    // Validate participation limits: 1 Individual + 1 Group per student
    // (Combined events and Fashion Show don't count)
    if (!isSpecialGroupEvent) {
      for (const participant of participants) {
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
          .filter((regId) => regId !== id)

        if (existingRegIds.length === 0) continue

        const existingRegs = await batchSelect(db, registrations, registrations.id, existingRegIds)
        const eventIds = [...new Set(existingRegs.map(reg => reg.eventId))]
        const eventMap = new Map<string, any>()
        
        for (const chunk of chunkArray(eventIds, 500)) {
          const eventsData = await db.select().from(events).where(inArray(events.id, chunk))
          eventsData.forEach(evt => eventMap.set(evt.id, evt))
        }

        let individualCount = 0
        let groupCount = 0

        for (const reg of existingRegs) {
          const regEvent = eventMap.get(reg.eventId)
          if (!regEvent || regEvent.ageCategory === "Combined" || regEvent.name === "Fashion Show") {
            continue
          }
          if (regEvent.eventType === "Individual") individualCount++
          else if (regEvent.eventType === "Group") groupCount++
        }

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

    // Transaction ensures atomicity - all operations succeed or all fail
    return await db.transaction(async (tx) => {
      const updateData: Partial<typeof registrations.$inferInsert> = {}
      if (teamName !== undefined) {
        updateData.teamName = teamName || null
      }

      await tx.update(registrations).set(updateData).where(eq(registrations.id, id))
      await tx.delete(registrationParticipants).where(eq(registrationParticipants.registrationId, id))

      const participantEntries = participantIds.map((participantId: string) => ({
        id: nanoid(),
        registrationId: id,
        participantId: participantId,
        participantType: participantType,
      }))

      for (const chunk of chunkArray(participantEntries, 200)) {
        await tx.insert(registrationParticipants).values(chunk)
      }

      return {
        success: true,
        registrationId: id,
        message: "Registration updated successfully",
      }
    })
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

