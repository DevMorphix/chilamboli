import { useDB } from "../../utils/db"
import { auth } from "../../database/schema"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
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

  // Validate email format
  if (!email.includes("@") || !email.includes(".")) {
    throw createError({
      statusCode: 400,
      message: "Invalid email format",
    })
  }

  try {
    // Check if admin with email already exists
    const [existingAuth] = await db
      .select()
      .from(auth)
      .where(eq(auth.email, email))
      .limit(1)

    if (existingAuth) {
      throw createError({
        statusCode: 409,
        message: "Admin with this email already exists",
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create admin auth entry
    const adminId = nanoid()
    await db.insert(auth).values({
      id: nanoid(),
      email: email,
      password: hashedPassword,
      userType: "admin",
      userId: adminId,
    })

    return {
      success: true,
      message: "Admin created successfully",
      admin: {
        id: adminId,
        email: email,
      },
    }
  } catch (error: any) {
    console.error("Error creating admin:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to create admin",
    })
  }
})

