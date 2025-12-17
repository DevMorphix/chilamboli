import mongoose from "mongoose"

let isConnected = false

export const connectDB = async () => {
  if (isConnected) return

  const config = useRuntimeConfig()
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
 * @returns The result of the callback function
 */
export const withTransaction = async <T>(
  callback: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> => {
  await connectDB()
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
