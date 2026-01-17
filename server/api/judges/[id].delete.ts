import { useDB } from "../../utils/db"
import { judges, auth, eventJudges, judgments } from "../../database/schema"
import { eq, and } from "drizzle-orm"

// Delete a judge and their auth entry
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const judgeId = getRouterParam(event, "id")

  if (!judgeId) {
    throw createError({
      statusCode: 400,
      message: "Judge ID is required",
    })
  }

  try {
    // Check if judge exists
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

    // Delete related judgments (cascade should handle this, but being explicit)
    await db.delete(judgments).where(eq(judgments.judgeId, judgeId))

    // Delete event-judge assignments (cascade should handle this, but being explicit)
    await db.delete(eventJudges).where(eq(eventJudges.judgeId, judgeId))

    // Delete auth entry
    await db
      .delete(auth)
      .where(and(eq(auth.userType, "judge"), eq(auth.userId, judgeId)))

    // Delete judge
    await db.delete(judges).where(eq(judges.id, judgeId))

    return {
      success: true,
      message: "Judge deleted successfully",
    }
  } catch (error: any) {
    console.error("Error deleting judge:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to delete judge",
    })
  }
})
