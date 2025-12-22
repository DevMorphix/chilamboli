import { useDB } from "../../utils/db"
import { faculty, schools } from "../../database/schema"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const body = await readBody(event)

  const { schoolId, facultyName, mobileNumber, createdByFacultyId } = body

  if (!schoolId || !facultyName || !mobileNumber || !createdByFacultyId) {
    throw createError({
      statusCode: 400,
      message: "School ID, faculty name, mobile number, and creator faculty ID are required",
    })
  }

  try {
    // Verify the creator faculty exists and is from the same school
    const [validation] = await db
      .select({
        creatorSchoolId: faculty.schoolId,
      })
      .from(faculty)
      .where(eq(faculty.id, createdByFacultyId))
      .limit(1)

    if (!validation) {
      throw createError({
        statusCode: 404,
        message: "Creator faculty not found",
      })
    }

    if (validation.creatorSchoolId !== schoolId) {
      throw createError({
        statusCode: 403,
        message: "Cannot create faculty for a different school",
      })
    }

    // Check if school exists
    const [school] = await db
      .select({ id: schools.id })
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1)

    if (!school) {
      throw createError({
        statusCode: 404,
        message: "School not found",
      })
    }

    // Create faculty record only (no auth)
    const id = nanoid()
    const [newFaculty] = await db
      .insert(faculty)
      .values({
        id,
        schoolId,
        facultyName,
        mobileNumber,
        createdBy: createdByFacultyId,
        isVerified: false,
      })
      .returning()

    return {
      success: true,
      faculty: {
        id: newFaculty.id,
        facultyName: newFaculty.facultyName,
        mobileNumber: newFaculty.mobileNumber,
        schoolId: newFaculty.schoolId,
        isVerified: newFaculty.isVerified,
        createdAt: newFaculty.createdAt,
      },
      message: "Faculty added successfully",
    }
  } catch (error: any) {
    console.error("Error creating faculty:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to create faculty",
    })
  }
})

