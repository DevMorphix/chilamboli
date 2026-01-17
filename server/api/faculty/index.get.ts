import { useDB } from "../../utils/db"
import { faculty, schools, auth } from "../../database/schema"
import { eq, like, or, and, count } from "drizzle-orm"
import { getPaginationParams, createPaginatedResponse } from "../../utils/pagination"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const { page, limit, search, filters } = getPaginationParams(query)

  try {
    let whereClause: any = undefined
    const conditions: any[] = []

    if (search) {
      const searchPattern = `%${search}%`
      conditions.push(
        or(
          like(faculty.facultyName, searchPattern),
          like(auth.email, searchPattern)
        )
      )
    }

    if (filters?.isVerified !== undefined) {
      conditions.push(eq(faculty.isVerified, filters.isVerified === 'true' || filters.isVerified === true))
    }

    if (conditions.length > 0) {
      whereClause = conditions.length === 1 ? conditions[0] : and(...conditions)
    }

    // Get total count - need to join auth if searching by email
    let total: number
    if (search) {
      const searchPattern = `%${search}%`
      const [totalResult] = await db
        .select({ count: count() })
        .from(faculty)
        .leftJoin(auth, and(
          eq(auth.userId, faculty.id),
          eq(auth.userType, "faculty")
        ))
        .where(
          filters?.isVerified !== undefined
            ? and(
                or(
                  like(faculty.facultyName, searchPattern),
                  like(auth.email, searchPattern)
                ),
                eq(faculty.isVerified, filters.isVerified === 'true' || filters.isVerified === true)
              )
            : or(
                like(faculty.facultyName, searchPattern),
                like(auth.email, searchPattern)
              )
        )
        .limit(1)
      total = totalResult?.count || 0
    } else {
      const [totalResult] = await db
        .select({ count: count() })
        .from(faculty)
        .where(whereClause)
      total = totalResult?.count || 0
    }

    const offset = (page - 1) * limit
    // Use JOIN to fetch school and auth data in a single query
    const facultyList = await db
      .select({
        // Faculty fields
        id: faculty.id,
        schoolId: faculty.schoolId,
        facultyName: faculty.facultyName,
        mobileNumber: faculty.mobileNumber,
        createdBy: faculty.createdBy,
        isVerified: faculty.isVerified,
        createdAt: faculty.createdAt,
        updatedAt: faculty.updatedAt,
        // Auth fields (for email)
        email: auth.email,
        // School fields
        schoolName: schools.name,
        schoolCode: schools.schoolCode,
      })
      .from(faculty)
      .leftJoin(auth, and(
        eq(auth.userId, faculty.id),
        eq(auth.userType, "faculty")
      ))
      .leftJoin(schools, eq(faculty.schoolId, schools.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)

    // Map results to expected format
    const results = facultyList.map((fac) => ({
      id: fac.id,
      schoolId: fac.schoolId,
      facultyName: fac.facultyName,
      mobileNumber: fac.mobileNumber,
      schoolEmail: fac.email || '', // Use email from auth table
      createdBy: fac.createdBy,
      isVerified: fac.isVerified,
      createdAt: fac.createdAt,
      updatedAt: fac.updatedAt,
      schoolName: fac.schoolName || 'Unknown',
      schoolCode: fac.schoolCode || '',
    }))

    return createPaginatedResponse(results, total, { page, limit, search, filters })
  } catch (error) {
    console.error("Error fetching faculty:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch faculty",
    })
  }
})
