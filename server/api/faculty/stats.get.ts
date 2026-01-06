import { useDB } from "../../utils/db"
import { faculty, students, registrations, notifications, notificationRecipients } from "../../database/schema"
import { eq, count, desc, or, isNull, and } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const { schoolId, facultyId } = query

  if (!schoolId) {
    throw createError({
      statusCode: 400,
      message: "School ID is required",
    })
  }

  try {
    // Get counts for all entities filtered by schoolId - Run in parallel for better performance
    const countPromises = [
      db.select({ count: count() }).from(students).where(eq(students.schoolId, schoolId as string)).then(r => r[0]),
      db.select({ count: count() }).from(faculty).where(eq(faculty.schoolId, schoolId as string)).then(r => r[0]),
      db.select({ count: count() }).from(registrations).where(eq(registrations.schoolId, schoolId as string)).then(r => r[0]),
    ]

    // If facultyId is provided, also fetch notification summary
    let notificationSummary = null
    if (facultyId) {
      // Get faculty member's school ID (should match provided schoolId, but verify)
      const [facultyMember] = await db
        .select()
        .from(faculty)
        .where(eq(faculty.id, facultyId as string))
        .limit(1)

      if (facultyMember && facultyMember.schoolId === schoolId) {
        const schoolIdStr = facultyMember.schoolId
        
        // Base condition: notifications visible to this school (common or school-specific)
        const notificationVisibilityCondition = or(
          isNull(notifications.schoolId), // Common notifications
          eq(notifications.schoolId, schoolIdStr) // School-specific notifications
        )

        // Unread condition: no recipient record OR recipient record with isRead = false
        const unreadCondition = or(
          isNull(notificationRecipients.id), // No recipient record = unread
          eq(notificationRecipients.isRead, false) // Recipient record but not read
        )

        // Run notification queries in parallel
        const [unreadCountResult, firstImportantUnreadResult] = await Promise.all([
          // Count unread notifications using COUNT query
          db
            .select({ count: count() })
            .from(notifications)
            .leftJoin(
              notificationRecipients,
              and(
                eq(notificationRecipients.notificationId, notifications.id),
                eq(notificationRecipients.schoolId, schoolIdStr)
              )
            )
            .where(
              and(
                notificationVisibilityCondition,
                unreadCondition
              )
            )
            .then(r => r[0]),
          
          // Fetch only the first important unread notification (limit 1)
          db
            .select({
              id: notifications.id,
              schoolId: notifications.schoolId,
              title: notifications.title,
              message: notifications.message,
              isImportant: notifications.isImportant,
              createdAt: notifications.createdAt,
            })
            .from(notifications)
            .leftJoin(
              notificationRecipients,
              and(
                eq(notificationRecipients.notificationId, notifications.id),
                eq(notificationRecipients.schoolId, schoolIdStr)
              )
            )
            .where(
              and(
                notificationVisibilityCondition,
                eq(notifications.isImportant, true),
                unreadCondition
              )
            )
            .orderBy(desc(notifications.createdAt))
            .limit(1)
            .then(r => r[0] || null)
        ])

        notificationSummary = {
          unreadCount: unreadCountResult.count,
          importantUnread: firstImportantUnreadResult ? {
            id: firstImportantUnreadResult.id,
            schoolId: firstImportantUnreadResult.schoolId,
            title: firstImportantUnreadResult.title,
            message: firstImportantUnreadResult.message,
            isImportant: firstImportantUnreadResult.isImportant,
            createdAt: firstImportantUnreadResult.createdAt,
            isRead: false, // It's unread, so always false
          } : null,
        }
      }
    }

    const [
      studentsCount,
      facultyCount,
      registrationsCount,
    ] = await Promise.all(countPromises)

    return {
      success: true,
      stats: {
        totalStudents: studentsCount.count,
        totalFaculty: facultyCount.count,
        totalRegistrations: registrationsCount.count,
      },
      notifications: notificationSummary,
    }
  } catch (error) {
    console.error("Error fetching faculty dashboard stats:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch dashboard statistics",
    })
  }
})

