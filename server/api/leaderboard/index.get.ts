import { useDB } from "../../utils/db"
import {
  registrations,
  judgments,
  events,
  eventJudges,
  schools,
  students,
  registrationParticipants,
  positionRewards,
} from "../../database/schema"
import { eq, sql, and, inArray } from "drizzle-orm"
import { calculateGrade } from "../../utils/grading"

const CACHE_PREFIX = "leaderboard:"
const CACHE_TTL = 60 * 60 // 1 hour in seconds

interface CachedLeaderboard {
  data: any
  capturedAt: number
}

function getCacheKey(type: string, context?: string, eventId?: string, gender?: string, limit?: number): string {
  const parts = [CACHE_PREFIX, context || "admin", type]
  if (eventId) parts.push(`event:${eventId}`)
  if (gender) parts.push(`gender:${gender}`)
  if (limit) parts.push(`limit:${limit}`)
  return parts.join(":")
}

/**
 * Leaderboard API - supports multiple ranking types
 * - 'event': Individual registrations ranked by raw scores
 * - 'school': Schools ranked by sum of grade points
 * - 'district'/'location': Districts ranked by sum of grade points
 * - 'best-performer': Students ranked by sum of normalized scores (requires gender: 'male' or 'female')
 */
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const type = (query.type as string) || "event"
  const context = (query.context as string) || "admin" // "presentation" or "admin"
  const eventId = query.eventId as string | undefined
  const gender = query.gender as string | undefined
  const limit = parseInt((query.limit as string) || "10")

  const storage = useStorage("kv")
  const cacheKey = getCacheKey(type, context, eventId, gender, limit)

  try {
    // Try to get cached data FIRST to avoid unnecessary DB queries
    const cached = await storage.getItem<CachedLeaderboard>(cacheKey)
    if (cached) {
      return {
        ...cached.data,
        cached: true,
        dataCapturedAt: cached.capturedAt,
      }
    }
    
    // Get completed event IDs if context is "presentation" (only if cache miss)
    let completedEventIds: string[] | undefined = undefined
    if (context === "presentation") {
      const completedEvents = await db
        .select({ id: events.id })
        .from(events)
        .where(eq(events.isCompleted, true))
      completedEventIds = completedEvents.map((e) => e.id)
      
      // If no completed events, return empty leaderboard
      if (completedEventIds.length === 0) {
        return {
          success: true,
          type,
          leaderboard: [],
          cached: false,
        }
      }
    }
    // Best performer leaderboard - separate path
    if (type === "best-performer") {
      if (!gender || (gender !== "male" && gender !== "female")) {
        throw createError({
          statusCode: 400,
          message: "Gender parameter is required for best-performer type (must be 'male' or 'female')",
        })
      }

      // Build where clause for best-performer (filter by completed events if context is presentation)
      const bestPerformerWhereConditions: any[] = [
        eq(students.gender, gender),
        eq(registrationParticipants.participantType, "student")
      ]
      if (completedEventIds && completedEventIds.length > 0) {
        bestPerformerWhereConditions.push(inArray(registrations.eventId, completedEventIds))
      }
      const bestPerformerWhereClause = and(...bestPerformerWhereConditions)
      
      let bestPerformerJudgesQuery = db
        .select({
          eventId: eventJudges.eventId,
          judgeCount: sql<number>`COUNT(DISTINCT ${eventJudges.judgeId})`.as("judge_count"),
        })
        .from(eventJudges)
      if (completedEventIds && completedEventIds.length > 0) {
        bestPerformerJudgesQuery = bestPerformerJudgesQuery.where(
          inArray(eventJudges.eventId, completedEventIds)
        )
      }
      const [eventJudgesCount, registrationResults] = await Promise.all([
        bestPerformerJudgesQuery.groupBy(eventJudges.eventId),
        db
          .select({
            studentId: students.id,
            studentName: students.studentName,
            schoolId: students.schoolId,
            schoolName: schools.name,
            schoolCode: schools.schoolCode,
            eventId: registrations.eventId,
            totalScore: sql<number>`COALESCE(SUM(${judgments.score}), 0)`.as("total_score"),
          })
          .from(students)
          .innerJoin(registrationParticipants, eq(students.id, registrationParticipants.participantId))
          .innerJoin(registrations, eq(registrationParticipants.registrationId, registrations.id))
          .innerJoin(judgments, eq(registrations.id, judgments.registrationId))
          .leftJoin(schools, eq(students.schoolId, schools.id))
          .where(bestPerformerWhereClause)
          .groupBy(students.id, schools.id, registrations.id, registrations.eventId)
          .having(sql`COALESCE(SUM(${judgments.score}), 0) > 0`),
      ])

      const judgesCountMap = new Map(eventJudgesCount.map((ej) => [ej.eventId, ej.judgeCount]))

      // Aggregate normalized scores per student
      const studentScores = new Map<
        string,
        { studentId: string; studentName: string; schoolId: string; schoolName: string; schoolCode: string; totalScore: number }
      >()

      for (const reg of registrationResults) {
        const maxScore = judgesCountMap.get(reg.eventId) || 1
        const normalizedScore = maxScore > 0 ? ((reg.totalScore || 0) / (maxScore * 50)) * 100 : 0

        const existing = studentScores.get(reg.studentId)
        if (existing) {
          existing.totalScore += normalizedScore
        } else {
          studentScores.set(reg.studentId, {
            studentId: reg.studentId,
            studentName: reg.studentName,
            schoolId: reg.schoolId,
            schoolName: reg.schoolName || "",
            schoolCode: reg.schoolCode || "",
            totalScore: normalizedScore,
          })
        }
      }

      const leaderboard = Array.from(studentScores.values())
        .map((s) => ({ ...s, totalScore: Math.round(s.totalScore * 10) / 10 }))
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, limit)
        .map((item, index) => ({ ...item, rank: index + 1 }))

      const result = { success: true, type, gender, leaderboard }
      await storage.setItem(cacheKey, { data: result, capturedAt: Date.now() }, { ttl: CACHE_TTL })
      return result
    }

    let eventJudgesCountQuery = db
      .select({
        eventId: eventJudges.eventId,
        judgeCount: sql<number>`COUNT(DISTINCT ${eventJudges.judgeId})`.as("judge_count"),
      })
      .from(eventJudges)
    if (completedEventIds && completedEventIds.length > 0) {
      eventJudgesCountQuery = eventJudgesCountQuery.where(inArray(eventJudges.eventId, completedEventIds))
    } else if (eventId) {
      eventJudgesCountQuery = eventJudgesCountQuery.where(eq(eventJudges.eventId, eventId))
    }

    const schoolDistrictWhereConditions: any[] = []
    if (completedEventIds && completedEventIds.length > 0) {
      schoolDistrictWhereConditions.push(inArray(registrations.eventId, completedEventIds))
    }
    const schoolDistrictWhereClause =
      schoolDistrictWhereConditions.length > 0 ? and(...schoolDistrictWhereConditions) : undefined

    const eventWhereConditions: any[] = []
    if (eventId) eventWhereConditions.push(eq(registrations.eventId, eventId))
    if (completedEventIds && completedEventIds.length > 0) {
      eventWhereConditions.push(inArray(registrations.eventId, completedEventIds))
    }
    const eventWhereClause = eventWhereConditions.length > 0 ? and(...eventWhereConditions) : undefined

    type SchoolDistrictRow = {
      registrationId: string
      eventId: string
      schoolId: string
      schoolName: string | null
      schoolCode: string | null
      location: string | null
      totalScore: number
    }
    type EventRow = SchoolDistrictRow & {
      eventName: string
      eventType: string
      ageCategory: string
      chestNumber: string | null
      teamName: string | null
    }

    const dataQuery = async () => {
      if (type === "school" || type === "district" || type === "location") {
        let q = db
          .select({
            registrationId: registrations.id,
            eventId: registrations.eventId,
            schoolId: registrations.schoolId,
            schoolName: schools.name,
            schoolCode: schools.schoolCode,
            location: schools.location,
            totalScore: sql<number>`COALESCE(SUM(${judgments.score}), 0)`.as("total_score"),
          })
          .from(registrations)
          .innerJoin(judgments, eq(registrations.id, judgments.registrationId))
          .leftJoin(schools, eq(registrations.schoolId, schools.id))
        if (schoolDistrictWhereClause) q = q.where(schoolDistrictWhereClause)
        return q.groupBy(registrations.id, schools.id).having(
          sql`COALESCE(SUM(${judgments.score}), 0) > 0`
        ) as Promise<SchoolDistrictRow[]>
      }
      let q = db
        .select({
          registrationId: registrations.id,
          eventId: registrations.eventId,
          eventName: events.name,
          eventType: events.eventType,
          ageCategory: events.ageCategory,
          chestNumber: registrations.chestNumber,
          teamName: registrations.teamName,
          schoolId: registrations.schoolId,
          schoolName: schools.name,
          schoolCode: schools.schoolCode,
          totalScore: sql<number>`COALESCE(SUM(${judgments.score}), 0)`.as("total_score"),
        })
        .from(registrations)
        .innerJoin(judgments, eq(registrations.id, judgments.registrationId))
        .innerJoin(events, eq(registrations.eventId, events.id))
        .leftJoin(schools, eq(registrations.schoolId, schools.id))
      if (eventWhereClause) q = q.where(eventWhereClause)
      return q.groupBy(registrations.id, events.id, schools.id).having(
        sql`COALESCE(SUM(${judgments.score}), 0) > 0`
      ) as Promise<EventRow[]>
    }

    const [eventJudgesCount, registrationData] = await Promise.all([
      eventJudgesCountQuery.groupBy(eventJudges.eventId),
      dataQuery(),
    ])

    const judgesCountMap = new Map(eventJudgesCount.map((ej) => [ej.eventId, ej.judgeCount]))

    if (type === "school" || type === "district" || type === "location") {
      const registrationResults = registrationData as SchoolDistrictRow[]
      const registrationIds = registrationResults.map((r) => r.registrationId).filter(Boolean)
      const rewards =
        registrationIds.length > 0
          ? await db
              .select({
                registrationId: positionRewards.registrationId,
                rewardPoints: positionRewards.rewardPoints,
              })
              .from(positionRewards)
              .where(inArray(positionRewards.registrationId, registrationIds))
          : []
      const rewardsMap = new Map(rewards.map((r) => [r.registrationId, r.rewardPoints]))

      // Calculate grade points and aggregate (including reward points)
      const registrationsWithGradePoints = registrationResults.map((r) => {
        const maxScore = judgesCountMap.get(r.eventId) || 1
        const gradeInfo = calculateGrade(r.totalScore || 0, maxScore * 50)
        const rewardPoints = rewardsMap.get(r.registrationId) || 0
        return { ...r, gradePoint: gradeInfo.gradePoint + rewardPoints }
      })

      if (type === "school") {
        const schoolMap = new Map<
          string,
          { schoolId: string; schoolName: string; schoolCode: string; location: string; totalGradePoints: number }
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
              location: reg.location || "Unknown",
              totalGradePoints: reg.gradePoint,
            })
          }
        }

        const leaderboard = Array.from(schoolMap.values())
          .map((item) => ({ ...item, totalGradePoints: Math.round(item.totalGradePoints * 10) / 10 }))
          .sort((a, b) => b.totalGradePoints - a.totalGradePoints)
          .slice(0, limit)
          .map((item, index) => ({ ...item, rank: index + 1 }))

        const result = { success: true, type, leaderboard }
        await storage.setItem(cacheKey, { data: result, capturedAt: Date.now() }, { ttl: CACHE_TTL })
        return result
      }

      // District/Location leaderboard
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
        .map((item) => ({ ...item, totalGradePoints: Math.round(item.totalGradePoints * 10) / 10 }))
        .sort((a, b) => b.totalGradePoints - a.totalGradePoints)
        .slice(0, limit)
        .map((item, index) => ({ ...item, rank: index + 1 }))

      const result = { success: true, type, leaderboard }
      await storage.setItem(cacheKey, { data: result, capturedAt: Date.now() }, { ttl: CACHE_TTL })
      return result
    }

    // Event leaderboard: use registrationData from parallel dataQuery()
    const results = registrationData as EventRow[]
    const registrationIds = results.map((r) => r.registrationId).filter(Boolean)
    const [rewards, participantRows] = await Promise.all([
      registrationIds.length > 0
        ? db
            .select({
              registrationId: positionRewards.registrationId,
              rewardPoints: positionRewards.rewardPoints,
            })
            .from(positionRewards)
            .where(inArray(positionRewards.registrationId, registrationIds))
        : [],
      registrationIds.length > 0
        ? db
            .select({
              registrationId: registrationParticipants.registrationId,
              studentName: students.studentName,
            })
            .from(registrationParticipants)
            .innerJoin(students, eq(registrationParticipants.participantId, students.id))
            .where(
              and(
                eq(registrationParticipants.participantType, "student"),
                inArray(registrationParticipants.registrationId, registrationIds)
              )
            )
        : [],
    ])
    const rewardsMap = new Map(rewards.map((r) => [r.registrationId, r.rewardPoints]))
    const studentNamesByRegId = new Map<string, string>()
    for (const row of participantRows) {
      const existing = studentNamesByRegId.get(row.registrationId) || ""
      studentNamesByRegId.set(
        row.registrationId,
        existing ? `${existing}, ${row.studentName}` : row.studentName
      )
    }

    const leaderboard = results
      .map((r) => {
        const maxScore = judgesCountMap.get(r.eventId) || 1
        const gradeInfo = calculateGrade(r.totalScore || 0, maxScore * 50)
        const rewardPoints = rewardsMap.get(r.registrationId) || 0
        const teamName = r.teamName || null
        const studentName = teamName ? null : (studentNamesByRegId.get(r.registrationId) || null)
        return {
          registrationId: r.registrationId,
          eventId: r.eventId,
          eventName: r.eventName,
          eventType: r.eventType,
          ageCategory: r.ageCategory,
          chestNumber: r.chestNumber || null,
          teamName,
          studentName,
          schoolId: r.schoolId,
          schoolName: r.schoolName,
          schoolCode: r.schoolCode,
          totalScore: Math.round(r.totalScore * 10) / 10,
          normalizedScore: gradeInfo.normalizedScore,
          grade: gradeInfo.grade,
          gradePoint: gradeInfo.gradePoint + rewardPoints,
          rewardPoints: rewardPoints,
        }
      })
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
      .map((item, index) => ({ ...item, rank: index + 1 }))

    const result = { success: true, type, leaderboard }
    await storage.setItem(cacheKey, { data: result, capturedAt: Date.now() }, { ttl: CACHE_TTL })
    return result
  } catch (error: any) {
    console.error("Error fetching leaderboard:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch leaderboard",
    })
  }
})
