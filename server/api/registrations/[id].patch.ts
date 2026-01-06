import { useDB } from "../../utils/db"
import { registrations, registrationParticipants } from "../../database/schema"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"

export default defineEventHandler(async (event) => {
  const db = useDB(event)
  const id = event.context.params!.id!
  const { teamName, participantIds = [], participantType } = await readBody(event)
  const d1 = event.context.cloudflare!.env!.DB
  const batchOps = []

  if (teamName !== undefined) {
    const updateQuery = db.update(registrations).set({ teamName: teamName || null }).where(eq(registrations.id, id)).toSQL()
    batchOps.push(d1.prepare(updateQuery.sql).bind(...updateQuery.params))
  }

  const deleteQuery = db.delete(registrationParticipants).where(eq(registrationParticipants.registrationId, id)).toSQL()
  batchOps.push(d1.prepare(deleteQuery.sql).bind(...deleteQuery.params))

  for (const participantId of participantIds) {
    const insertQuery = db.insert(registrationParticipants).values({
      id: nanoid(),
      registrationId: id,
      participantId,
      participantType,
    }).toSQL()
    batchOps.push(d1.prepare(insertQuery.sql).bind(...insertQuery.params))
  }

  await d1.batch(batchOps)

  return { success: true, registrationId: id, message: "Registration updated successfully" }
})

