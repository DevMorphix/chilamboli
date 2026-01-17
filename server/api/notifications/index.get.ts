import { useDB } from "../../utils/db"
import { notifications, schools } from "../../database/schema"
import { desc, inArray, like, or, count } from "drizzle-orm"
import { getPaginationParams, createPaginatedResponse } from "../../utils/pagination"

// Get all notifications (admin view) - paginated
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const { page, limit, search, sortBy, sortOrder } = getPaginationParams(query)

  try {
    let whereClause: any = undefined

    // Apply search
    if (search) {
      const searchPattern = `%${search}%`
      whereClause = or(
        like(notifications.title, searchPattern),
        like(notifications.message, searchPattern)
      )
    }

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(notifications)
      .where(whereClause)

    const total = totalResult.count

    // Apply pagination
    const offset = (page - 1) * limit

    // Get paginated notifications
    const allNotifications = await db
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset)

    // Get unique school IDs
    const schoolIds = [...new Set(allNotifications.filter((n) => n.schoolId).map((n) => n.schoolId!))]
    
    const schoolMap = new Map<string, { name: string; code: string }>()
    if (schoolIds.length > 0) {
      const schoolsList = await db
        .select({
          id: schools.id,
          name: schools.name,
          schoolCode: schools.schoolCode,
        })
        .from(schools)
        .where(inArray(schools.id, schoolIds))
      
      schoolsList.forEach((school) => {
        schoolMap.set(school.id, { name: school.name, code: school.schoolCode })
      })
    }

    const formattedNotifications = allNotifications.map((notification) => {
      const schoolInfo = notification.schoolId ? schoolMap.get(notification.schoolId) : null
      return {
        id: notification.id,
        schoolId: notification.schoolId,
        schoolName: schoolInfo?.name || null,
        schoolCode: schoolInfo?.code || null,
        title: notification.title,
        message: notification.message,
        isImportant: notification.isImportant,
        createdAt: notification.createdAt,
        scope: notification.schoolId ? 'school' : 'all',
      }
    })

    const paginatedResponse = createPaginatedResponse(formattedNotifications, total, {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
    })

    return {
      success: true,
      ...paginatedResponse,
    }
  } catch (error: any) {
    console.error("Error fetching notifications:", error)

    throw createError({
      statusCode: 500,
      message: "Failed to fetch notifications",
    })
  }
})
