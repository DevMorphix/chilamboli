const CACHE_KEY = "admin:analytics"

export default defineEventHandler(async (event) => {
  try {
    const storage = useStorage("kv")
    await storage.removeItem(CACHE_KEY)
    
    return {
      success: true,
      message: "Analytics cache purged successfully",
    }
  } catch (error: any) {
    console.error("Error purging analytics cache:", error)
    throw createError({
      statusCode: 500,
      message: `Failed to purge cache: ${error.message || 'Unknown error'}`,
    })
  }
})

