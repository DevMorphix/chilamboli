import { useDB } from "../../utils/db"
import { faculty, schools, auth } from "../../database/schema"
import { eq, and } from "drizzle-orm"
import bcrypt from "bcryptjs"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const body = await readBody(event)

  const { schoolEmail, password } = body

  if (!schoolEmail || !password) {
    throw createError({
      statusCode: 400,
      message: "Email and password are required",
    })
  }

  try {
    // Find auth entry for faculty
    const [authEntry] = await db
      .select()
      .from(auth)
      .where(
        and(
          eq(auth.email, schoolEmail),
          eq(auth.userType, "faculty")
        )
      )
      .limit(1)

    if (!authEntry) {
      throw createError({
        statusCode: 401,
        message: "Invalid email or password",
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, authEntry.password)

    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        message: "Invalid email or password",
      })
    }

    // Get faculty details
    const [facultyMember] = await db
      .select()
      .from(faculty)
      .where(eq(faculty.id, authEntry.userId))
      .limit(1)

    if (!facultyMember) {
      throw createError({
        statusCode: 404,
        message: "Faculty not found",
      })
    }

    if (!facultyMember.isVerified) {
      throw createError({
        statusCode: 403,
        message: "Please verify your email before logging in",
      })
    }

    // Get school details
    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.id, facultyMember.schoolId))
      .limit(1)

    return {
      success: true,
      message: "Login successful",
      faculty: {
        id: facultyMember.id,
        facultyName: facultyMember.facultyName,
        schoolEmail: authEntry.email, // Use email from auth table
        mobileNumber: facultyMember.mobileNumber,
        schoolId: facultyMember.schoolId,
        schoolName: school?.name || "",
        schoolCode: school?.schoolCode || "",
      },
    }
  } catch (error: any) {
    console.error("Error logging in:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to login",
    })
  }
})
