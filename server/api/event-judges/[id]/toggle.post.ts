import { useDB } from "../../../utils/db"
import { eventJudges, events, judges } from "../../../database/schema"
import { eq, and } from "drizzle-orm"

// Toggle event-judge assignment enabled/disabled status
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const assignmentId = getRouterParam(event, "id")
  const body = await readBody(event)

  const { enabled } = body

  if (!assignmentId) {
    throw createError({
      statusCode: 400,
      message: "Event-Judge assignment ID is required",
    })
  }

  if (typeof enabled !== "boolean") {
    throw createError({
      statusCode: 400,
      message: "Enabled status (boolean) is required",
    })
  }

  try {
    // Check if assignment exists
    const [existingAssignment] = await db
      .select()
      .from(eventJudges)
      .where(eq(eventJudges.id, assignmentId))
      .limit(1)

    if (!existingAssignment) {
      throw createError({
        statusCode: 404,
        message: "Event-Judge assignment not found",
      })
    }

    // If enabling an assignment, disable all other assignments for this judge first
    // (Only one event-judge assignment can be enabled at a time per judge)
    if (enabled) {
      await db
        .update(eventJudges)
        .set({ enabled: false })
        .where(
          and(
            eq(eventJudges.judgeId, existingAssignment.judgeId),
            eq(eventJudges.enabled, true)
          )
        )
    }

    // Update the assignment status
    const [updatedAssignment] = await db
      .update(eventJudges)
      .set({ enabled })
      .where(eq(eventJudges.id, assignmentId))
      .returning()

    return {
      success: true,
      message: enabled ? "Event-Judge assignment enabled successfully" : "Event-Judge assignment disabled successfully",
      assignment: updatedAssignment,
    }
  } catch (error: any) {
    console.error("Error toggling event-judge assignment status:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to toggle event-judge assignment status",
    })
  }
})
