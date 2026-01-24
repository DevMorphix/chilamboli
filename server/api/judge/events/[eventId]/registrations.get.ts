import { useDB } from "../../../../utils/db"
import {
  eventJudges,
  events,
  registrations,
  registrationParticipants,
  students,
  faculty,
  schools,
  judgments,
} from "../../../../database/schema"
import { eq, and, inArray } from "drizzle-orm"

// Get registrations for an event assigned to a judge.
// Optimized: assignment+event in one query, judgments filtered by registrationIds,
// batch-fetch students/faculty to eliminate N+1.
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const eventId = getRouterParam(event, "eventId")
  const query = getQuery(event)
  const judgeId = query.judgeId as string

  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: "Event ID is required",
    })
  }

  if (!judgeId) {
    throw createError({
      statusCode: 400,
      message: "Judge ID is required",
    })
  }

  try {
    const [assignmentWithEvent] = await db
      .select({
        id: events.id,
        name: events.name,
        description: events.description,
        eventType: events.eventType,
        ageCategory: events.ageCategory,
        gender: events.gender,
        maxTeamSize: events.maxTeamSize,
        isCompleted: events.isCompleted,
        createdAt: events.createdAt,
      })
      .from(eventJudges)
      .innerJoin(events, eq(eventJudges.eventId, events.id))
      .where(and(eq(eventJudges.judgeId, judgeId), eq(eventJudges.eventId, eventId)))
      .limit(1)

    if (!assignmentWithEvent) {
      throw createError({
        statusCode: 403,
        message: "Judge is not assigned to this event",
      })
    }

    const eventData = assignmentWithEvent

    // Get all registrations for this event
    const registrationsList = await db
      .select({
        registration: registrations,
        school: schools,
        participants: registrationParticipants,
      })
      .from(registrations)
      .innerJoin(schools, eq(registrations.schoolId, schools.id))
      .leftJoin(registrationParticipants, eq(registrations.id, registrationParticipants.registrationId))
      .where(eq(registrations.eventId, eventId))

    // Get all registration IDs
    const registrationIds = Array.from(new Set(registrationsList.map((r) => r.registration.id)))

    const relevantJudgments =
      registrationIds.length > 0
        ? await db
            .select()
            .from(judgments)
            .where(
              and(
                eq(judgments.judgeId, judgeId),
                inArray(judgments.registrationId, registrationIds)
              )
            )
        : []

    const judgmentsMap = new Map(relevantJudgments.map((j) => [j.registrationId, j]))

    // Group participants by registration
    const registrationsMap = new Map<string, any>()
    for (const row of registrationsList) {
      const regId = row.registration.id
      if (!registrationsMap.has(regId)) {
        registrationsMap.set(regId, {
          ...row.registration,
          school: row.school,
          participants: [],
          judgment: judgmentsMap.get(regId) || null,
        })
      }
      if (row.participants) {
        registrationsMap.get(regId)!.participants.push(row.participants)
      }
    }

    const studentIds = new Set<string>()
    const facultyIds = new Set<string>()
    for (const reg of registrationsMap.values()) {
      for (const p of reg.participants) {
        if (p.participantType === "student") studentIds.add(p.participantId)
        else if (p.participantType === "faculty") facultyIds.add(p.participantId)
      }
    }

    const [studentsList, facultyList] = await Promise.all([
      studentIds.size > 0
        ? db.select().from(students).where(inArray(students.id, [...studentIds]))
        : [],
      facultyIds.size > 0
        ? db.select().from(faculty).where(inArray(faculty.id, [...facultyIds]))
        : [],
    ])

    const studentMap = new Map(studentsList.map((s) => [s.id, s]))
    const facultyMap = new Map(facultyList.map((f) => [f.id, f]))

    const registrationArray = Array.from(registrationsMap.values())
    for (const reg of registrationArray) {
      for (const participant of reg.participants) {
        if (participant.participantType === "student") {
          participant.details = studentMap.get(participant.participantId) ?? null
        } else if (participant.participantType === "faculty") {
          participant.details = facultyMap.get(participant.participantId) ?? null
        }
      }
    }

    return {
      success: true,
      event: eventData,
      registrations: registrationArray,
    }
  } catch (error: any) {
    console.error("Error fetching event registrations:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to fetch event registrations",
    })
  }
})
