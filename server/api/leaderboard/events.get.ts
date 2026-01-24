import { useDB } from "../../utils/db"
import { events, registrations, judgments, eventJudges, schools, registrationParticipants, students, positionRewards } from "../../database/schema"
import { eq, sql, inArray, and, type SQL } from "drizzle-orm"
import { calculateGrade } from "../../utils/grading"

const CACHE_PREFIX = "leaderboard:events:"
const CACHE_TTL = 60 * 60 // 1 hour in seconds

interface EventInfo {
  id: string
  name: string
  eventType: string
  ageCategory: string
}

interface LeaderboardEntry {
  registrationId: string
  teamName: string | null
  studentName: string | null
  schoolId: string | null
  schoolName: string | null
  schoolCode: string | null
  totalScore: number
  normalizedScore: number
  grade: string
  gradePoint: number
  rewardPoints: number
  rank: number
}

interface EventLeaderboard {
  event: EventInfo
  leaderboard: LeaderboardEntry[]
  totalResults: number
}

interface CachedEventsLeaderboard {
  data: {
    success: true
    events: EventLeaderboard[]
  }
  capturedAt: number
}

function getCacheKey(context: string, resultsLimit: number): string {
  return `${CACHE_PREFIX}${context}:resultsLimit:${resultsLimit}`
}

// Get leaderboard grouped by event
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const context = (query.context as string) || "admin" // "presentation" or "admin"
  const resultsLimit = parseInt((query.resultsLimit as string) || "5") // Results per event
  
  const storage = useStorage("kv")
  const cacheKey = getCacheKey(context, resultsLimit)

  try {
    // Try to get cached data
    const cached = await storage.getItem<CachedEventsLeaderboard>(cacheKey)
    if (cached) {
      return {
        ...cached.data,
        cached: true,
        dataCapturedAt: cached.capturedAt,
      }
    }
    
    const whereClause: SQL<unknown> | undefined =
      context === "presentation" ? eq(events.isCompleted, true) : undefined

    const allEvents = await db
      .select({
        id: events.id,
        name: events.name,
        eventType: events.eventType,
        ageCategory: events.ageCategory,
      })
      .from(events)
      .where(whereClause)
      .orderBy(events.name)

    const eventIds = allEvents.map((e) => e.id)
    if (eventIds.length === 0) {
      return { success: true as const, events: [] }
    }

    const [eventJudgesCount, allResults] = await Promise.all([
      db
        .select({
          eventId: eventJudges.eventId,
          judgeCount: sql<number>`COUNT(DISTINCT ${eventJudges.judgeId})`.as("judge_count"),
        })
        .from(eventJudges)
        .where(inArray(eventJudges.eventId, eventIds))
        .groupBy(eventJudges.eventId),
      db
        .select({
          eventId: registrations.eventId,
          registrationId: registrations.id,
          teamName: registrations.teamName,
          schoolId: registrations.schoolId,
          schoolName: schools.name,
          schoolCode: schools.schoolCode,
          totalScore: sql<number>`COALESCE(SUM(${judgments.score}), 0)`.as("total_score"),
        })
        .from(registrations)
        .innerJoin(judgments, eq(registrations.id, judgments.registrationId))
        .leftJoin(schools, eq(registrations.schoolId, schools.id))
        .where(inArray(registrations.eventId, eventIds))
        .groupBy(registrations.id, schools.id)
        .having(sql`COALESCE(SUM(${judgments.score}), 0) > 0`),
    ])

    const judgesCountMap = new Map(
      eventJudgesCount.map((ej) => [ej.eventId, ej.judgeCount])
    )

    // Group results by event
    const resultsByEvent = new Map<string, typeof allResults>()
    for (const result of allResults) {
      const existing = resultsByEvent.get(result.eventId) || []
      resultsByEvent.set(result.eventId, [...existing, result])
    }

    // Fetch student names per registration (for individual events where teamName is blank)
    const registrationIds = allResults.map((r) => r.registrationId)
    const [participantRows, rewards] = await Promise.all([
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
      registrationIds.length > 0
        ? db
            .select({
              registrationId: positionRewards.registrationId,
              rewardPoints: positionRewards.rewardPoints,
            })
            .from(positionRewards)
            .where(inArray(positionRewards.registrationId, registrationIds))
        : [],
    ])
    const studentNamesByRegId = new Map<string, string>()
    for (const row of participantRows) {
      const existing = studentNamesByRegId.get(row.registrationId) || ""
      studentNamesByRegId.set(
        row.registrationId,
        existing ? `${existing}, ${row.studentName}` : row.studentName
      )
    }
    const rewardsMap = new Map(rewards.map((r) => [r.registrationId, r.rewardPoints]))

    // Build leaderboard for each event
    const eventLeaderboards = allEvents
      .map((eventItem) => {
        const results = resultsByEvent.get(eventItem.id) || []
        if (results.length === 0) return null

        const maxScore = judgesCountMap.get(eventItem.id) || 1
        const maxPossibleScore = maxScore * 10

        const leaderboard = results
          .map((result) => {
            const totalScore = result.totalScore || 0
            const gradeInfo = calculateGrade(totalScore, maxPossibleScore)
            const rewardPoints = rewardsMap.get(result.registrationId) || 0
            return {
              registrationId: result.registrationId,
              teamName: result.teamName || null,
              studentName: result.teamName ? null : (studentNamesByRegId.get(result.registrationId) || null),
              schoolId: result.schoolId,
              schoolName: result.schoolName,
              schoolCode: result.schoolCode,
              totalScore: Math.round(totalScore * 10) / 10,
              normalizedScore: gradeInfo.normalizedScore,
              grade: gradeInfo.grade,
              gradePoint: gradeInfo.gradePoint + rewardPoints,
              rewardPoints: rewardPoints,
            }
          })
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, resultsLimit)
          .map((item, index) => ({ ...item, rank: index + 1 }))

        return {
          event: {
            id: eventItem.id,
            name: eventItem.name,
            eventType: eventItem.eventType,
            ageCategory: eventItem.ageCategory,
          },
          leaderboard,
          totalResults: results.length, // Total results available for this event
        }
      })
      .filter((el): el is NonNullable<typeof el> => el !== null && el.leaderboard.length > 0)

    const result = {
      success: true as const,
      events: eventLeaderboards,
    }
    
    await storage.setItem(cacheKey, { data: result, capturedAt: Date.now() }, { ttl: CACHE_TTL })
    return result
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Error fetching event leaderboards:", errorMessage)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch event leaderboards",
    })
  }
})
