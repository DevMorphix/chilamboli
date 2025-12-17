import { connectDB } from "../../utils/db"
import { Student } from "../../database/models"

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
  await connectDB(event)
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
    const student = await Student.findOne({ id: studentId })

    if (!student) {
      throw createError({
        statusCode: 404,
        message: "Student not found",
      })
    }

    // Update allowed fields
    if (studentName) student.studentName = studentName
    if (dateOfBirth) {
      student.dateOfBirth = dateOfBirth
      // Recalculate age category if DOB changes
      student.ageCategory = calculateAgeCategory(dateOfBirth)
    }
    if (studentClass) student.class = studentClass
    if (rollNumber) student.rollNumber = rollNumber
    if (photoUrl) student.photoUrl = photoUrl
    if (disabilityCertificateUrl) student.disabilityCertificateUrl = disabilityCertificateUrl

    await student.save()

    return {
      success: true,
      student: student.toObject(),
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
