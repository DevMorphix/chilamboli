import { useDB } from "../../utils/db"
import { events, registrations, judgments, eventJudges, schools } from "../../database/schema"
import { eq, sql } from "drizzle-orm"
import { calculateGrade } from "../../utils/grading"

// Get leaderboard grouped by event
export default defineEventHandler(async (event) => {
  const db = useDB(event)

  try {
    // Get all events
    const allEvents = await db.select().from(events).orderBy(events.name)

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

    // For each event, get top registrations
    const eventLeaderboards = await Promise.all(
      allEvents.map(async (eventItem) => {
        const results = await db
          .select({
            registrationId: registrations.id,
            teamName: registrations.teamName,
            schoolId: registrations.schoolId,
            schoolName: schools.name,
            schoolCode: schools.schoolCode,
            totalScore: sql<number>`COALESCE(SUM(${judgments.score}), 0)`.as("total_score"),
            judgeCount: sql<number>`COUNT(DISTINCT ${judgments.judgeId})`.as("judge_count"),
          })
          .from(registrations)
          .leftJoin(schools, eq(registrations.schoolId, schools.id))
          .leftJoin(judgments, eq(registrations.id, judgments.registrationId))
          .where(eq(registrations.eventId, eventItem.id))
          .groupBy(registrations.id, schools.id)

        const maxScore = judgesCountMap.get(eventItem.id) || 1
        const maxPossibleScore = maxScore * 10

        // Filter out dummy data: registrations with no judgments
        // Event results use raw scores (sum of judgments) for ranking, not grade points
        const leaderboard = results
          .filter((result) => (result.judgeCount || 0) > 0 && (result.totalScore || 0) > 0)
          .map((result) => {
            const totalScore = result.totalScore || 0
            const gradeInfo = calculateGrade(totalScore, maxPossibleScore)

            return {
              registrationId: result.registrationId,
              teamName: result.teamName,
              schoolId: result.schoolId,
              schoolName: result.schoolName,
              schoolCode: result.schoolCode,
              totalScore: Math.round(totalScore * 10) / 10,
              normalizedScore: gradeInfo.normalizedScore,
              grade: gradeInfo.grade,
              gradePoint: gradeInfo.gradePoint,
            }
          })
          // Sort by raw total score for event results (not by grade point)
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, 10)
          .map((item, index) => ({
            ...item,
            rank: index + 1,
          }))

        return {
          event: {
            id: eventItem.id,
            name: eventItem.name,
            eventType: eventItem.eventType,
            ageCategory: eventItem.ageCategory,
          },
          leaderboard,
        }
      })
    )

    return {
      success: true,
      events: eventLeaderboards.filter((el) => el.leaderboard.length > 0),
    }
  } catch (error: any) {
    console.error("Error fetching event leaderboards:", error)

    throw createError({
      statusCode: 500,
      message: "Failed to fetch event leaderboards",
    })
  }
})
