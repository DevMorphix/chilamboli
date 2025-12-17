import { connectDB } from "../../utils/db"
import { Faculty } from "../../database/models"
import { verifyOtp, deleteOtp } from "../../utils/kv"

export default defineEventHandler(async (event) => {
  await connectDB(event)
  const body = await readBody(event)

  const { facultyId, otp } = body

  if (!facultyId || !otp) {
    throw createError({
      statusCode: 400,
      message: "Faculty ID and OTP are required",
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

    // Verify OTP from KV Store
    const result = await verifyOtp(facultyId, otp)

    if (!result.valid) {
      throw createError({
        statusCode: 400,
        message: result.message,
      })
    }

    // Verify faculty and delete OTP from KV Store
    faculty.isVerified = true
    await faculty.save()
    await deleteOtp(facultyId)

    return {
      success: true,
      message: "Email verified successfully. You can now login.",
    }
  } catch (error: any) {
    console.error("Error verifying OTP:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to verify OTP",
    })
  }
})
