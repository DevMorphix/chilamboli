import { useDB } from "../../utils/db"
import { faculty, schools, auth } from "../../database/schema"
import { storeOtp, generateOtp } from "../../utils/kv"
import { sendOtpEmail } from "../../utils/email"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import bcrypt from "bcryptjs"

// TODO: Add proper admin authentication middleware
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const body = await readBody(event)

  const { schoolId, facultyName, mobileNumber, schoolEmail, password } = body

  // Validation
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

    // Check if auth entry with email already exists (this also checks for faculty since email is unique)
    const [existingAuth] = await db
      .select()
      .from(auth)
      .where(eq(auth.email, schoolEmail))
      .limit(1)

    if (existingAuth) {
      throw createError({
        statusCode: 409,
        message: "Email already registered",
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create faculty (without schoolEmail - it's stored in auth table)
    const id = nanoid()
    const [newFaculty] = await db
      .insert(faculty)
      .values({
        id,
        schoolId,
        facultyName,
        mobileNumber,
        createdBy: null, // Admin creates, so no createdBy
        isVerified: true, // Admin-created faculty can be auto-verified
      })
      .returning()

    // Create auth entry
    await db.insert(auth).values({
      id: nanoid(),
      email: schoolEmail,
      password: hashedPassword,
      userType: "faculty",
      userId: id,
    })

    return {
      success: true,
      faculty: {
        id: newFaculty.id,
        facultyName: newFaculty.facultyName,
        schoolEmail: schoolEmail, // Use email from request
        mobileNumber: newFaculty.mobileNumber,
        schoolId: newFaculty.schoolId,
        isVerified: newFaculty.isVerified,
      },
      message: "Faculty created successfully",
    }
  } catch (error: any) {
    console.error("Error creating faculty:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to create faculty",
    })
  }
})

