import { useDB } from "../../utils/db"
import { schools } from "../../database/schema"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"

// TODO: Add proper admin authentication middleware
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const body = await readBody(event)

  const { name, schoolCode, location } = body

  // Validation
  if (!name || !schoolCode) {
    throw createError({
      statusCode: 400,
      message: "School name and school code are required",
    })
  }

  try {
    // Check if school with same name already exists
    const [existingByName] = await db
      .select()
      .from(schools)
      .where(eq(schools.name, name))
      .limit(1)

    if (existingByName) {
      throw createError({
        statusCode: 409,
        message: "School with this name already exists",
      })
    }

    // Check if school with same code already exists
    const [existingByCode] = await db
      .select()
      .from(schools)
      .where(eq(schools.schoolCode, schoolCode))
      .limit(1)

    if (existingByCode) {
      throw createError({
        statusCode: 409,
        message: "School with this code already exists",
      })
    }

    // Create new school
    const id = nanoid()
    const [newSchool] = await db
      .insert(schools)
      .values({
        id,
        name,
        schoolCode,
        location: location || null,
      })
      .returning()

    return {
      success: true,
      school: newSchool,
      message: "School created successfully",
    }
  } catch (error: any) {
    console.error("Error creating school:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to create school",
    })
  }
})
