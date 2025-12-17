import { connectDB } from "../../utils/db"
import { Faculty, School } from "../../database/models"
import { storeOtp, generateOtp } from "../../utils/kv"
import bcrypt from "bcryptjs"

export default defineEventHandler(async (event) => {
  await connectDB(event)
  const body = await readBody(event)

  const { schoolId, facultyName, mobileNumber, schoolEmail, password } = body

  if (!schoolId || !facultyName || !mobileNumber || !schoolEmail || !password) {
    throw createError({
      statusCode: 400,
      message: "All fields are required",
    })
  }

  // Validate email format
  if (!schoolEmail.includes("@") || !schoolEmail.includes(".")) {
    throw createError({
      statusCode: 400,
      message: "Invalid email format",
    })
  }

  try {
    // Check if school exists
    const school = await School.findOne({ id: schoolId })
    if (!school) {
      throw createError({
        statusCode: 404,
        message: "School not found",
      })
    }

    // Check if faculty with email already exists
    const existingFaculty = await Faculty.findOne({ schoolEmail })
    if (existingFaculty) {
      throw createError({
        statusCode: 409,
        message: "Faculty with this email already exists",
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create faculty
    const faculty = await Faculty.create({
      schoolId,
      facultyName,
      mobileNumber,
      schoolEmail,
      password: hashedPassword,
      isVerified: false,
    })

    // Generate and store OTP in KV Store
    const otp = generateOtp()
    await storeOtp(faculty.id, otp)

    // TODO: In production, send OTP via email
    // For now, return OTP in response (development only)
    console.log(`OTP for ${schoolEmail}: ${otp}`)

    return {
      success: true,
      message: "Registration successful. Please verify your email with the OTP sent.",
      facultyId: faculty.id,
      // Remove this in production
      developmentOtp: otp,
    }
  } catch (error: any) {
    console.error("Error registering faculty:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to register faculty",
    })
  }
})
