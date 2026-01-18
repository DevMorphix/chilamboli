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
      
      // Parallel: Get judge counts and registration scores
      const [eventJudgesCount, registrationResults] = await Promise.all([
        db
          .select({
            eventId: eventJudges.eventId,
            judgeCount: sql<number>`COUNT(DISTINCT ${eventJudges.judgeId})`.as("judge_count"),
          })
          .from(eventJudges)
          .groupBy(eventJudges.eventId),
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
        const normalizedScore = maxScore > 0 ? ((reg.totalScore || 0) / (maxScore * 10)) * 100 : 0

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

    // Get judge counts - optimize by only fetching for relevant events
    // If we have completedEventIds, only fetch counts for those events
    let eventJudgesCountQuery = db
      .select({
        eventId: eventJudges.eventId,
        judgeCount: sql<number>`COUNT(DISTINCT ${eventJudges.judgeId})`.as("judge_count"),
      })
      .from(eventJudges)
    
    // Filter by relevant events if we know them
    if (completedEventIds && completedEventIds.length > 0) {
      eventJudgesCountQuery = eventJudgesCountQuery.where(inArray(eventJudges.eventId, completedEventIds))
    } else if (eventId) {
      eventJudgesCountQuery = eventJudgesCountQuery.where(eq(eventJudges.eventId, eventId))
    }
    
    const eventJudgesCount = await eventJudgesCountQuery.groupBy(eventJudges.eventId)
    const judgesCountMap = new Map(eventJudgesCount.map((ej) => [ej.eventId, ej.judgeCount]))

    // School or district leaderboard
    if (type === "school" || type === "district" || type === "location") {
      // Build where clause to filter by completed events if context is presentation
      const whereConditions: any[] = []
      if (completedEventIds && completedEventIds.length > 0) {
        whereConditions.push(inArray(registrations.eventId, completedEventIds))
      }
      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined
      
      // Get registrations with scores only (filter in SQL)
      const registrationResults = await db
        .select({
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
        .where(whereClause)
        .groupBy(registrations.id, schools.id)
        .having(sql`COALESCE(SUM(${judgments.score}), 0) > 0`)

      // Calculate grade points and aggregate
      const registrationsWithGradePoints = registrationResults.map((r) => {
        const maxScore = judgesCountMap.get(r.eventId) || 1
        const gradeInfo = calculateGrade(r.totalScore || 0, maxScore * 10)
        return { ...r, gradePoint: gradeInfo.gradePoint }
      })

      if (type === "school") {
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

    // Event leaderboard: ranked by raw scores
    const whereConditions: any[] = []
    if (eventId) {
      whereConditions.push(eq(registrations.eventId, eventId))
    }
    if (completedEventIds && completedEventIds.length > 0) {
      whereConditions.push(inArray(registrations.eventId, completedEventIds))
    }
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

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
      })
      .from(registrations)
      .innerJoin(judgments, eq(registrations.id, judgments.registrationId))
      .innerJoin(events, eq(registrations.eventId, events.id))
      .leftJoin(schools, eq(registrations.schoolId, schools.id))
      .where(whereClause)
      .groupBy(registrations.id, events.id, schools.id)
      .having(sql`COALESCE(SUM(${judgments.score}), 0) > 0`)

    const leaderboard = results
      .map((r) => {
        const maxScore = judgesCountMap.get(r.eventId) || 1
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
          totalScore: Math.round(r.totalScore * 10) / 10,
          normalizedScore: gradeInfo.normalizedScore,
          grade: gradeInfo.grade,
          gradePoint: gradeInfo.gradePoint,
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
