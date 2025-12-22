import { useDB } from "../../utils/db"
import { faculty, auth } from "../../database/schema"
import { storeOtp, generateOtp } from "../../utils/kv"
import { sendOtpEmail } from "../../utils/email"
import { eq, and } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const body = await readBody(event)

  const { facultyId } = body

  if (!facultyId) {
    throw createError({
      statusCode: 400,
      message: "Faculty ID is required",
    })
  }

  try {
    const [facultyMember] = await db
      .select()
      .from(faculty)
      .where(eq(faculty.id, facultyId))
      .limit(1)

    if (!facultyMember) {
      throw createError({
        statusCode: 404,
        message: "Faculty not found",
      })
    }

    if (facultyMember.isVerified) {
      throw createError({
        statusCode: 400,
        message: "Faculty already verified",
      })
    }

    // Get email from auth table
    const [authEntry] = await db
      .select()
      .from(auth)
      .where(
        and(
          eq(auth.userId, facultyId),
          eq(auth.userType, "faculty")
        )
      )
      .limit(1)

    if (!authEntry) {
      throw createError({
        statusCode: 404,
        message: "Auth entry not found for faculty",
      })
    }

    // Generate and store new OTP in KV Store
    const otp = generateOtp()
    await storeOtp(facultyId, otp)

    // Send OTP via email
    const config = useRuntimeConfig(event)
    try {
      await sendOtpEmail(authEntry.email, otp, {
        resendApiKey: config.resendApiKey,
      })
    } catch (error: any) {
      console.error("Failed to send OTP email:", error)
      throw createError({
        statusCode: 500,
        message: "Failed to send OTP email. Please try again later.",
      })
    }

    return {
      success: true,
      message: "New OTP sent to your email",
    }
  } catch (error: any) {
    console.error("Error resending OTP:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to resend OTP",
    })
  }
})
