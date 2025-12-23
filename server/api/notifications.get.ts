import { useDB } from "../utils/db"
import { notifications, notificationRecipients, faculty } from "../database/schema"
import { eq, desc, or, isNull, and } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const { facultyId } = query

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

    // Get notifications with recipient info: common (schoolId is null) OR specific to this faculty's school
    const notificationsWithRecipients = await db
      .select({
        id: notifications.id,
        schoolId: notifications.schoolId,
        title: notifications.title,
        message: notifications.message,
        isImportant: notifications.isImportant,
        createdAt: notifications.createdAt,
        isRead: notificationRecipients.isRead,
        viewedAt: notificationRecipients.viewedAt,
      })
      .from(notifications)
      .leftJoin(
        notificationRecipients,
        and(
          eq(notificationRecipients.notificationId, notifications.id),
          eq(notificationRecipients.schoolId, facultyMember.schoolId)
        )
      )
      .where(
        or(
          isNull(notifications.schoolId), // Common notifications
          eq(notifications.schoolId, facultyMember.schoolId) // School-specific notifications
        )
      )
      .orderBy(desc(notifications.createdAt))

    // Map results - if no recipient record exists, treat as unread
    const enrichedNotifications = notificationsWithRecipients.map((item) => ({
      id: item.id,
      schoolId: item.schoolId,
      title: item.title,
      message: item.message,
      isImportant: item.isImportant,
      createdAt: item.createdAt,
      isRead: item.isRead ?? false, // Default to false if no recipient record
      viewedAt: item.viewedAt ?? null,
    }))

    return {
      success: true,
      data: enrichedNotifications,
    }
  } catch (error: any) {
    console.error("Error fetching notifications:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to fetch notifications",
    })
  }
})

