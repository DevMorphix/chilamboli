import { useDB } from "../../utils/db"
import { judges, auth } from "../../database/schema"
import { eq, and } from "drizzle-orm"
import { nanoid } from "nanoid"
import bcrypt from "bcryptjs"

// Create a new judge with authentication credentials
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const body = await readBody(event)

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
    // Check if judge with mobile number already exists
    const [existingJudge] = await db
      .select()
      .from(judges)
      .where(eq(judges.mobileNumber, mobileNumber))
      .limit(1)

    if (existingJudge) {
      throw createError({
        statusCode: 409,
        message: "Mobile number already registered",
      })
    }

    // Check if auth entry with mobile number already exists
    const [existingAuth] = await db
      .select()
      .from(auth)
      .where(
        and(
          eq(auth.mobileNumber, mobileNumber),
          eq(auth.userType, "judge")
        )
      )
      .limit(1)

    if (existingAuth) {
      throw createError({
        statusCode: 409,
        message: "Mobile number already registered",
      })
    }

    // Generate PIN from last 4 digits of mobile number
    const pin = mobileNumber.slice(-4)
    const hashedPin = await bcrypt.hash(pin, 10)

    // Create judge
    const judgeId = nanoid()
    const [newJudge] = await db
      .insert(judges)
      .values({
        id: judgeId,
        judgeName,
        mobileNumber,
      })
      .returning()

    // Create auth entry
    await db.insert(auth).values({
      id: nanoid(),
      mobileNumber: mobileNumber,
      password: hashedPin,
      userType: "judge",
      userId: judgeId,
    })

    return {
      success: true,
      judge: {
        id: newJudge.id,
        judgeName: newJudge.judgeName,
        mobileNumber: newJudge.mobileNumber,
      },
      message: "Judge created successfully. PIN is the last 4 digits of mobile number.",
    }
  } catch (error: any) {
    console.error("Error creating judge:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to create judge",
    })
  }
})
