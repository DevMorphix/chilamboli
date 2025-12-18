import { useDB } from "../../utils/db"
import { students } from "../../database/schema"
import { eq } from "drizzle-orm"

function calculateAgeCategory(dateOfBirth: string): "Sub Junior" | "Junior" | "Senior" {
  const dob = new Date(dateOfBirth)

  const subJuniorCutoff = new Date("2014-01-01")
  if (dob >= subJuniorCutoff) {
    return "Sub Junior"
  }

  const seniorCutoff = new Date("2005-12-31")
  if (dob <= seniorCutoff) {
    return "Senior"
  }

  return "Junior"
}

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const body = await readBody(event)

  const {
    studentId,
    studentName,
    dateOfBirth,
    class: studentClass,
    rollNumber,
    photoUrl,
    disabilityCertificateUrl,
  } = body

  if (!studentId) {
    throw createError({
      statusCode: 400,
      message: "Student ID is required",
    })
  }

  try {
    // Check if student exists
    const [existingStudent] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1)

    if (!existingStudent) {
      throw createError({
        statusCode: 404,
        message: "Student not found",
      })
    }

    // Build update object
    const updateData: Partial<typeof students.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (studentName) updateData.studentName = studentName
    if (dateOfBirth) {
      updateData.dateOfBirth = dateOfBirth
      updateData.ageCategory = calculateAgeCategory(dateOfBirth)
    }
    if (studentClass) updateData.class = studentClass
    if (rollNumber) updateData.rollNumber = rollNumber
    if (photoUrl) updateData.photoUrl = photoUrl
    if (disabilityCertificateUrl) updateData.disabilityCertificateUrl = disabilityCertificateUrl

    const [updatedStudent] = await db
      .update(students)
      .set(updateData)
      .where(eq(students.id, studentId))
      .returning()

    return {
      success: true,
      student: updatedStudent,
      message: "Student updated successfully",
    }
  } catch (error: any) {
    console.error("Error updating student:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to update student",
    })
  }
})
