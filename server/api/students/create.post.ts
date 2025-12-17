import { withTransaction } from "../../utils/db"
import { Student } from "../../database/models"

function calculateAgeCategory(dateOfBirth: string): "Sub Junior" | "Junior" | "Senior" {
  const dob = new Date(dateOfBirth)

  // Sub Junior: Below 12 years (on or after 01 Jan 2014)
  const subJuniorCutoff = new Date("2014-01-01")
  if (dob >= subJuniorCutoff) {
    return "Sub Junior"
  }

  // Senior: Above 21 years (before 31 Dec 2005)
  const seniorCutoff = new Date("2005-12-31")
  if (dob <= seniorCutoff) {
    return "Senior"
  }

  // Junior: 12-21 years (Between 31 Dec 2013 – 01 Jan 2006)
  return "Junior"
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const {
    studentName,
    dateOfBirth,
    class: studentClass,
    rollNumber,
    photoUrl,
    disabilityCertificateUrl,
    schoolId,
    addedByFacultyId,
  } = body

  if (!studentName || !dateOfBirth || !studentClass || !rollNumber || !schoolId || !addedByFacultyId) {
    throw createError({
      statusCode: 400,
      message: "Missing required fields: studentName, dateOfBirth, class, rollNumber, schoolId, addedByFacultyId",
    })
  }

  if (!photoUrl) {
    throw createError({
      statusCode: 400,
      message: "Student photo is required",
    })
  }

  if (!disabilityCertificateUrl) {
    throw createError({
      statusCode: 400,
      message: "Disability certificate is required",
    })
  }

  try {
    const student = await withTransaction(async (session) => {
      const ageCategory = calculateAgeCategory(dateOfBirth)

      const [newStudent] = await Student.create(
        [
          {
            studentName,
            dateOfBirth,
            ageCategory,
            class: studentClass,
            rollNumber,
            photoUrl,
            disabilityCertificateUrl,
            schoolId,
            addedByFacultyId,
          },
        ],
        { session },
      )
      return newStudent
    }, event)

    return {
      success: true,
      student: student.toObject(),
      message: "Student created successfully",
    }
  } catch (error) {
    console.error("Error creating student:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to create student",
    })
  }
})
