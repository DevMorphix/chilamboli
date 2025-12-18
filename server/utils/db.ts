import { drizzle } from "drizzle-orm/d1"
import type { H3Event } from "h3"
import * as schema from "../database/schema"

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>

export function useDB(event: H3Event): DrizzleDB {
  const { cloudflare } = event.context
  
  if (!cloudflare?.env?.DB) {
    throw createError({
      statusCode: 500,
      message: "Database not available",
    })
  }
  
  return drizzle(cloudflare.env.DB, { schema })
}
