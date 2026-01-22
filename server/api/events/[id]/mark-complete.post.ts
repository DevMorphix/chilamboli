import { useDB } from "../../../utils/db"
import { events, registrations, judgments, positionRewards } from "../../../database/schema"
import { eq, sql } from "drizzle-orm"
import { nanoid } from "nanoid"

// Position reward points mapping
const POSITION_REWARDS: Record<number, number> = {
  1: 10, // 1st position: 10 points
  2: 5,  // 2nd position: 5 points
  3: 3,  // 3rd position: 3 points
}

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const eventId = getRouterParam(event, "id")
  const body = await readBody(event).catch(() => ({}))
  const isCompleted = body.isCompleted !== undefined ? Boolean(body.isCompleted) : true

  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: "Event ID is required",
    })
  }

  try {
    // Check if event exists
    const [existingEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!existingEvent) {
      throw createError({
        statusCode: 404,
        message: "Event not found",
      })
    }

    // If publishing results, calculate and store position rewards
    if (isCompleted && !existingEvent.isCompleted) {
      // Get all registrations for this event with scores, sorted by total score
      const results = await db
        .select({
          registrationId: registrations.id,
          totalScore: sql<number>`COALESCE(SUM(${judgments.score}), 0)`.as("total_score"),
        })
        .from(registrations)
        .innerJoin(judgments, eq(registrations.id, judgments.registrationId))
        .where(eq(registrations.eventId, eventId))
        .groupBy(registrations.id)
        .having(sql`COALESCE(SUM(${judgments.score}), 0) > 0`)
        .orderBy(sql`COALESCE(SUM(${judgments.score}), 0) DESC`)

      // Calculate rankings and assign rewards to top 3
      const rankedResults = results.map((result, index) => ({
        ...result,
        rank: index + 1,
      }))

      // Get top 3 positions
      const topThree = rankedResults.slice(0, 3)

      // Remove any existing position rewards for this event (in case of republishing)
      await db
        .delete(positionRewards)
        .where(eq(positionRewards.eventId, eventId))

      // Insert new position rewards for top 3
      if (topThree.length > 0) {
        const rewardsToInsert = topThree
          .filter((result) => result.rank <= 3 && POSITION_REWARDS[result.rank])
          .map((result) => ({
            id: nanoid(),
            registrationId: result.registrationId,
            eventId: eventId,
            position: result.rank,
            rewardPoints: POSITION_REWARDS[result.rank],
          }))

        if (rewardsToInsert.length > 0) {
          await db.insert(positionRewards).values(rewardsToInsert)
        }
      }
    } else if (!isCompleted && existingEvent.isCompleted) {
      // If unpublishing results, remove position rewards for this event
      await db
        .delete(positionRewards)
        .where(eq(positionRewards.eventId, eventId))
    }

    // Toggle event completion status
    const [updatedEvent] = await db
      .update(events)
      .set({ isCompleted })
      .where(eq(events.id, eventId))
      .returning()

    return {
      success: true,
      message: isCompleted 
        ? "Event results published successfully" 
        : "Event results unpublished successfully",
      event: updatedEvent,
    }
  } catch (error: any) {
    console.error("Error toggling event completion:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: "Failed to toggle event completion status",
    })
  }
})
