import { useDB } from "../../utils/db"
import { registrations, faculty } from "../../database/schema"
import { eq } from "drizzle-orm"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const id = event.context.params?.id
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Registration ID is required",
    })
  }

  const { facultyId } = body

  if (!facultyId) {
    throw createError({
      statusCode: 400,
      message: "Faculty ID is required",
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

    // Verify faculty exists and belongs to the same school
    const [facultyMember] = await db
      .select()
      .from(faculty)
      .where(eq(faculty.id, facultyId))
      .limit(1)

    if (!facultyMember) {
      throw createError({
        statusCode: 404,
        message: "Faculty member not found",
      })
    }

    if (facultyMember.schoolId !== registration.schoolId) {
      throw createError({
        statusCode: 403,
        message: "You can only delete registrations from your own school",
      })
    }

    // Delete the registration (cascade will delete participants due to onDelete: "cascade" in schema)
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

