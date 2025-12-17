import { connectDB } from "../../utils/db"
import { Faculty } from "../../database/models"
import { storeOtp, generateOtp } from "../../utils/kv"

export default defineEventHandler(async (event) => {
  await connectDB(event)
  const body = await readBody(event)

  const { facultyId } = body

  if (!facultyId) {
    throw createError({
      statusCode: 400,
      message: "Faculty ID is required",
    })
  }

  try {
    const faculty = await Faculty.findOne({ id: facultyId })

    if (!faculty) {
      throw createError({
        statusCode: 404,
        message: "Faculty not found",
      })
    }

    if (faculty.isVerified) {
      throw createError({
        statusCode: 400,
        message: "Faculty already verified",
      })
    }

    // Generate and store new OTP in KV Store
    const otp = generateOtp()
    await storeOtp(facultyId, otp)

    // TODO: In production, send OTP via email
    console.log(`New OTP for ${faculty.schoolEmail}: ${otp}`)

    return {
      success: true,
      message: "New OTP sent to your email",
      // Remove this in production
      developmentOtp: otp,
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
