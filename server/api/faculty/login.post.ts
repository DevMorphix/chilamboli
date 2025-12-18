import { useDB } from "../../utils/db"
import { faculty, schools } from "../../database/schema"
import { eq } from "drizzle-orm"
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
    const [facultyMember] = await db
      .select()
      .from(faculty)
      .where(eq(faculty.schoolEmail, schoolEmail))
      .limit(1)

    if (!facultyMember) {
      throw createError({
        statusCode: 401,
        message: "Invalid email or password",
      })
    }

    if (!facultyMember.isVerified) {
      throw createError({
        statusCode: 403,
        message: "Please verify your email before logging in",
      })
    }

    const isPasswordValid = await bcrypt.compare(password, facultyMember.password)

    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        message: "Invalid email or password",
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
        schoolEmail: facultyMember.schoolEmail,
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
