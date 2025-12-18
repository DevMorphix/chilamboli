// Seed script for Cloudflare D1
// This script generates SQL that can be run via wrangler d1 execute
// Run with: bun scripts/seed.ts > seed.sql
// Then: wrangler d1 execute DB --local --file=seed.sql

import { nanoid } from "nanoid"
import schoolsData from "./schools.js"
import eventsData from "./events.js"

interface SchoolData {
  name: string
  schoolCode: string
  location: string
}

interface EventData {
  name: string
  eventType: string
  ageCategory: string
}

function capitalize(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

async function generateSeedSQL() {
  const sql: string[] = []

  // Helper to escape SQL strings
  const esc = (str: string | null | undefined) => {
    if (str === null || str === undefined) return "NULL"
    return `'${str.replace(/'/g, "''")}'`
  }

  const now = Date.now()

  // Clear existing data
  sql.push("DELETE FROM events;")
  sql.push("DELETE FROM schools;")
  sql.push("")

  // Seed schools from schools.js
  const schools = (schoolsData as SchoolData[]).map((school) => ({
    id: nanoid(),
    schoolCode: school.schoolCode,
    name: school.name,
    location: school.location,
  }))

  sql.push("-- Schools")
  for (const school of schools) {
    sql.push(
      `INSERT INTO schools (id, school_code, name, location, created_at) VALUES (${esc(school.id)}, ${esc(school.schoolCode)}, ${esc(school.name)}, ${esc(school.location)}, ${now});`
    )
  }
  sql.push("")

  // Seed events from events.js
  const events = (eventsData as EventData[]).map((event) => ({
    id: nanoid(),
    name: event.name,
    eventType: capitalize(event.eventType), // "individual" -> "Individual"
    ageCategory: capitalize(event.ageCategory), // "sub-junior" -> "Sub Junior"
  }))

  sql.push("-- Events")
  for (const e of events) {
    sql.push(
      `INSERT INTO events (id, name, description, event_type, age_category, gender, max_team_size, created_at) VALUES (${esc(e.id)}, ${esc(e.name)}, NULL, ${esc(e.eventType)}, ${esc(e.ageCategory)}, NULL, NULL, ${now});`
    )
  }
  sql.push("")

  console.log(sql.join("\n"))
}

generateSeedSQL().catch(console.error)
