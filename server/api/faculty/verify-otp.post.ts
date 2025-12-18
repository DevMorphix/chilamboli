import { useDB } from "../../utils/db"
import { faculty } from "../../database/schema"
import { verifyOtp, deleteOtp } from "../../utils/kv"
import { eq } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const body = await readBody(event)

  const { facultyId, otp } = body

  if (!facultyId || !otp) {
    throw createError({
      statusCode: 400,
      message: "Faculty ID and OTP are required",
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

    // Verify OTP from KV Store
    const result = await verifyOtp(facultyId, otp)

    if (!result.valid) {
      throw createError({
        statusCode: 400,
        message: result.message,
      })
    }

    // Verify faculty and delete OTP from KV Store
    await db
      .update(faculty)
      .set({ isVerified: true })
      .where(eq(faculty.id, facultyId))

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
