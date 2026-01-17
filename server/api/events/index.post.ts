import { useDB } from "../../utils/db"
import { events } from "../../database/schema"
import { nanoid } from "nanoid"

// TODO: Add proper admin authentication middleware
export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const body = await readBody(event)

  const { name, description, eventType, ageCategory, gender, maxTeamSize } = body

  // Validation
  if (!name || !eventType || !ageCategory) {
    throw createError({
      statusCode: 400,
      message: "Event name, event type, and age category are required",
    })
  }

  // Validate eventType enum
  const validEventTypes = ["Individual", "Group", "Combined"]
  if (!validEventTypes.includes(eventType)) {
    throw createError({
      statusCode: 400,
      message: `Event type must be one of: ${validEventTypes.join(", ")}`,
    })
  }

  // Validate ageCategory enum
  const validAgeCategories = ["Sub Junior", "Junior", "Senior", "Combined", "Special"]
  if (!validAgeCategories.includes(ageCategory)) {
    throw createError({
      statusCode: 400,
      message: `Age category must be one of: ${validAgeCategories.join(", ")}`,
    })
  }

  // Validate gender enum if provided
  if (gender) {
    const validGenders = ["Boys", "Girls", "All"]
    if (!validGenders.includes(gender)) {
      throw createError({
        statusCode: 400,
        message: `Gender must be one of: ${validGenders.join(", ")}`,
      })
    }
  }

  // Validate maxTeamSize if provided
  if (maxTeamSize !== undefined && maxTeamSize !== null) {
    if (typeof maxTeamSize !== "number" || maxTeamSize < 1) {
      throw createError({
        statusCode: 400,
        message: "Max team size must be a positive number",
      })
    }
  }

  try {
    // Create new event
    const id = nanoid()
    const [newEvent] = await db
      .insert(events)
      .values({
        id,
        name,
        description: description || null,
        eventType,
        ageCategory,
        gender: gender || null,
        maxTeamSize: maxTeamSize || null,
      })
      .returning()

    return {
      success: true,
      event: newEvent,
      message: "Event created successfully",
    }
  } catch (error: any) {
    console.error("Error creating event:", error)

    // Check for unique constraint violations (if name should be unique)
    if (error.message && error.message.includes("UNIQUE constraint")) {
      throw createError({
        statusCode: 409,
        message: "An event with this name already exists",
      })
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to create event",
    })
  }
})
