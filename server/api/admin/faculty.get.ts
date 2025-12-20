import { useDB } from "../../utils/db"
import { faculty, schools } from "../../database/schema"
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
          like(faculty.schoolEmail, searchPattern)
        )
      )
    }

    if (filters?.isVerified !== undefined) {
      conditions.push(eq(faculty.isVerified, filters.isVerified === 'true' || filters.isVerified === true))
    }

    if (conditions.length > 0) {
      whereClause = conditions.length === 1 ? conditions[0] : and(...conditions)
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(faculty)
      .where(whereClause)

    const total = totalResult.count

    const offset = (page - 1) * limit
    // Use JOIN to fetch school data in a single query instead of N+1 queries
    const facultyList = await db
      .select({
        // Faculty fields
        id: faculty.id,
        schoolId: faculty.schoolId,
        facultyName: faculty.facultyName,
        mobileNumber: faculty.mobileNumber,
        schoolEmail: faculty.schoolEmail,
        password: faculty.password,
        isVerified: faculty.isVerified,
        createdAt: faculty.createdAt,
        updatedAt: faculty.updatedAt,
        // School fields
        schoolName: schools.name,
        schoolCode: schools.schoolCode,
      })
      .from(faculty)
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
      schoolEmail: fac.schoolEmail,
      password: fac.password,
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

