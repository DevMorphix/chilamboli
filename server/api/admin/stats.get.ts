import { useDB } from "../../utils/db"
import { schools, faculty, students, registrations, events } from "../../database/schema"
import { count, eq } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const db = useDB(event)

  try {
    // Get counts for all entities - Run in parallel for better performance
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

    return {
      success: true,
      stats: {
        totalSchools: schoolsCount.count,
        totalFaculty: facultyCount.count,
        verifiedFaculty: verifiedFacultyCount.count,
        totalStudents: studentsCount.count,
        totalRegistrations: registrationsCount.count,
        totalEvents: eventsCount.count,
      },
    }
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch admin statistics",
    })
  }
})

