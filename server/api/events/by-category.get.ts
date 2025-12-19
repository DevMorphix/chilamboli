import { useDB } from "../../utils/db"
import { events } from "../../database/schema"
import { eq, or, asc, desc, count } from "drizzle-orm"
import { getPaginationParams, createPaginatedResponse } from "../../utils/pagination"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const { ageCategory, eventType } = query
  const { page, limit, search, sortBy, sortOrder, filters } = getPaginationParams(query)

  try {
    let whereClause: any = undefined

    // Use filters or query params (backward compatibility)
    const filterAgeCategory = filters?.ageCategory || ageCategory
    const filterEventType = filters?.eventType || eventType

    if (filterAgeCategory && filterEventType) {
      // For Special category, don't include Combined events
      if (filterAgeCategory === "Special") {
        whereClause = eq(events.ageCategory, filterAgeCategory as "Sub Junior" | "Junior" | "Senior" | "Combined" | "Special")
      } else {
        whereClause = or(
          eq(events.ageCategory, filterAgeCategory as "Sub Junior" | "Junior" | "Senior" | "Combined" | "Special"),
          eq(events.ageCategory, "Combined")
        )
      }
    } else if (filterAgeCategory) {
      // For Special category, don't include Combined events
      if (filterAgeCategory === "Special") {
        whereClause = eq(events.ageCategory, filterAgeCategory as "Sub Junior" | "Junior" | "Senior" | "Combined" | "Special")
      } else {
        whereClause = or(
          eq(events.ageCategory, filterAgeCategory as "Sub Junior" | "Junior" | "Senior" | "Combined" | "Special"),
          eq(events.ageCategory, "Combined")
        )
      }
    } else if (filterEventType) {
      whereClause = eq(events.eventType, filterEventType as "Individual" | "Group" | "Combined")
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(events)
      .where(whereClause)

    let total = totalResult.count

    // Apply sorting
    let orderByClause: any = asc(events.ageCategory)
    if (sortBy) {
      const sortField = events[sortBy as keyof typeof events] as any
      if (sortField) {
        orderByClause = sortOrder === 'desc' ? desc(sortField) : asc(sortField)
      }
    } else {
      // Default sorting
      orderByClause = asc(events.ageCategory)
    }

    const offset = (page - 1) * limit
    let result = await db
      .select()
      .from(events)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset)

    // Filter by eventType in memory if both filters are present
    if (filterAgeCategory && filterEventType) {
      result = result.filter(e => e.eventType === filterEventType)
      total = result.length // Adjust total for filtered results
    }

    return {
      success: true,
      ...createPaginatedResponse(result, total, { page, limit, search, sortBy, sortOrder, filters: { ageCategory: filterAgeCategory, eventType: filterEventType } }),
    }
  } catch (error) {
    console.error("Error fetching events:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch events",
    })
  }
})
