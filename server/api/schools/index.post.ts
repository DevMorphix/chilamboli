import { useDB } from "../../utils/db"
import { schools } from "../../database/schema"
import { nanoid } from "nanoid"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const body = await readBody(event)

  const { schoolCode, name, location } = body

  if (!schoolCode || !name) {
    throw createError({
      statusCode: 400,
      message: "Missing required fields: schoolCode and name",
    })
  }

  try {
    const id = body.id || nanoid()

    const [newSchool] = await db
      .insert(schools)
      .values({
        id,
        schoolCode,
        name,
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

    // Handle unique constraint violations
    if (error.message?.includes("UNIQUE constraint failed")) {
      if (error.message.includes("school_code")) {
        throw createError({
          statusCode: 409,
          message: "School code already exists",
        })
      }
      if (error.message.includes("name")) {
        throw createError({
          statusCode: 409,
          message: "School name already exists",
        })
      }
    }

    throw createError({
      statusCode: 500,
      message: "Failed to create school",
    })
  }
})
