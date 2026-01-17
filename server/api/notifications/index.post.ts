import { useDB } from "../../utils/db"
import { notifications, notificationRecipients, schools } from "../../database/schema"
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
      try {
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
      } catch (error: any) {
        if (error.statusCode === 404) throw error
        throw new Error(`Error verifying school: ${error?.message || String(error)}`)
      }
    }

    // Create the notification
    const notificationId = nanoid()
    const notificationValues = {
      id: notificationId,
      schoolId: schoolId || null,
      title,
      message,
      isImportant: isImportant === true || isImportant === "true" || false,
      // createdAt will be set automatically by the schema default function
    }
    
    let newNotification
    try {
      const insertResult = await db
        .insert(notifications)
        .values(notificationValues)
        .returning()

      newNotification = insertResult?.[0]
    } catch (insertError: any) {
      throw new Error(`Database insert failed: ${insertError?.message || String(insertError)}`)
    }

    // Fallback: if returning() doesn't work, query the notification back
    if (!newNotification) {
      try {
        const [queriedNotification] = await db
          .select()
          .from(notifications)
          .where(eq(notifications.id, notificationId))
          .limit(1)
        
        if (!queriedNotification) {
          throw new Error(`Notification was not created in database. ID: ${notificationId}`)
        }
        newNotification = queriedNotification
      } catch (queryError: any) {
        throw new Error(`Fallback query failed: ${queryError?.message || String(queryError)}`)
      }
    }

    if (schoolId) {
      try {
        // School-specific: create recipient for that school only
        await db.insert(notificationRecipients).values({
          id: nanoid(),
          notificationId,
          schoolId,
          isRead: false,
        })
      } catch (recipientError: any) {
        throw new Error(`Failed to create recipient: ${recipientError?.message || String(recipientError)}`)
      }
    }
    
    return {
      success: true,
      message: schoolId ? "Notification created for the specified school" : "Notification created for all schools",
      data: newNotification,
    }
  } catch (error: any) {
    console.error("Error creating notification:", error)
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      cause: error?.cause,
      name: error?.name,
      code: error?.code,
    })

    if (error.statusCode) {
      throw error
    }

    // Extract the actual error message
    const errorMessage = error?.message || "Failed to create notification"
    
    throw createError({
      statusCode: 500,
      message: errorMessage,
      data: {
        originalError: errorMessage,
        errorType: error?.name || typeof error,
      },
    })
  }
})

