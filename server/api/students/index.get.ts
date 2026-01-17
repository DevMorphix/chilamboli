import { useDB } from "../../utils/db"
import { students, schools, faculty } from "../../database/schema"
import { eq, like, or, and, count, asc, desc } from "drizzle-orm"
import { getPaginationParams, createPaginatedResponse } from "../../utils/pagination"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const { page, limit, search, sortBy, sortOrder, filters } = getPaginationParams(query)

  try {
    let whereClause: any = undefined
    const conditions: any[] = []

    if (search) {
      const searchPattern = `%${search}%`
      conditions.push(
        or(
          like(students.studentName, searchPattern),
          like(students.studentId, searchPattern)
        )
      )
    }

    if (filters?.ageCategory) {
      conditions.push(eq(students.ageCategory, filters.ageCategory as any))
    }

    if (filters?.gender) {
      conditions.push(eq(students.gender, filters.gender as any))
    }

    if (filters?.schoolId) {
      conditions.push(eq(students.schoolId, filters.schoolId as string))
    }

    if (conditions.length > 0) {
      whereClause = conditions.length === 1 ? conditions[0] : and(...conditions)
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(students)
      .where(whereClause)

    const total = totalResult.count

    // Apply sorting
    let orderByClause: any = desc(students.createdAt) // default
    if (sortBy) {
      const sortField = students[sortBy as keyof typeof students] as any
      if (sortField) {
        orderByClause = sortOrder === 'desc' ? desc(sortField) : asc(sortField)
      }
    }

    const offset = (page - 1) * limit
    // Use JOINs to fetch related data in a single query instead of N+1 queries
    const studentsList = await db
      .select({
        // Student fields
        id: students.id,
        studentId: students.studentId,
        studentName: students.studentName,
        dateOfBirth: students.dateOfBirth,
        ageCategory: students.ageCategory,
        gender: students.gender,
        photoUrl: students.photoUrl,
        disabilityCertificateUrl: students.disabilityCertificateUrl,
        schoolId: students.schoolId,
        addedByFacultyId: students.addedByFacultyId,
        createdAt: students.createdAt,
        updatedAt: students.updatedAt,
        // School fields
        schoolName: schools.name,
        schoolCode: schools.schoolCode,
        // Faculty fields
        addedByFacultyName: faculty.facultyName,
      })
      .from(students)
      .leftJoin(schools, eq(students.schoolId, schools.id))
      .leftJoin(faculty, eq(students.addedByFacultyId, faculty.id))
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset)

    // Map results to expected format
    const results = studentsList.map((student) => ({
      id: student.id,
      studentId: student.studentId,
      studentName: student.studentName,
      dateOfBirth: student.dateOfBirth,
      ageCategory: student.ageCategory,
      gender: student.gender,
      photoUrl: student.photoUrl,
      disabilityCertificateUrl: student.disabilityCertificateUrl,
      schoolId: student.schoolId,
      addedByFacultyId: student.addedByFacultyId,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
      schoolName: student.schoolName || 'Unknown',
      schoolCode: student.schoolCode || '',
      addedByFacultyName: student.addedByFacultyName || 'Unknown',
    }))

    return createPaginatedResponse(results, total, { page, limit, search, sortBy, sortOrder, filters })
  } catch (error) {
    console.error("Error fetching students:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch students",
    })
  }
})
