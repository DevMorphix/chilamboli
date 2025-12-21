import { useDB } from "../../utils/db"
import { schools, faculty, students, registrations, events } from "../../database/schema"
import { eq, sql, count, desc, gte } from "drizzle-orm"

const CACHE_KEY = "admin:analytics"
const CACHE_TTL = 60 * 60 // 1 hour in seconds

interface CachedAnalytics {
  data: any
  capturedAt: number // timestamp when data was captured
}

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  // Using the same KV storage as kv.ts utilities (useStorage("kv"))
  const storage = useStorage("kv")

  try {
    // Try to get cached data
    const cached = await storage.getItem<CachedAnalytics>(CACHE_KEY)
    if (cached) {
      return {
        success: true,
        ...cached.data,
        dataCapturedAt: cached.capturedAt,
        cached: true,
      }
    }

    // If no cache, fetch fresh data
    const capturedAt = Date.now()

    // Overall Statistics - Run in parallel for better performance
    const [
      schoolsCount,
      facultyCount,
      studentsCount,
      registrationsCount,
      verifiedFacultyCount
    ] = await Promise.all([
      db.select({ count: count() }).from(schools).then(r => r[0]),
      db.select({ count: count() }).from(faculty).then(r => r[0]),
      db.select({ count: count() }).from(students).then(r => r[0]),
      db.select({ count: count() }).from(registrations).then(r => r[0]),
      db.select({ count: count() }).from(faculty).where(eq(faculty.isVerified, true)).then(r => r[0])
    ])

    // Faculty Verification Rate
    const verificationRate = verifiedFacultyCount.count / (facultyCount.count || 1) * 100

    // Run data queries in parallel
    const [
      registrationTrends,
      studentAgeDistribution,
      studentGenderDistribution,
      registrationByEventType,
      studentRegistrationTrends,
      participatingSchoolsCountResult
    ] = await Promise.all([
      // Registration Trends (daily - all time)
      db
        .select({
          date: sql<string>`DATE(${registrations.createdAt}, 'unixepoch') as date`,
          count: sql<number>`COUNT(*) as count`,
        })
        .from(registrations)
        .groupBy(sql`DATE(${registrations.createdAt}, 'unixepoch')`)
        .orderBy(sql`DATE(${registrations.createdAt}, 'unixepoch')`),
      
      // Student Distribution by Age Category
      db
        .select({
          category: students.ageCategory,
          count: sql<number>`COUNT(*) as count`,
        })
        .from(students)
        .groupBy(students.ageCategory),
      
      // Student Distribution by Gender
      db
        .select({
          gender: students.gender,
          count: sql<number>`COUNT(*) as count`,
        })
        .from(students)
        .groupBy(students.gender),
      
      // Registration by Event Type
      db
        .select({
          eventType: events.eventType,
          count: sql<number>`COUNT(DISTINCT ${registrations.id}) as count`,
        })
        .from(registrations)
        .innerJoin(events, eq(registrations.eventId, events.id))
        .groupBy(events.eventType),
      
      // Student registration trends (daily - all time)
      db
        .select({
          date: sql<string>`DATE(${students.createdAt}, 'unixepoch') as date`,
          count: sql<number>`COUNT(*) as count`,
        })
        .from(students)
        .groupBy(sql`DATE(${students.createdAt}, 'unixepoch')`)
        .orderBy(sql`DATE(${students.createdAt}, 'unixepoch')`),
      
      // Count participating schools (schools with at least one registration)
      db
        .select({ count: sql<number>`COUNT(DISTINCT ${registrations.schoolId}) as count` })
        .from(registrations)
        .then(r => r[0])
    ])
    
    const participatingSchoolsCount = participatingSchoolsCountResult

    // School performance breakdown - Get all schools first
    const allSchoolsList = await db
      .select({
        id: schools.id,
        name: schools.name,
        schoolCode: schools.schoolCode,
        location: schools.location,
      })
      .from(schools)
    
    // Get aggregated counts per school in parallel
    const [
      studentCounts,
      registrationCounts,
      facultyCounts,
      verifiedFacultyCounts
    ] = await Promise.all([
      // Student counts per school
      db
        .select({
          schoolId: students.schoolId,
          count: sql<number>`COUNT(*) as count`,
        })
        .from(students)
        .groupBy(students.schoolId),
      
      // Registration counts per school (all time)
      db
        .select({
          schoolId: registrations.schoolId,
          count: sql<number>`COUNT(*) as count`,
        })
        .from(registrations)
        .groupBy(registrations.schoolId),
      
      // Total faculty counts per school
      db
        .select({
          schoolId: faculty.schoolId,
          count: sql<number>`COUNT(*) as count`,
        })
        .from(faculty)
        .groupBy(faculty.schoolId),
      
      // Verified faculty counts per school
      db
        .select({
          schoolId: faculty.schoolId,
          count: sql<number>`COUNT(*) as count`,
        })
        .from(faculty)
        .where(eq(faculty.isVerified, true))
        .groupBy(faculty.schoolId),
    ])
    
    // Create lookup maps for O(1) access
    const studentCountMap = new Map(studentCounts.map(s => [s.schoolId, Number(s.count)]))
    const registrationCountMap = new Map(registrationCounts.map(r => [r.schoolId, Number(r.count)]))
    const facultyCountMap = new Map(facultyCounts.map(f => [f.schoolId, Number(f.count)]))
    const verifiedFacultyCountMap = new Map(verifiedFacultyCounts.map(f => [f.schoolId, Number(f.count)]))
    
    // Combine data - only include schools with students or registrations
    const schoolsWithData = allSchoolsList
      .map(school => {
        const totalStudents = studentCountMap.get(school.id) || 0
        const totalRegistrations = registrationCountMap.get(school.id) || 0
        const totalFaculty = facultyCountMap.get(school.id) || 0
        const verifiedFaculty = verifiedFacultyCountMap.get(school.id) || 0
        
        return {
          schoolId: school.id,
          schoolName: school.name,
          schoolCode: school.schoolCode,
          location: school.location,
          totalStudents,
          totalRegistrations,
          verifiedFaculty,
          totalFaculty,
        }
      })
      .filter(school => school.totalStudents > 0 || school.totalRegistrations > 0)
      .sort((a, b) => b.totalRegistrations - a.totalRegistrations)

    const responseData = {
      overview: {
        totalSchools: schoolsCount.count,
        participatingSchools: Number(participatingSchoolsCount.count),
        totalFaculty: facultyCount.count,
        verifiedFaculty: verifiedFacultyCount.count,
        verificationRate: Math.round(verificationRate * 100) / 100,
        totalStudents: studentsCount.count,
        totalRegistrations: registrationsCount.count,
      },
      trends: {
        registrations: registrationTrends.map((t) => ({
          date: t.date,
          count: Number(t.count),
        })),
        students: studentRegistrationTrends.map((t) => ({
          date: t.date,
          count: Number(t.count),
        })),
      },
      distributions: {
        studentsByAge: studentAgeDistribution.map((d) => ({
          category: d.category,
          count: Number(d.count),
        })),
        studentsByGender: studentGenderDistribution.map((d) => ({
          gender: d.gender,
          count: Number(d.count),
        })),
        registrationsByEventType: registrationByEventType.map((d) => ({
          eventType: d.eventType,
          count: Number(d.count),
        })),
      },
      breakdowns: {
        schoolPerformance: schoolsWithData.map((s) => ({
          schoolId: s.schoolId,
          schoolName: s.schoolName,
          schoolCode: s.schoolCode,
          location: s.location,
          students: Number(s.totalStudents),
          registrations: Number(s.totalRegistrations),
          verifiedFaculty: Number(s.verifiedFaculty),
          totalFaculty: Number(s.totalFaculty),
          registrationRate: Number(s.totalStudents) > 0 
            ? Math.round((Number(s.totalRegistrations) / Number(s.totalStudents)) * 100 * 100) / 100 
            : 0,
        })),
      },
    }

    // Cache the response data
    const cacheData: CachedAnalytics = {
      data: responseData,
      capturedAt,
    }
    await storage.setItem(CACHE_KEY, cacheData, { ttl: CACHE_TTL })

    return {
      success: true,
      ...responseData,
      dataCapturedAt: capturedAt,
      cached: false,
    }
  } catch (error: any) {
    console.error("Error fetching analytics:", error)
    console.error("Error details:", error.message, error.stack)
    throw createError({
      statusCode: 500,
      message: `Failed to fetch analytics: ${error.message || 'Unknown error'}`,
    })
  }
})
