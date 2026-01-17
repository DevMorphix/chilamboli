import { useDB } from "../../utils/db"
import { faculty, schools, auth, notifications, notificationRecipients } from "../../database/schema"
import { storeOtp, generateOtp } from "../../utils/kv"
import { sendOtpEmail } from "../../utils/email"
import { eq, isNull, and } from "drizzle-orm"
import { nanoid } from "nanoid"
import bcrypt from "bcryptjs"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  
  // Check if registration is open
  if (!config.public.registrationOpen) {
    throw createError({
      statusCode: 403,
      message: "Registration is currently closed",
    })
  }

  const db = useDB(event)
  const body = await readBody(event)

  const { schoolId, facultyName, mobileNumber, schoolEmail, password, createdBy } = body

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

    // Validate createdBy if provided (must be a faculty from the same school)
    if (createdBy) {
      const [creatorFaculty] = await db
        .select()
        .from(faculty)
        .where(eq(faculty.id, createdBy))
        .limit(1)

      if (!creatorFaculty) {
        throw createError({
          statusCode: 404,
          message: "Creator faculty not found",
        })
      }

      if (creatorFaculty.schoolId !== schoolId) {
        throw createError({
          statusCode: 403,
          message: "Cannot create faculty for a different school",
        })
      }
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
        createdBy: createdBy || null,
        isVerified: false,
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

    // When a new faculty is created, ensure recipients exist for common notifications for this school
    const commonNotifications = await db
      .select()
      .from(notifications)
      .where(isNull(notifications.schoolId))

    for (const notification of commonNotifications) {
      const [existingRecipient] = await db
        .select()
        .from(notificationRecipients)
        .where(
          and(
            eq(notificationRecipients.notificationId, notification.id),
            eq(notificationRecipients.schoolId, schoolId)
          )
        )
        .limit(1)

      if (!existingRecipient) {
        await db.insert(notificationRecipients).values({
          id: nanoid(),
          notificationId: notification.id,
          schoolId: schoolId,
          isRead: false,
        })
      }
    }

    // Generate and store OTP in KV Store
    const otp = generateOtp()
    await storeOtp(newFaculty.id, otp)

    // Send OTP via email
    const config = useRuntimeConfig(event)
    try {
      await sendOtpEmail(schoolEmail, otp, {
        resendApiKey: config.resendApiKey,
      })
    } catch (error: any) {
      console.error("Failed to send OTP email:", error)
      // Still return success, but log the error
      // The OTP is stored and can be resent if needed
    }

    return {
      success: true,
      message: "Registration successful. Please verify your email with the OTP sent.",
      facultyId: newFaculty.id,
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
