const CACHE_PREFIX = "leaderboard:"

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const context = body.context as string | undefined // "presentation", "admin", or undefined (all)

  try {
    const storage = useStorage("kv")
    let purgedCount = 0

    if (context) {
      // Purge cache for specific context only
      const contextPrefix = `${CACHE_PREFIX}${context}:`
      const eventsPrefix = `${CACHE_PREFIX}events:${context}:`
      
      try {
        // Purge all keys matching the context prefix (for event, school, district leaderboards)
        const contextKeys = await storage.getKeys(contextPrefix)
        for (const key of contextKeys) {
          try {
            await storage.removeItem(key)
            purgedCount++
          } catch (err) {
            // Key might not exist or already removed
          }
        }
        
        // Purge all keys matching the events prefix (for events leaderboard)
        const eventsKeys = await storage.getKeys(eventsPrefix)
        for (const key of eventsKeys) {
          try {
            await storage.removeItem(key)
            purgedCount++
          } catch (err) {
            // Key might not exist or already removed
          }
        }
      } catch (err) {
        // getKeys might not be supported, fall back to removing known keys
        // Try to remove all possible variations
        const prefixesToTry = [
          contextPrefix,
          eventsPrefix,
        ]
        
        for (const prefix of prefixesToTry) {
          try {
            const keys = await storage.getKeys(prefix)
            for (const key of keys) {
              try {
                await storage.removeItem(key)
                purgedCount++
              } catch (err) {
                // Key might not exist
              }
            }
          } catch (err) {
            // Prefix might not work, continue
          }
        }
      }
      
      return {
        success: true,
        message: `Leaderboard cache purged successfully for ${context} context. ${purgedCount} cache entry/entries removed.`,
        purgedCount,
      }
    } else {
      // Purge all cache (backward compatibility)
      try {
        const keys = await storage.getKeys(CACHE_PREFIX)
        for (const key of keys) {
          try {
            await storage.removeItem(key)
            purgedCount++
          } catch (err) {
            // Key might not exist or already removed
          }
        }
      } catch (err) {
        // getKeys might not be supported, fall back to removing known keys
        const knownKeys = [
          `${CACHE_PREFIX}events:admin`,
          `${CACHE_PREFIX}events:presentation`,
          `${CACHE_PREFIX}admin:`,
          `${CACHE_PREFIX}presentation:`,
        ]
        for (const key of knownKeys) {
          try {
            await storage.removeItem(key)
            purgedCount++
          } catch (err) {
            // Key might not exist
          }
        }
      }

      return {
        success: true,
        message: `All leaderboard cache purged successfully. ${purgedCount} cache entry/entries removed.`,
        purgedCount,
      }
    }
  } catch (error: any) {
    console.error("Error purging leaderboard cache:", error)
    throw createError({
      statusCode: 500,
      message: `Failed to purge cache: ${error.message || "Unknown error"}`,
    })
  }
})
