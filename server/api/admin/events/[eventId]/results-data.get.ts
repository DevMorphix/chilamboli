import { useDB } from "../../../../utils/db"
import {
  events,
  registrations,
  judgments,
  eventJudges,
  schools,
  judges,
  positionRewards,
} from "../../../../database/schema"
import { eq, sql, inArray } from "drizzle-orm"
import { calculateGrade } from "../../../../utils/grading"

// Get detailed event results with all judge scores for PDF generation (client-side)
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const eventId = getRouterParam(event, "eventId")

  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: "Event ID is required",
    })
  }

  try {
    // Get event details
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

    // Get all judges assigned to this event
    const eventJudgesList = await db
      .select({
        judgeId: eventJudges.judgeId,
        judgeName: judges.judgeName,
      })
      .from(eventJudges)
      .innerJoin(judges, eq(eventJudges.judgeId, judges.id))
      .where(eq(eventJudges.eventId, eventId))
      .orderBy(judges.judgeName)

    const judgeCount = eventJudgesList.length
    if (judgeCount === 0) {
      throw createError({
        statusCode: 400,
        message: "No judges assigned to this event",
      })
    }
    const maxPossibleScore = judgeCount * 10

    // Get all registrations for this event with scores
    const results = await db
      .select({
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
      .where(eq(registrations.eventId, eventId))
      .groupBy(registrations.id, schools.id)
      .having(sql`COALESCE(SUM(${judgments.score}), 0) > 0`)

    // Get all judgments and position rewards for these registrations
    const registrationIds = results.map((r) => r.registrationId)
    const [allJudgments, rewards] = await Promise.all([
      registrationIds.length > 0
        ? db
            .select()
            .from(judgments)
            .where(inArray(judgments.registrationId, registrationIds))
        : [],
      registrationIds.length > 0
        ? db
            .select()
            .from(positionRewards)
            .where(inArray(positionRewards.registrationId, registrationIds))
        : [],
    ])

    // Create a map of judgments by registrationId and judgeId
    const judgmentsMap = new Map<string, Map<string, typeof allJudgments[0]>>()
    allJudgments.forEach((j) => {
      if (!judgmentsMap.has(j.registrationId)) {
        judgmentsMap.set(j.registrationId, new Map())
      }
      judgmentsMap.get(j.registrationId)!.set(j.judgeId, j)
    })

    // Create a map of reward points by registrationId
    const rewardsMap = new Map(rewards.map((r) => [r.registrationId, r.rewardPoints]))

    // Build detailed results with judge scores
    const detailedResults = results
      .map((result) => {
        const totalScore = result.totalScore || 0
        const gradeInfo = calculateGrade(totalScore, maxPossibleScore)
        const judgeScores: Array<{ judgeId: string; judgeName: string; score: number | null }> = []

        // Get score for each judge
        const regJudgments = judgmentsMap.get(result.registrationId) || new Map()
        for (const judge of eventJudgesList) {
          const judgment = regJudgments.get(judge.judgeId)
          judgeScores.push({
            judgeId: judge.judgeId,
            judgeName: judge.judgeName,
            score: judgment ? judgment.score : null,
          })
        }

        const rewardPoints = rewardsMap.get(result.registrationId) || 0
        return {
          registrationId: result.registrationId,
          teamName: result.teamName,
          schoolName: result.schoolName || "-",
          schoolCode: result.schoolCode || "-",
          totalScore: Math.round(totalScore * 10) / 10,
          normalizedScore: gradeInfo.normalizedScore,
          grade: gradeInfo.grade,
          gradePoint: gradeInfo.gradePoint + rewardPoints,
          rewardPoints: rewardPoints,
          judgeScores,
        }
      })
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((item, index) => ({ ...item, rank: index + 1 }))

    if (detailedResults.length === 0) {
      throw createError({
        statusCode: 400,
        message: "No results available for this event",
      })
    }

    return {
      success: true,
      event: {
        id: eventData.id,
        name: eventData.name,
        eventType: eventData.eventType,
        ageCategory: eventData.ageCategory,
        gender: eventData.gender,
      },
      judges: eventJudgesList.map((j) => ({
        judgeId: j.judgeId,
        judgeName: j.judgeName,
      })),
      results: detailedResults,
    }
  } catch (error: any) {
    console.error("Error fetching event results:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch event results",
    })
  }
})
