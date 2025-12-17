import { connectDB } from "../../utils/db"
import { Faculty, School } from "../../database/models"
import bcrypt from "bcryptjs"

export default defineEventHandler(async (event) => {
  await connectDB(event)
  const body = await readBody(event)

  const { schoolEmail, password } = body

  if (!schoolEmail || !password) {
    throw createError({
      statusCode: 400,
      message: "Email and password are required",
    })
  }

  try {
    const faculty = await Faculty.findOne({ schoolEmail })

    if (!faculty) {
      throw createError({
        statusCode: 401,
        message: "Invalid email or password",
      })
    }

    if (!faculty.isVerified) {
      throw createError({
        statusCode: 403,
        message: "Please verify your email before logging in",
      })
    }

    const isPasswordValid = await bcrypt.compare(password, faculty.password)

    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        message: "Invalid email or password",
      })
    }

    // Get school details
    const school = await School.findOne({ id: faculty.schoolId })

    return {
      success: true,
      message: "Login successful",
      faculty: {
        id: faculty.id,
        facultyName: faculty.facultyName,
        schoolEmail: faculty.schoolEmail,
        mobileNumber: faculty.mobileNumber,
        schoolId: faculty.schoolId,
        schoolName: school?.name || "",
        schoolCode: school?.schoolCode || "",
      },
    }
  } catch (error: any) {
    console.error("Error logging in faculty:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to login",
    })
  }
})
