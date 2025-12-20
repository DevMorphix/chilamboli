// Simple admin authentication - in production, use proper admin table and JWT
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { email, password } = body

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: "Email and password are required",
    })
  }

  // Simple admin check - replace with proper admin table in production
  const adminEmail = process.env.ADMIN_EMAIL || "admin@chilamboli.com"
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123"

  if (email === adminEmail && password === adminPassword) {
    return {
      success: true,
      message: "Login successful",
      admin: {
        email: adminEmail,
        role: "admin",
      },
    }
  }

  throw createError({
    statusCode: 401,
    message: "Invalid email or password",
  })
})

