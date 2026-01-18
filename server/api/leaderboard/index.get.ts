import { useDB } from "../../utils/db"
import {
  registrations,
  judgments,
  events,
  eventJudges,
  schools,
  students,
  registrationParticipants,
} from "../../database/schema"
import { eq, sql, and } from "drizzle-orm"
import { calculateGrade } from "../../utils/grading"

// Get leaderboard - supports different types: 'event', 'school', 'district', 'best-performer'
// 'event': Individual registrations ranked by raw scores
// 'school': Schools ranked by sum of grade points from all their registrations
// 'district'/'location': Districts/locations ranked by sum of grade points from all schools in that location
// 'best-performer': Students ranked by sum of raw scores across all their registrations (requires gender param: 'male' or 'female')
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const type = (query.type as string) || "event"
  const eventId = query.eventId as string | undefined
  const schoolId = query.schoolId as string | undefined
  const gender = query.gender as string | undefined // Required for 'best-performer' type
  const limit = parseInt((query.limit as string) || "10")

  try {
    // Handle best performer leaderboard (students ranked by raw scores)
    if (type === "best-performer") {
      if (!gender || (gender !== "male" && gender !== "female")) {
        throw createError({
          statusCode: 400,
          message: "Gender parameter is required for best-performer type (must be 'male' or 'female')",
        })
      }

      // Sum raw scores across all registrations for each student
      const studentResults = await db
        .select({
          studentId: students.id,
          studentName: students.studentName,
          schoolId: students.schoolId,
          schoolName: schools.name,
          schoolCode: schools.schoolCode,
          totalScore: sql<number>`COALESCE(SUM(${judgments.score}), 0)`.as("total_score"),
        })
        .from(students)
        .innerJoin(registrationParticipants, eq(students.id, registrationParticipants.participantId))
        .innerJoin(registrations, eq(registrationParticipants.registrationId, registrations.id))
        .leftJoin(judgments, eq(registrations.id, judgments.registrationId))
        .leftJoin(schools, eq(students.schoolId, schools.id))
        .where(
          and(
            eq(students.gender, gender),
            eq(registrationParticipants.participantType, "student")
          )
        )
        .groupBy(students.id, schools.id)

      const leaderboard = studentResults
        .filter((r) => (r.totalScore || 0) > 0)
        .map((r) => ({
          studentId: r.studentId,
          studentName: r.studentName,
          schoolId: r.schoolId,
          schoolName: r.schoolName,
          schoolCode: r.schoolCode,
          totalScore: Math.round((r.totalScore || 0) * 10) / 10,
        }))
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, limit)
        .map((item, index) => ({ ...item, rank: index + 1 }))

      return { success: true, type, gender, leaderboard }
    }

    // Get total judges per event (needed for school/district/event types)
    const eventJudgesCount = await db
      .select({
        eventId: eventJudges.eventId,
        judgeCount: sql<number>`COUNT(DISTINCT ${eventJudges.judgeId})`.as("judge_count"),
      })
      .from(eventJudges)
      .groupBy(eventJudges.eventId)

    const judgesCountMap = new Map(
      eventJudgesCount.map((ej) => [ej.eventId, ej.judgeCount])
    )

    // Handle aggregated leaderboards (school and district)
    if (type === "school" || type === "district" || type === "location") {
      // Get all registrations with scores
      const registrationResults = await db
        .select({
          registrationId: registrations.id,
          eventId: registrations.eventId,
          schoolId: registrations.schoolId,
          schoolName: schools.name,
          schoolCode: schools.schoolCode,
          location: schools.location,
          totalScore: sql<number>`COALESCE(SUM(${judgments.score}), 0)`.as("total_score"),
          judgeCount: sql<number>`COUNT(DISTINCT ${judgments.judgeId})`.as("judge_count"),
        })
        .from(registrations)
        .leftJoin(schools, eq(registrations.schoolId, schools.id))
        .leftJoin(judgments, eq(registrations.id, judgments.registrationId))
        .groupBy(registrations.id, schools.id)

      // Calculate grade points for each registration
      const registrationsWithGradePoints = registrationResults
        .filter((r) => (r.totalScore || 0) > 0)
        .map((r) => {
          const maxScore = judgesCountMap.get(r.eventId) || r.judgeCount || 1
          const gradeInfo = calculateGrade(r.totalScore || 0, maxScore * 10)
          return {
            schoolId: r.schoolId,
            schoolName: r.schoolName,
            schoolCode: r.schoolCode,
            location: r.location,
            gradePoint: gradeInfo.gradePoint,
          }
        })

      // Aggregate grade points by school or location
      if (type === "school") {
        // School leaderboard: sum grade points per school
        const schoolMap = new Map<
          string,
          { schoolId: string; schoolName: string; schoolCode: string; totalGradePoints: number }
        >()

        for (const reg of registrationsWithGradePoints) {
          if (!reg.schoolId) continue

          const existing = schoolMap.get(reg.schoolId)
          if (existing) {
            existing.totalGradePoints += reg.gradePoint
          } else {
            schoolMap.set(reg.schoolId, {
              schoolId: reg.schoolId,
              schoolName: reg.schoolName || "",
              schoolCode: reg.schoolCode || "",
              totalGradePoints: reg.gradePoint,
            })
          }
        }

        const leaderboard = Array.from(schoolMap.values())
          .sort((a, b) => b.totalGradePoints - a.totalGradePoints)
          .slice(0, limit)
          .map((item, index) => ({
            ...item,
            totalGradePoints: Math.round(item.totalGradePoints * 10) / 10,
            rank: index + 1,
          }))

        return { success: true, type, leaderboard }
      }

      // District/Location leaderboard: sum grade points per location
      const locationMap = new Map<string, { location: string; totalGradePoints: number }>()

      for (const reg of registrationsWithGradePoints) {
        const location = reg.location || "Unknown"
        const existing = locationMap.get(location)
        if (existing) {
          existing.totalGradePoints += reg.gradePoint
        } else {
          locationMap.set(location, { location, totalGradePoints: reg.gradePoint })
        }
      }

      const leaderboard = Array.from(locationMap.values())
        .sort((a, b) => b.totalGradePoints - a.totalGradePoints)
        .slice(0, limit)
        .map((item, index) => ({
          ...item,
          totalGradePoints: Math.round(item.totalGradePoints * 10) / 10,
          rank: index + 1,
        }))

      return { success: true, type, leaderboard }
    }

    // Handle individual registration leaderboards (event type only now)
    // Build where clause based on type
    let whereClause: any = undefined
    if (type === "event" && eventId) {
      whereClause = eq(registrations.eventId, eventId)
    } else if (type === "school" && schoolId) {
      whereClause = eq(registrations.schoolId, schoolId)
    }

    // Get registrations with scores
    const results = await db
      .select({
        registrationId: registrations.id,
        eventId: registrations.eventId,
        eventName: events.name,
        eventType: events.eventType,
        ageCategory: events.ageCategory,
        teamName: registrations.teamName,
        schoolId: registrations.schoolId,
        schoolName: schools.name,
        schoolCode: schools.schoolCode,
        totalScore: sql<number>`COALESCE(SUM(${judgments.score}), 0)`.as("total_score"),
        judgeCount: sql<number>`COUNT(DISTINCT ${judgments.judgeId})`.as("judge_count"),
      })
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .leftJoin(schools, eq(registrations.schoolId, schools.id))
      .leftJoin(judgments, eq(registrations.id, judgments.registrationId))
      .where(whereClause)
      .groupBy(registrations.id, events.id, schools.id)

    // Event leaderboard: ranked by raw scores
    const leaderboard = results
      .map((r) => {
        const maxScore = judgesCountMap.get(r.eventId) || r.judgeCount || 1
        const gradeInfo = calculateGrade(r.totalScore || 0, maxScore * 10)
        return {
          registrationId: r.registrationId,
          eventId: r.eventId,
          eventName: r.eventName,
          eventType: r.eventType,
          ageCategory: r.ageCategory,
          teamName: r.teamName,
          schoolId: r.schoolId,
          schoolName: r.schoolName,
          schoolCode: r.schoolCode,
          totalScore: Math.round((r.totalScore || 0) * 10) / 10,
          normalizedScore: gradeInfo.normalizedScore,
          grade: gradeInfo.grade,
          gradePoint: gradeInfo.gradePoint,
          judgeCount: r.judgeCount || 0,
        }
      })
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
      .map((item, index) => ({ ...item, rank: index + 1 }))

    return { success: true, type, leaderboard }
  } catch (error: any) {
    console.error("Error fetching leaderboard:", error)

    throw createError({
      statusCode: 500,
      message: "Failed to fetch leaderboard",
    })
  }
})
