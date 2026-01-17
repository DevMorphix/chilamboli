import { useDB } from "../../utils/db"
import { eventJudges } from "../../database/schema"
import { eq } from "drizzle-orm"

// Delete an event-judge assignment
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const assignmentId = getRouterParam(event, "id")

  if (!assignmentId) {
    throw createError({
      statusCode: 400,
      message: "Assignment ID is required",
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

    // Delete the assignment
    await db.delete(eventJudges).where(eq(eventJudges.id, assignmentId))

    return {
      success: true,
      message: "Event-Judge assignment deleted successfully",
    }
  } catch (error: any) {
    console.error("Error deleting event-judge assignment:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to delete event-judge assignment",
    })
  }
})
