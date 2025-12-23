import { useDB } from "../utils/db"
import { notifications, notificationRecipients, schools } from "../database/schema"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"

// TODO: Add proper admin authentication middleware
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const body = await readBody(event)

  const { schoolId, title, message, isImportant } = body

  // Validation
  if (!title || !message) {
    throw createError({
      statusCode: 400,
      message: "Title and message are required",
    })
  }

  try {
    // If schoolId is provided, verify school exists
    if (schoolId) {
      const [school] = await db
        .select()
        .from(schools)
        .where(eq(schools.id, schoolId))
        .limit(1)

      if (!school) {
        throw createError({
          statusCode: 404,
          message: "School not found",
        })
      }
    }

    // Create the notification
    const notificationId = nanoid()
    const [newNotification] = await db
      .insert(notifications)
      .values({
        id: notificationId,
        schoolId: schoolId || null,
        title,
        message,
        isImportant: isImportant === true || isImportant === "true" || false,
      })
      .returning()

    // Create recipient records
    if (schoolId) {
      // School-specific: create recipient for that school only
      await db.insert(notificationRecipients).values({
        id: nanoid(),
        notificationId,
        schoolId,
        isRead: false,
      })
    } else {
      // Common notification: create recipients for all existing schools
      const allSchools = await db.select().from(schools)
      const recipientValues = allSchools.map((school) => ({
        id: nanoid(),
        notificationId,
        schoolId: school.id,
        isRead: false,
      }))
      
      if (recipientValues.length > 0) {
        await db.insert(notificationRecipients).values(recipientValues)
      }
    }

    return {
      success: true,
      message: schoolId ? "Notification created for the specified school" : "Notification created for all schools",
      data: newNotification,
    }
  } catch (error: any) {
    console.error("Error creating notification:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to create notification",
    })
  }
})

