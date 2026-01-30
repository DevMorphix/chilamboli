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
    const [volunteerAuth] = await db
      .select({ 
        email: auth.email, 
        password: auth.password,
        userId: auth.userId 
      })
      .from(auth)
      .where(and(eq(auth.email, email), eq(auth.userType, "volunteer")))
      .limit(1)

    if (!volunteerAuth) {
      throw createError({
        statusCode: 401,
        message: "Invalid email or password",
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, volunteerAuth.password)

    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        message: "Invalid email or password",
      })
    }

    return {
      success: true,
      message: "Login successful",
      volunteer: {
        email: volunteerAuth.email,
        userId: volunteerAuth.userId,
        role: "volunteer",
      },
    }
  } catch (error: any) {
    console.error("Error logging in volunteer:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to login",
    })
  }
})
