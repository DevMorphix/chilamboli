import { useDB } from "../../utils/db"
import { judges, eventJudges, registrations, judgments } from "../../database/schema"
import { eq, and } from "drizzle-orm"
import { nanoid } from "nanoid"

// Submit or update a judgment (score) for a registration
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const body = await readBody(event)

  const { judgeId, registrationId, score, comments } = body

  if (!judgeId || !registrationId || score === undefined) {
    throw createError({
      statusCode: 400,
      message: "Judge ID, Registration ID, and score are required",
    })
  }

  // Validate score is between 0 and 10
  if (typeof score !== "number" || score < 0 || score > 10) {
    throw createError({
      statusCode: 400,
      message: "Score must be between 0 and 10",
    })
  }

  try {
    // Verify judge exists
    const [judge] = await db
      .select()
      .from(judges)
      .where(eq(judges.id, judgeId))
      .limit(1)

    if (!judge) {
      throw createError({
        statusCode: 404,
        message: "Judge not found",
      })
    }

    // Verify registration exists
    const [registration] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, registrationId))
      .limit(1)

    if (!registration) {
      throw createError({
        statusCode: 404,
        message: "Registration not found",
      })
    }

    // Verify judge is assigned to this event
    const [assignment] = await db
      .select()
      .from(eventJudges)
      .where(and(eq(eventJudges.judgeId, judgeId), eq(eventJudges.eventId, registration.eventId)))
      .limit(1)

    if (!assignment) {
      throw createError({
        statusCode: 403,
        message: "Judge is not assigned to this event",
      })
    }

    // Check if judgment already exists
    const [existingJudgment] = await db
      .select()
      .from(judgments)
      .where(and(eq(judgments.judgeId, judgeId), eq(judgments.registrationId, registrationId)))
      .limit(1)

    if (existingJudgment) {
      // Update existing judgment
      const [updatedJudgment] = await db
        .update(judgments)
        .set({
          score: Math.round(score * 10) / 10, // Round to 1 decimal place
          comments: comments || null,
          updatedAt: new Date(),
        })
        .where(eq(judgments.id, existingJudgment.id))
        .returning()

      return {
        success: true,
        message: "Judgment updated successfully",
        judgment: updatedJudgment,
      }
    } else {
      // Create new judgment
      const [newJudgment] = await db
        .insert(judgments)
        .values({
          id: nanoid(),
          judgeId,
          registrationId,
          score: Math.round(score * 10) / 10, // Round to 1 decimal place
          comments: comments || null,
        })
        .returning()

      return {
        success: true,
        message: "Judgment submitted successfully",
        judgment: newJudgment,
      }
    }
  } catch (error: any) {
    console.error("Error submitting judgment:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to submit judgment",
    })
  }
})
