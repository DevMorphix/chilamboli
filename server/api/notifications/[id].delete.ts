import { useDB } from "../../utils/db"
import { notifications } from "../../database/schema"
import { eq } from "drizzle-orm"

// TODO: Add proper admin authentication middleware
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const id = event.context.params?.id

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Notification ID is required",
    })
  }

  try {
    // Check if notification exists
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1)

    if (!notification) {
      throw createError({
        statusCode: 404,
        message: "Notification not found",
      })
    }

    // Delete the notification (cascade will delete recipients)
    await db
      .delete(notifications)
      .where(eq(notifications.id, id))

    return {
      success: true,
      message: "Notification deleted successfully",
    }
  } catch (error: any) {
    console.error("Error deleting notification:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to delete notification",
    })
  }
})

