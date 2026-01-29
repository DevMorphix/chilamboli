import { useDB } from "../../utils/db"
import { students } from "../../database/schema"
import { nanoid } from "nanoid"

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
  const config = useRuntimeConfig(event)
  
  // Check if registration is open
  // if (!config.public.registrationOpen) {
  //   throw createError({
  //     statusCode: 403,
  //     message: "Registration is currently closed",
  //   })
  // }

  const db = useDB(event)
  const body = await readBody(event)

  const {
    studentName,
    dateOfBirth,
    gender,
    photoUrl,
    disabilityCertificateUrl,
    birthCertificateUrl,
    schoolId,
    addedByFacultyId,
  } = body

  if (!studentName || !dateOfBirth || !gender || !schoolId || !addedByFacultyId) {
    throw createError({
      statusCode: 400,
      message: "Missing required fields: studentName, dateOfBirth, gender, schoolId, addedByFacultyId",
    })
  }

  try {
    const ageCategory = calculateAgeCategory(dateOfBirth)
    const id = body.id || nanoid()
    const studentId = `STU-${nanoid(10)}`.toUpperCase()

    const [newStudent] = await db
      .insert(students)
      .values({
        id,
        studentId,
        studentName,
        dateOfBirth,
        ageCategory,
        gender,
        photoUrl,
        disabilityCertificateUrl,
        birthCertificateUrl,
        schoolId,
        addedByFacultyId,
      })
      .returning()

    return {
      success: true,
      student: newStudent,
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
