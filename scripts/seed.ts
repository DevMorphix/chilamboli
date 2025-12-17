// Seed script for MongoDB
// Run with: npx tsx scripts/seed.ts

import mongoose from "mongoose"
import { School, Event, Student } from "../server/database/models"

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log("Connected to MongoDB")

  // Clear existing data
  await Promise.all([
    School.deleteMany({}),
    Event.deleteMany({}),
    Student.deleteMany({}),
  ])
  console.log("Cleared existing data")

  // Seed schools
  const schools = await School.insertMany([
    { name: "Springfield Elementary", location: "Springfield" },
    { name: "Shelbyville High", location: "Shelbyville" },
    { name: "Capital City Academy", location: "Capital City" },
  ])
  console.log(`Seeded ${schools.length} schools`)

  // Seed events
  const events = await Event.insertMany([
    { name: "100m Sprint", eventType: "single", minAge: 10, maxAge: 18 },
    { name: "Relay Race", eventType: "group", minAge: 12, maxAge: 18, maxTeamSize: 4 },
    { name: "Essay Writing", eventType: "single", minAge: 10, maxAge: 16 },
    { name: "Quiz Competition", eventType: "group", minAge: 12, maxAge: 18, maxTeamSize: 3 },
    { name: "Art Exhibition", eventType: "single", minAge: 8, maxAge: 14 },
  ])
  console.log(`Seeded ${events.length} events`)

  // Seed sample students
  const students = await Student.insertMany([
    { firstName: "John", lastName: "Doe", dateOfBirth: "2010-05-15", schoolId: schools[0].id },
    { firstName: "Jane", lastName: "Smith", dateOfBirth: "2009-08-22", schoolId: schools[0].id },
    { firstName: "Bob", lastName: "Johnson", dateOfBirth: "2011-03-10", schoolId: schools[1].id },
  ])
  console.log(`Seeded ${students.length} students`)

  await mongoose.disconnect()
  console.log("Seeding complete!")
}

seed().catch(console.error)
