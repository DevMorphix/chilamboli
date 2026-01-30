import { useDB } from "../../utils/db"
import { auth } from "../../database/schema"
import { eq, and } from "drizzle-orm"
import { nanoid } from "nanoid"
import bcrypt from "bcryptjs"

// Create a new volunteer account (similar to admin - no separate table)
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const body = await readBody(event)

  const { email, password } = body

  // Validation
  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: "Email and password are required",
    })
  }

  // Validate email format
  if (!email.includes("@") || !email.includes(".")) {
    throw createError({
      statusCode: 400,
      message: "Invalid email format",
    })
  }

  // Validate password strength (minimum 6 characters)
  if (password.length < 6) {
    throw createError({
      statusCode: 400,
      message: "Password must be at least 6 characters long",
    })
  }

  try {
    // Check if auth entry with email already exists for volunteer
    const [existingAuth] = await db
      .select()
      .from(auth)
      .where(
        and(
          eq(auth.email, email),
          eq(auth.userType, "volunteer")
        )
      )
      .limit(1)

    if (existingAuth) {
      throw createError({
        statusCode: 409,
        message: "Volunteer account with this email already exists",
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate userId (since there's no volunteer table, use nanoid)
    const userId = nanoid()

    // Create auth entry for volunteer
    const authId = nanoid()
    await db.insert(auth).values({
      id: authId,
      email: email,
      password: hashedPassword,
      userType: "volunteer",
      userId: userId,
    })

    return {
      success: true,
      volunteer: {
        email: email,
        userId: userId,
      },
      message: "Volunteer account created successfully",
    }
  } catch (error: any) {
    console.error("Error creating volunteer:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to create volunteer account",
    })
  }
})
