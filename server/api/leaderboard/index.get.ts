import { useDB } from "../../utils/db"
import { registrations, judgments, events, eventJudges, schools } from "../../database/schema"
import { eq, sql, and } from "drizzle-orm"

// Get leaderboard - supports different types: 'event', 'school', 'overall'
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const type = (query.type as string) || "overall" // 'event', 'school', 'overall'
  const eventId = query.eventId as string | undefined
  const schoolId = query.schoolId as string | undefined
  const limit = parseInt((query.limit as string) || "10")

  try {
    // Get total judges per event
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

    // Calculate normalized scores and grades, then rank
    const leaderboard = results
      .map((result) => {
        const maxScore = judgesCountMap.get(result.eventId) || result.judgeCount || 1
        const maxPossibleScore = maxScore * 10
        const totalScore = result.totalScore || 0

        // Normalize to 100 scale
        const normalizedScore =
          maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0

        // Assign grade
        let grade: string
        if (normalizedScore >= 95) grade = "A+"
        else if (normalizedScore >= 90) grade = "A"
        else if (normalizedScore >= 85) grade = "B+"
        else if (normalizedScore >= 80) grade = "B"
        else if (normalizedScore >= 75) grade = "C+"
        else if (normalizedScore >= 70) grade = "C"
        else if (normalizedScore >= 65) grade = "D+"
        else if (normalizedScore >= 60) grade = "D"
        else grade = "F"

        return {
          registrationId: result.registrationId,
          eventId: result.eventId,
          eventName: result.eventName,
          eventType: result.eventType,
          ageCategory: result.ageCategory,
          teamName: result.teamName,
          schoolId: result.schoolId,
          schoolName: result.schoolName,
          schoolCode: result.schoolCode,
          totalScore: Math.round(totalScore * 10) / 10,
          normalizedScore: Math.round(normalizedScore * 10) / 10,
          grade,
          judgeCount: result.judgeCount || 0,
        }
      })
      .sort((a, b) => b.normalizedScore - a.normalizedScore)
      .slice(0, limit)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }))

    return {
      success: true,
      type,
      leaderboard,
    }
  } catch (error: any) {
    console.error("Error fetching leaderboard:", error)

    throw createError({
      statusCode: 500,
      message: "Failed to fetch leaderboard",
    })
  }
})
