import { useDB } from "../../utils/db"
import { events, registrations, judgments, eventJudges, schools, positionRewards } from "../../database/schema"
import { eq, sql, inArray, or, type SQL } from "drizzle-orm"
import { calculateGrade } from "../../utils/grading"

const CACHE_PREFIX = "leaderboard:events:"
const CACHE_TTL = 60 * 60
const MAX_SQL_VARS = 100

function inArraySafe(column: any, ids: string[]) {
  if (ids.length <= MAX_SQL_VARS) return inArray(column, ids)
  const parts: ReturnType<typeof inArray>[] = []
  for (let i = 0; i < ids.length; i += MAX_SQL_VARS) {
    parts.push(inArray(column, ids.slice(i, i + MAX_SQL_VARS)))
  }
  return or(...parts)
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
    const cached = await storage.getItem<{ data: { success: true; events: unknown[] }; capturedAt: number }>(cacheKey)
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

    const eventIdCond = inArraySafe(eventJudges.eventId, eventIds)

    type RegistrationRow = {
      eventId: string
      registrationId: string
      chestNumber: string | null
      teamName: string | null
      schoolId: string | null
      schoolName: string | null
      schoolCode: string | null
      totalScore: number
      rewardPoints: number
      studentNames: string | null
    }

    const fetchResultsForEvent = (eventId: string) =>
      db
        .select({
          eventId: registrations.eventId,
          registrationId: registrations.id,
          chestNumber: registrations.chestNumber,
          teamName: registrations.teamName,
          schoolId: registrations.schoolId,
          schoolName: schools.name,
          schoolCode: schools.schoolCode,
          totalScore: sql<number>`COALESCE(SUM(${judgments.score}), 0)`.as("total_score"),
          rewardPoints: sql<number>`COALESCE(MAX(${positionRewards.rewardPoints}), 0)`.as("reward_points"),
          studentNames: sql<string | null>`(SELECT GROUP_CONCAT(s.student_name) FROM registration_participants rp INNER JOIN students s ON rp.participant_id = s.id WHERE rp.registration_id = ${registrations.id} AND rp.participant_type = 'student')`.as("student_names"),
        })
        .from(registrations)
        .innerJoin(judgments, eq(registrations.id, judgments.registrationId))
        .leftJoin(schools, eq(registrations.schoolId, schools.id))
        .leftJoin(positionRewards, eq(registrations.id, positionRewards.registrationId))
        .where(eq(registrations.eventId, eventId))
        .groupBy(registrations.id, schools.id)
        .having(sql`COALESCE(SUM(${judgments.score}), 0) > 0`)
        .orderBy(sql`COALESCE(SUM(${judgments.score}), 0) DESC`)
        .limit(resultsLimit) as Promise<RegistrationRow[]>

    const [eventJudgesCount, ...perEventResults] = await Promise.all([
      db.select({
        eventId: eventJudges.eventId,
        judgeCount: sql<number>`COUNT(DISTINCT ${eventJudges.judgeId})`.as("judge_count"),
      })
        .from(eventJudges)
        .where(eventIdCond)
        .groupBy(eventJudges.eventId),
      ...eventIds.map((eventId) => fetchResultsForEvent(eventId)),
    ])

    const judgesCountMap = new Map(eventJudgesCount.map((ej) => [ej.eventId, ej.judgeCount]))
    const resultsByEvent = new Map<string, RegistrationRow[]>()
    eventIds.forEach((eventId, i) => {
      resultsByEvent.set(eventId, perEventResults[i] ?? [])
    })

    // Build leaderboard for each event
    const eventLeaderboards = allEvents
      .map((eventItem) => {
        const results = resultsByEvent.get(eventItem.id) || []
        if (results.length === 0) return null

        const maxScore = judgesCountMap.get(eventItem.id) || 1
        const maxPossibleScore = maxScore * 50

        const leaderboard = results
          .map((r) => {
            const totalScore = r.totalScore || 0
            const gradeInfo = calculateGrade(totalScore, maxPossibleScore)
            const rewardPoints = r.rewardPoints || 0
            return {
              registrationId: r.registrationId,
              chestNumber: r.chestNumber || null,
              teamName: r.teamName || null,
              studentName: r.teamName ? null : (r.studentNames || null),
              schoolId: r.schoolId,
              schoolName: r.schoolName,
              schoolCode: r.schoolCode,
              totalScore: Math.round(totalScore * 10) / 10,
              normalizedScore: gradeInfo.normalizedScore,
              grade: gradeInfo.grade,
              gradePoint: gradeInfo.gradePoint + rewardPoints,
              rewardPoints,
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
