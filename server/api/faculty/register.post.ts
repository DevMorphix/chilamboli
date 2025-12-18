import { useDB } from "../../utils/db"
import { faculty, schools } from "../../database/schema"
import { storeOtp, generateOtp } from "../../utils/kv"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import bcrypt from "bcryptjs"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
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
    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1)

    if (!school) {
      throw createError({
        statusCode: 404,
        message: "School not found",
      })
    }

    // Check if faculty with email already exists
    const [existingFaculty] = await db
      .select()
      .from(faculty)
      .where(eq(faculty.schoolEmail, schoolEmail))
      .limit(1)

    if (existingFaculty) {
      throw createError({
        statusCode: 409,
        message: "Faculty with this email already exists",
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create faculty
    const id = nanoid()
    const [newFaculty] = await db
      .insert(faculty)
      .values({
        id,
        schoolId,
        facultyName,
        mobileNumber,
        schoolEmail,
        password: hashedPassword,
        isVerified: false,
      })
      .returning()

    // Generate and store OTP in KV Store
    const otp = generateOtp()
    await storeOtp(newFaculty.id, otp)

    // TODO: In production, send OTP via email
    // For now, return OTP in response (development only)
    console.log(`OTP for ${schoolEmail}: ${otp}`)

    return {
      success: true,
      message: "Registration successful. Please verify your email with the OTP sent.",
      facultyId: newFaculty.id,
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
