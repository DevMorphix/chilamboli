import { useDB } from "../../utils/db"
import { schools, faculty, students, registrations, events, registrationParticipants } from "../../database/schema"
import { eq, sql, count, desc, inArray } from "drizzle-orm"

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

    // Single parallel batch: all aggregations in one round-trip wave.
    // - One faculty query (GROUP BY schoolId, isVerified) replaces 4 separate faculty scans.
    // - Overview counts (totalStudents, totalRegistrations, participatingSchools) derived from
    //   per-school aggregations; no separate full-table counts.
    // - Schools fetched only for participating school IDs (not full table scan).
    const [
      schoolsCountResult,
      facultyBySchoolAndVerified,
      studentCounts,
      registrationCounts,
      registrationTrends,
      studentAgeDistribution,
      studentGenderDistribution,
      registrationByEventType,
      studentRegistrationTrends,
      participatingStudentsCountResult,
      registrationsByEvent,
      studentsByEvent,
    ] = await Promise.all([
      db.select({ count: count() }).from(schools).then((r) => r[0]),

      // Single faculty scan: GROUP BY schoolId, isVerified → derive total, verified, per-school
      db
        .select({
          schoolId: faculty.schoolId,
          isVerified: faculty.isVerified,
          count: sql<number>`COUNT(*) as count`,
        })
        .from(faculty)
        .groupBy(faculty.schoolId, faculty.isVerified),

      db
        .select({
          schoolId: students.schoolId,
          count: sql<number>`COUNT(*) as count`,
        })
        .from(students)
        .groupBy(students.schoolId),

      db
        .select({
          schoolId: registrations.schoolId,
          count: sql<number>`COUNT(*) as count`,
        })
        .from(registrations)
        .groupBy(registrations.schoolId),

      db
        .select({
          date: sql<string>`DATE(${registrations.createdAt}, 'unixepoch') as date`,
          count: sql<number>`COUNT(*) as count`,
        })
        .from(registrations)
        .groupBy(sql`DATE(${registrations.createdAt}, 'unixepoch')`)
        .orderBy(sql`DATE(${registrations.createdAt}, 'unixepoch')`),

      db
        .select({
          category: students.ageCategory,
          count: sql<number>`COUNT(*) as count`,
        })
        .from(students)
        .groupBy(students.ageCategory),

      db
        .select({
          gender: students.gender,
          count: sql<number>`COUNT(*) as count`,
        })
        .from(students)
        .groupBy(students.gender),

      db
        .select({
          eventType: events.eventType,
          count: sql<number>`COUNT(DISTINCT ${registrations.id}) as count`,
        })
        .from(registrations)
        .innerJoin(events, eq(registrations.eventId, events.id))
        .groupBy(events.eventType),

      db
        .select({
          date: sql<string>`DATE(${students.createdAt}, 'unixepoch') as date`,
          count: sql<number>`COUNT(*) as count`,
        })
        .from(students)
        .groupBy(sql`DATE(${students.createdAt}, 'unixepoch')`)
        .orderBy(sql`DATE(${students.createdAt}, 'unixepoch')`),

      db
        .select({ count: sql<number>`COUNT(DISTINCT ${registrationParticipants.participantId}) as count` })
        .from(registrationParticipants)
        .where(eq(registrationParticipants.participantType, "student"))
        .then((r) => r[0]),

      db
        .select({
          eventId: events.id,
          eventName: events.name,
          count: sql<number>`COUNT(DISTINCT ${registrations.id}) as count`,
        })
        .from(registrations)
        .innerJoin(events, eq(registrations.eventId, events.id))
        .groupBy(events.id, events.name)
        .orderBy(desc(sql`COUNT(DISTINCT ${registrations.id})`)),

      db
        .select({
          eventId: events.id,
          eventName: events.name,
          count: sql<number>`COUNT(DISTINCT ${registrationParticipants.participantId}) as count`,
        })
        .from(registrationParticipants)
        .innerJoin(registrations, eq(registrationParticipants.registrationId, registrations.id))
        .innerJoin(events, eq(registrations.eventId, events.id))
        .where(eq(registrationParticipants.participantType, "student"))
        .groupBy(events.id, events.name)
        .orderBy(desc(sql`COUNT(DISTINCT ${registrationParticipants.participantId})`)),
    ])

    const schoolsCount = schoolsCountResult
    const participatingStudentsCount = participatingStudentsCountResult

    // Derive faculty overview and per-school maps from single faculty aggregation
    let totalFaculty = 0
    let verifiedFaculty = 0
    const facultyCountMap = new Map<string, number>()
    const verifiedFacultyCountMap = new Map<string, number>()
    for (const row of facultyBySchoolAndVerified) {
      const c = Number(row.count)
      totalFaculty += c
      if (row.isVerified) verifiedFaculty += c
      facultyCountMap.set(row.schoolId, (facultyCountMap.get(row.schoolId) ?? 0) + c)
      if (row.isVerified) {
        verifiedFacultyCountMap.set(row.schoolId, (verifiedFacultyCountMap.get(row.schoolId) ?? 0) + c)
      }
    }
    const verificationRate = totalFaculty > 0 ? (verifiedFaculty / totalFaculty) * 100 : 0

    // Derive overview counts from per-school aggregations (no extra DB reads)
    const totalStudents = studentCounts.reduce((s, r) => s + Number(r.count), 0)
    const totalRegistrations = registrationCounts.reduce((s, r) => s + Number(r.count), 0)
    const participatingSchoolsCount = new Set(registrationCounts.map((r) => r.schoolId)).size

    const studentCountMap = new Map(studentCounts.map((s) => [s.schoolId, Number(s.count)]))
    const registrationCountMap = new Map(registrationCounts.map((r) => [r.schoolId, Number(r.count)]))

    // Fetch only participating schools (schools with students or registrations) — no full table scan
    const participatingSchoolIds = [
      ...new Set([
        ...studentCountMap.keys(),
        ...registrationCountMap.keys(),
      ]),
    ]
    const allSchoolsList =
      participatingSchoolIds.length > 0
        ? await db
            .select({
              id: schools.id,
              name: schools.name,
              schoolCode: schools.schoolCode,
              location: schools.location,
            })
            .from(schools)
            .where(inArray(schools.id, participatingSchoolIds))
        : []
    
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
        participatingSchools: participatingSchoolsCount,
        totalFaculty,
        verifiedFaculty,
        verificationRate: Math.round(verificationRate * 100) / 100,
        totalStudents,
        participatingStudents: Number(participatingStudentsCount?.count ?? 0),
        totalRegistrations,
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
        registrationsByEvent: registrationsByEvent.map((d) => ({
          eventId: d.eventId,
          eventName: d.eventName,
          count: Number(d.count),
        })),
        studentsByEvent: studentsByEvent.map((d) => ({
          eventId: d.eventId,
          eventName: d.eventName,
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
