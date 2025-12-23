import { useDB } from "../../utils/db"
import { notifications, notificationRecipients, faculty } from "../../database/schema"
import { eq, and } from "drizzle-orm"
import { nanoid } from "nanoid"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const id = event.context.params?.id
  const query = getQuery(event)
  const { facultyId } = query

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Notification ID is required",
    })
  }

  if (!facultyId) {
    throw createError({
      statusCode: 400,
      message: "Faculty ID is required",
    })
  }

  try {
    // Get faculty member's school ID
    const [facultyMember] = await db
      .select()
      .from(faculty)
      .where(eq(faculty.id, facultyId as string))
      .limit(1)

    if (!facultyMember) {
      throw createError({
        statusCode: 404,
        message: "Faculty not found",
      })
    }

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

    // Check if recipient record exists
    const [existingRecipient] = await db
      .select()
      .from(notificationRecipients)
      .where(
        and(
          eq(notificationRecipients.notificationId, id),
          eq(notificationRecipients.schoolId, facultyMember.schoolId)
        )
      )
      .limit(1)

    if (existingRecipient) {
      // Update existing recipient record
      const [updatedRecipient] = await db
        .update(notificationRecipients)
        .set({ 
          isRead: true,
          viewedAt: new Date()
        })
        .where(eq(notificationRecipients.id, existingRecipient.id))
        .returning()

      return {
        success: true,
        message: "Notification marked as read",
        data: updatedRecipient,
      }
    } else {
      // Create new recipient record (shouldn't happen in normal flow, but handle it)
      const [newRecipient] = await db
        .insert(notificationRecipients)
        .values({
          id: nanoid(),
          notificationId: id,
          schoolId: facultyMember.schoolId,
          isRead: true,
          viewedAt: new Date(),
        })
        .returning()

      return {
        success: true,
        message: "Notification marked as read",
        data: newRecipient,
      }
    }
  } catch (error: any) {
    console.error("Error marking notification as read:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to mark notification as read",
    })
  }
})

