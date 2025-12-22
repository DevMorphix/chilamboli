import { useDB } from "../../utils/db"
import { auth } from "../../database/schema"
import { eq, and } from "drizzle-orm"
import bcrypt from "bcryptjs"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const body = await readBody(event)

  const { email, password } = body

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: "Email and password are required",
    })
  }

  try {
    // Find admin auth entry
    const [adminAuth] = await db
      .select()
      .from(auth)
      .where(
        and(
          eq(auth.email, email),
          eq(auth.userType, "admin")
        )
      )
      .limit(1)

    if (!adminAuth) {
      throw createError({
        statusCode: 401,
        message: "Invalid email or password",
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, adminAuth.password)

    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        message: "Invalid email or password",
      })
    }

    return {
      success: true,
      message: "Login successful",
      admin: {
        email: adminAuth.email,
        role: "admin",
      },
    }
  } catch (error: any) {
    console.error("Error logging in admin:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to login",
    })
  }
})

