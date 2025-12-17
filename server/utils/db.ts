import mongoose from "mongoose"
import type { H3Event } from "h3"

let isConnected = false

export const connectDB = async (event?: H3Event) => {
  if (isConnected) return

  const config = useRuntimeConfig(event)
  const uri = config.mongodbUri;

  try {
    await mongoose.connect(uri)
    isConnected = true
    console.log("MongoDB connected")
  } catch (error) {
    console.error("MongoDB connection error:", error)
    throw error
  }
}

/**
 * Execute operations within a MongoDB transaction.
 * If any operation fails, all changes are rolled back.
 * @param callback - Async function that receives the session and performs DB operations
 * @param event - Optional H3 event for runtime config access
 * @returns The result of the callback function
 */
export const withTransaction = async <T>(
  callback: (session: mongoose.ClientSession) => Promise<T>,
  event?: H3Event
): Promise<T> => {
  await connectDB(event)
  const session = await mongoose.startSession()

  try {
    session.startTransaction()
    const result = await callback(session)
    await session.commitTransaction()
    return result
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}
