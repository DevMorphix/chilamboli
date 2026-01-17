import { useDB } from "../../utils/db"
import { judges, auth } from "../../database/schema"
import { eq, and } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { nanoid } from "nanoid"

// Update a judge
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const judgeId = getRouterParam(event, "id")
  const body = await readBody(event)

  if (!judgeId) {
    throw createError({
      statusCode: 400,
      message: "Judge ID is required",
    })
  }

  const { judgeName, mobileNumber } = body

  // Validation
  if (!judgeName || !mobileNumber) {
    throw createError({
      statusCode: 400,
      message: "Judge name and mobile number are required",
    })
  }

  // Validate mobile number format (should be 10 digits)
  if (!/^\d{10}$/.test(mobileNumber)) {
    throw createError({
      statusCode: 400,
      message: "Mobile number must be 10 digits",
    })
  }

  try {
    // Check if judge exists
    const [existingJudge] = await db
      .select()
      .from(judges)
      .where(eq(judges.id, judgeId))
      .limit(1)

    if (!existingJudge) {
      throw createError({
        statusCode: 404,
        message: "Judge not found",
      })
    }

    // If mobile number is being changed, check for conflicts
    if (existingJudge.mobileNumber !== mobileNumber) {
      // Check if another judge with this mobile number exists
      const [conflictingJudge] = await db
        .select()
        .from(judges)
        .where(eq(judges.mobileNumber, mobileNumber))
        .limit(1)

      if (conflictingJudge) {
        throw createError({
          statusCode: 409,
          message: "Mobile number already registered to another judge",
        })
      }

      // Check if auth entry with this mobile number exists for another user
      const [conflictingAuth] = await db
        .select()
        .from(auth)
        .where(
          and(
            eq(auth.mobileNumber, mobileNumber),
            eq(auth.userType, "judge")
          )
        )
        .limit(1)

      if (conflictingAuth && conflictingAuth.userId !== judgeId) {
        throw createError({
          statusCode: 409,
          message: "Mobile number already registered",
        })
      }

      // Update auth entry with new mobile number and regenerate PIN
      const pin = mobileNumber.slice(-4)
      const hashedPin = await bcrypt.hash(pin, 10)

      // Update or create auth entry
      const [existingAuth] = await db
        .select()
        .from(auth)
        .where(
          and(
            eq(auth.userType, "judge"),
            eq(auth.userId, judgeId)
          )
        )
        .limit(1)

      if (existingAuth) {
        await db
          .update(auth)
          .set({
            mobileNumber: mobileNumber,
            password: hashedPin,
          })
          .where(eq(auth.id, existingAuth.id))
      } else {
        // Create auth entry if it doesn't exist (shouldn't happen, but handle it)
        await db.insert(auth).values({
          id: nanoid(),
          mobileNumber: mobileNumber,
          password: hashedPin,
          userType: "judge",
          userId: judgeId,
        })
      }
    }

    // Update judge
    const [updatedJudge] = await db
      .update(judges)
      .set({
        judgeName,
        mobileNumber,
      })
      .where(eq(judges.id, judgeId))
      .returning()

    return {
      success: true,
      judge: {
        id: updatedJudge.id,
        judgeName: updatedJudge.judgeName,
        mobileNumber: updatedJudge.mobileNumber,
      },
      message: existingJudge.mobileNumber !== mobileNumber
        ? "Judge updated successfully. PIN has been updated to the last 4 digits of the new mobile number."
        : "Judge updated successfully",
    }
  } catch (error: any) {
    console.error("Error updating judge:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to update judge",
    })
  }
})
