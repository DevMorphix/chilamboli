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
import { eq, inArray } from "drizzle-orm"
import { calculateGrade } from "../../../../utils/grading"

type JudgmentRow = { registrationId: string; judgeId: string; score: number }

// Get detailed event results with all judge scores for PDF generation (client-side).
// Optimized: single read of judgments + position_rewards (no duplicate scan via JOIN+GROUP).
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

    // Registrations + schools only (no judgments). Avoids double-scan of judgments.
    const regsWithSchools = await db
      .select({
        registrationId: registrations.id,
        chestNumber: registrations.chestNumber,
        teamName: registrations.teamName,
        schoolId: registrations.schoolId,
        schoolName: schools.name,
        schoolCode: schools.schoolCode,
      })
      .from(registrations)
      .leftJoin(schools, eq(registrations.schoolId, schools.id))
      .where(eq(registrations.eventId, eventId))

    const registrationIds = regsWithSchools.map((r) => r.registrationId)
    if (registrationIds.length === 0) {
      throw createError({
        statusCode: 400,
        message: "No results available for this event",
      })
    }

    const [allJudgments, rewards] = await Promise.all([
      db
        .select({
          registrationId: judgments.registrationId,
          judgeId: judgments.judgeId,
          score: judgments.score,
        })
        .from(judgments)
        .where(inArray(judgments.registrationId, registrationIds)),
      db
        .select({
          registrationId: positionRewards.registrationId,
          rewardPoints: positionRewards.rewardPoints,
        })
        .from(positionRewards)
        .where(inArray(positionRewards.registrationId, registrationIds)),
    ])

    const judgmentsMap = new Map<string, Map<string, JudgmentRow>>()
    for (const j of allJudgments) {
      let perReg = judgmentsMap.get(j.registrationId)
      if (!perReg) {
        perReg = new Map()
        judgmentsMap.set(j.registrationId, perReg)
      }
      perReg.set(j.judgeId, j)
    }

    const rewardsMap = new Map(rewards.map((r) => [r.registrationId, r.rewardPoints]))

    // Compute totalScore per registration in-app (single judgment read), filter to score > 0
    const results = regsWithSchools
      .map((r) => {
        const perReg = judgmentsMap.get(r.registrationId)
        let totalScore = 0
        if (perReg) for (const j of perReg.values()) totalScore += j.score
        return { ...r, totalScore }
      })
      .filter((r) => r.totalScore > 0)

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
          chestNumber: result.chestNumber ?? null,
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
