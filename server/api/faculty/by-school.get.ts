import { useDB } from "../../utils/db"
import { faculty, auth } from "../../database/schema"
import { eq, and, desc, asc, count, like, or, sql } from "drizzle-orm"
import { getPaginationParams, createPaginatedResponse } from "../../utils/pagination"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const { schoolId } = query
  const { page, limit, search, sortBy, sortOrder, filters } = getPaginationParams(query)

  if (!schoolId) {
    throw createError({
      statusCode: 400,
      message: "School ID is required",
    })
  }

  try {
    const schoolIdStr = schoolId as string
    const authJoinCondition = and(
      eq(auth.userId, faculty.id),
      eq(auth.userType, "faculty")
    )
    
    // Build base conditions
    const conditions: any[] = [eq(faculty.schoolId, schoolIdStr)]
    
    // Apply filters
    if (filters?.isVerified !== undefined) {
      conditions.push(eq(faculty.isVerified, filters.isVerified === 'true' || filters.isVerified === true))
    }

    // Apply search - if searching, include email search which requires auth join
    if (search) {
      const searchPattern = `%${search}%`
      conditions.push(or(
        like(faculty.facultyName, searchPattern),
        like(faculty.mobileNumber, searchPattern),
        like(auth.email, searchPattern)
      ))
    }

    const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions)

    // Build count query - join auth only if searching (to support email search)
    const countQuery = search
      ? db
          .select({ count: count() })
          .from(faculty)
          .leftJoin(auth, authJoinCondition)
      : db
          .select({ count: count() })
          .from(faculty)
    
    const [totalResult] = await countQuery.where(whereClause)
    const total = totalResult?.count || 0

    // Apply sorting
    let orderByClause: any = desc(faculty.createdAt) // default
    if (sortBy) {
      const sortField = faculty[sortBy as keyof typeof faculty] as any
      if (sortField) {
        orderByClause = sortOrder === 'desc' ? desc(sortField) : asc(sortField)
      }
    }

    const offset = (page - 1) * limit
    const facultyList = await db
      .select({
        id: faculty.id,
        schoolId: faculty.schoolId,
        facultyName: faculty.facultyName,
        mobileNumber: faculty.mobileNumber,
        createdBy: faculty.createdBy,
        isVerified: faculty.isVerified,
        createdAt: faculty.createdAt,
        updatedAt: faculty.updatedAt,
        email: auth.email,
      })
      .from(faculty)
      .leftJoin(auth, authJoinCondition)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset)

    // Map results to expected format
    const result = facultyList.map((fac) => ({
      id: fac.id,
      schoolId: fac.schoolId,
      facultyName: fac.facultyName,
      mobileNumber: fac.mobileNumber,
      schoolEmail: fac.email || '',
      createdBy: fac.createdBy,
      isVerified: fac.isVerified,
      createdAt: fac.createdAt,
      updatedAt: fac.updatedAt,
    }))

    return {
      success: true,
      ...createPaginatedResponse(result, total, { page, limit, search, sortBy, sortOrder, filters }),
    }
  } catch (error) {
    console.error("Error fetching faculty:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch faculty",
    })
  }
})

