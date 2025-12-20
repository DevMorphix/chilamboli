import { useDB } from "../../utils/db"
import { schools, faculty, students, registrations, events, registrationParticipants } from "../../database/schema"
import { eq, and, gte, lte, lt, sql, count, desc } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const query = getQuery(event)
  const period = (query.period as string) || 'this_month'

  try {
    const now = new Date()
    let startDate: Date
    let endDate: Date | null = null

    // Calculate start and end dates based on period
    switch (period) {
      case 'today': {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        endDate = now
        break
      }
      case 'yesterday': {
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0)
        endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999)
        break
      }
      case 'this_week': {
        // Get Monday of current week
        const dayOfWeek = now.getDay()
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust when day is Sunday
        startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0)
        endDate = now
        break
      }
      case 'this_month': {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
        endDate = now
        break
      }
      case 'all':
      default: {
        startDate = new Date(0) // Epoch start
        endDate = null // No end date for "all"
        break
      }
    }

    // Overall Statistics - Run in parallel for better performance
    const [
      schoolsCount,
      facultyCount,
      studentsCount,
      registrationsCount,
      eventsCount,
      verifiedFacultyCount
    ] = await Promise.all([
      db.select({ count: count() }).from(schools).then(r => r[0]),
      db.select({ count: count() }).from(faculty).then(r => r[0]),
      db.select({ count: count() }).from(students).then(r => r[0]),
      db.select({ count: count() }).from(registrations).then(r => r[0]),
      db.select({ count: count() }).from(events).then(r => r[0]),
      db.select({ count: count() }).from(faculty).where(eq(faculty.isVerified, true)).then(r => r[0])
    ])

    // Helper function to build date range conditions
    const buildDateCondition = (column: any) => {
      if (endDate) {
        return and(gte(column, startDate), lte(column, endDate))
      }
      return gte(column, startDate)
    }

    // Faculty Verification Rate
    const verificationRate = verifiedFacultyCount.count / (facultyCount.count || 1) * 100

    // Run independent queries in parallel for better performance
    const recentStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const [
      registrationTrends,
      studentAgeDistribution,
      studentGenderDistribution,
      schoolParticipation,
      eventPopularity,
      recentRegistrations,
      recentStudents,
      recentFaculty,
      registrationByEventType,
      studentRegistrationTrends,
      participatingSchoolsCountResult
    ] = await Promise.all([
      // Registration Trends (daily for selected period)
      db
        .select({
          date: sql<string>`DATE(${registrations.createdAt}, 'unixepoch') as date`,
          count: sql<number>`COUNT(*) as count`,
        })
        .from(registrations)
        .where(buildDateCondition(registrations.createdAt))
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
      
      // School Participation (top schools by registrations) - Simplified to reduce rows read
      db
        .select({
          schoolId: registrations.schoolId,
          schoolName: schools.name,
          schoolCode: schools.schoolCode,
          registrationCount: sql<number>`COUNT(${registrations.id}) as count`,
        })
        .from(registrations)
        .innerJoin(schools, eq(registrations.schoolId, schools.id))
        .where(buildDateCondition(registrations.createdAt))
        .groupBy(registrations.schoolId, schools.name, schools.schoolCode)
        .orderBy(desc(sql`COUNT(${registrations.id})`))
        .limit(10),
      
      // Event Popularity (most registered events) - Simplified to reduce rows read
      db
        .select({
          eventId: registrations.eventId,
          eventName: events.name,
          eventType: events.eventType,
          ageCategory: events.ageCategory,
          registrationCount: sql<number>`COUNT(${registrations.id}) as count`,
        })
        .from(registrations)
        .innerJoin(events, eq(registrations.eventId, events.id))
        .where(buildDateCondition(registrations.createdAt))
        .groupBy(registrations.eventId, events.name, events.eventType, events.ageCategory)
        .orderBy(desc(sql`COUNT(${registrations.id})`))
        .limit(10),
      
      // Recent Activity - Registrations
      db.select({ count: count() }).from(registrations).where(gte(registrations.createdAt, recentStartDate)).then(r => r[0]),
      
      // Recent Activity - Students
      db.select({ count: count() }).from(students).where(gte(students.createdAt, recentStartDate)).then(r => r[0]),
      
      // Recent Activity - Faculty
      db.select({ count: count() }).from(faculty).where(gte(faculty.createdAt, recentStartDate)).then(r => r[0]),
      
      // Registration by Event Type
      db
        .select({
          eventType: events.eventType,
          count: sql<number>`COUNT(DISTINCT ${registrations.id}) as count`,
        })
        .from(registrations)
        .innerJoin(events, eq(registrations.eventId, events.id))
        .where(buildDateCondition(registrations.createdAt))
        .groupBy(events.eventType),
      
      // Student registration trends (daily for comparison)
      db
        .select({
          date: sql<string>`DATE(${students.createdAt}, 'unixepoch') as date`,
          count: sql<number>`COUNT(*) as count`,
        })
        .from(students)
        .where(buildDateCondition(students.createdAt))
        .groupBy(sql`DATE(${students.createdAt}, 'unixepoch')`)
        .orderBy(sql`DATE(${students.createdAt}, 'unixepoch')`),
      
      // Count participating schools (schools with at least one registration)
      db
        .select({ count: sql<number>`COUNT(DISTINCT ${registrations.schoolId}) as count` })
        .from(registrations)
        .where(buildDateCondition(registrations.createdAt))
        .then(r => r[0])
    ])
    
    const participatingSchoolsCount = participatingSchoolsCountResult

    // School performance breakdown - Optimized to reduce rows read
    // Strategy: Use separate aggregation queries per metric, then combine in memory
    // This avoids cartesian products from JOINs and reads only necessary rows
    const startTimestamp = startDate.getTime()
    const endTimestamp = endDate ? endDate.getTime() : null
    
    // Get all schools first (lightweight - just IDs and names)
    const allSchoolsList = await db
      .select({
        id: schools.id,
        name: schools.name,
        schoolCode: schools.schoolCode,
        location: schools.location,
      })
      .from(schools)
    
    // Get aggregated counts per school in parallel - each query is optimized
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
      
      // Registration counts per school (with date filter)
      db
        .select({
          schoolId: registrations.schoolId,
          count: sql<number>`COUNT(*) as count`,
        })
        .from(registrations)
        .where(buildDateCondition(registrations.createdAt))
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

    // Event category breakdown - Removed as it's not used in the dashboard
    // This reduces unnecessary database reads


    // Growth metrics (compare current period with previous period)
    // Only calculate growth if we have an endDate (not "all time")
    let registrationGrowth = 0
    let currentPeriod = 0
    let previousPeriod = 0
    
    if (endDate && period !== 'all') {
      const periodDuration = endDate.getTime() - startDate.getTime()
      const previousPeriodStart = new Date(startDate.getTime() - periodDuration)
      const previousPeriodEnd = startDate
      
      const [currentPeriodRegistrations] = await db
        .select({ count: count() })
        .from(registrations)
        .where(and(gte(registrations.createdAt, startDate), lte(registrations.createdAt, endDate)))
      const [previousPeriodRegistrations] = await db
        .select({ count: count() })
        .from(registrations)
        .where(and(gte(registrations.createdAt, previousPeriodStart), lt(registrations.createdAt, previousPeriodEnd)))
      
      currentPeriod = currentPeriodRegistrations.count
      previousPeriod = previousPeriodRegistrations.count
      registrationGrowth = previousPeriod > 0
        ? ((currentPeriod - previousPeriod) / previousPeriod) * 100
        : 0
    }

    return {
      success: true,
      period: period,
      overview: {
        totalSchools: schoolsCount.count,
        participatingSchools: Number(participatingSchoolsCount.count),
        totalFaculty: facultyCount.count,
        verifiedFaculty: verifiedFacultyCount.count,
        verificationRate: Math.round(verificationRate * 100) / 100,
        totalStudents: studentsCount.count,
        totalRegistrations: registrationsCount.count,
        totalEvents: eventsCount.count,
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
      topPerformers: {
        schools: schoolParticipation.map((s) => ({
          schoolId: s.schoolId,
          schoolName: s.schoolName,
          schoolCode: s.schoolCode,
          registrations: Number(s.registrationCount),
          students: 0, // Removed to reduce database reads - can be added back if needed
        })),
        events: eventPopularity.map((e) => ({
          eventId: e.eventId,
          eventName: e.eventName,
          eventType: e.eventType,
          ageCategory: e.ageCategory,
          registrations: Number(e.registrationCount),
          participants: 0, // Removed to reduce database reads - can be added back if needed
        })),
      },
      recentActivity: {
        registrations: recentRegistrations.count,
        students: recentStudents.count,
        faculty: recentFaculty.count,
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
        eventCategory: [], // Removed to reduce database reads
      },
      growth: {
        registrationGrowth: Math.round(registrationGrowth * 100) / 100,
        currentPeriod: currentPeriod,
        previousPeriod: previousPeriod,
      },
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

