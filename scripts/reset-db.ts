// Reset database script for Cloudflare D1
// This script generates SQL to drop all tables and triggers
// Run with: bun scripts/reset-db.ts > reset.sql
// Then: wrangler d1 execute DB --remote --file=reset.sql

async function generateResetSQL() {
  const sql: string[] = []

  sql.push("-- Drop all triggers first")
  sql.push("DROP TRIGGER IF EXISTS update_students_updated_at;")
  sql.push("")
  
  sql.push("-- Drop all tables in reverse order (to handle foreign key constraints)")
  sql.push("DROP TABLE IF EXISTS registration_participants;")
  sql.push("DROP TABLE IF EXISTS registrations;")
  sql.push("DROP TABLE IF EXISTS students;")
  sql.push("DROP TABLE IF EXISTS faculty;")
  sql.push("DROP TABLE IF EXISTS events;")
  sql.push("DROP TABLE IF EXISTS schools;")
  sql.push("")

  console.log(sql.join("\n"))
}

generateResetSQL().catch(console.error)

