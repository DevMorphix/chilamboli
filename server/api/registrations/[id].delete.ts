import { useDB } from "../../utils/db"
import { registrations, faculty } from "../../database/schema"
import { eq } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const id = event.context.params?.id

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Registration ID is required",
    })
  }

  try {
    // Fetch the registration
    const [registration] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, id))
      .limit(1)

    if (!registration) {
      throw createError({
        statusCode: 404,
        message: "Registration not found",
      })
    }

    // Delete the registration
    await db
      .delete(registrations)
      .where(eq(registrations.id, id))

    return {
      success: true,
      message: "Registration deleted successfully",
    }
  } catch (error: any) {
    console.error("Error deleting registration:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to delete registration",
    })
  }
})

