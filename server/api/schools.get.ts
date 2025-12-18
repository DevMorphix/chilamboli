import { useDB } from "../utils/db"
import { schools } from "../database/schema"

export default defineEventHandler(async (event) => {
  const db = useDB(event)

  try {
    const allSchools = await db.select().from(schools)
    return allSchools
  } catch (error) {
    console.error("Error fetching schools:", error)
    throw createError({
      statusCode: 500,
      message: "Failed to fetch schools",
    })
  }
})
