import { withTransaction } from "../../utils/db"
import { Student } from "../../database/models"

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { firstName, lastName, email, phone, dateOfBirth, schoolId } = body

  if (!firstName || !lastName || !dateOfBirth || !schoolId) {
    throw createError({
      statusCode: 400,
      message: "Missing required fields",
    })
  }

  try {
    const student = await withTransaction(async (session) => {
      const [newStudent] = await Student.create(
        [
          {
            firstName,
            lastName,
            email: email || null,
            phone: phone || null,
            dateOfBirth,
            schoolId,
          },
        ],
        { session }
      )
      return newStudent
    })

    return student.toObject()
  } catch (error) {
    console.error("Error creating student:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to create student",
    })
  }
})
