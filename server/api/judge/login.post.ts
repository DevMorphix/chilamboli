import { useDB } from "../../utils/db"
import { auth, judges } from "../../database/schema"
import { eq, and } from "drizzle-orm"
import bcrypt from "bcryptjs"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const body = await readBody(event)

  const { mobileNumber, pin } = body

  if (!mobileNumber || !pin) {
    throw createError({
      statusCode: 400,
      message: "Mobile number and PIN are required",
    })
  }

  try {
    // Find judge auth entry
    const [judgeAuth] = await db
      .select()
      .from(auth)
      .where(
        and(
          eq(auth.mobileNumber, mobileNumber),
          eq(auth.userType, "judge")
        )
      )
      .limit(1)

    if (!judgeAuth) {
      throw createError({
        statusCode: 401,
        message: "Invalid mobile number or PIN",
      })
    }

    // Verify PIN
    const isPinValid = await bcrypt.compare(pin, judgeAuth.password)

    if (!isPinValid) {
      throw createError({
        statusCode: 401,
        message: "Invalid mobile number or PIN",
      })
    }

    // Get judge details
    const [judge] = await db
      .select()
      .from(judges)
      .where(eq(judges.id, judgeAuth.userId))
      .limit(1)

    if (!judge) {
      throw createError({
        statusCode: 404,
        message: "Judge not found",
      })
    }

    return {
      success: true,
      message: "Login successful",
      judge: {
        id: judge.id,
        judgeName: judge.judgeName,
        mobileNumber: judge.mobileNumber,
      },
    }
  } catch (error: any) {
    console.error("Error logging in judge:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to login",
    })
  }
})
