// Seed script for Cloudflare D1
// This script generates SQL that can be run via wrangler d1 execute
// Run with: bun scripts/seed.ts > seed.sql
// Then: wrangler d1 execute DB --local --file=seed.sql

import { nanoid } from "nanoid"
import bcrypt from "bcryptjs"
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
  sql.push("DELETE FROM registration_participants;")
  sql.push("DELETE FROM registrations;")
  sql.push("DELETE FROM students;")
  sql.push("DELETE FROM faculty;")
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

  // Seed faculty (using first two schools)
  const hashedPassword = await bcrypt.hash("password123", 10)
  const faculties = [
    {
      id: nanoid(),
      schoolId: schools[0].id,
      facultyName: "Rajesh Kumar",
      mobileNumber: "9876543210",
      schoolEmail: "rajesh@aidschool1.edu.in",
      password: hashedPassword,
      isVerified: true,
    },
    {
      id: nanoid(),
      schoolId: schools[1].id,
      facultyName: "Priya Menon",
      mobileNumber: "9876543211",
      schoolEmail: "priya@aidschool2.edu.in",
      password: hashedPassword,
      isVerified: true,
    },
  ]

  sql.push("-- Faculty")
  for (const f of faculties) {
    sql.push(
      `INSERT INTO faculty (id, school_id, faculty_name, mobile_number, school_email, password, is_verified, created_at) VALUES (${esc(f.id)}, ${esc(f.schoolId)}, ${esc(f.facultyName)}, ${esc(f.mobileNumber)}, ${esc(f.schoolEmail)}, ${esc(f.password)}, ${f.isVerified ? 1 : 0}, ${now});`
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
      `INSERT INTO events (id, name, name_in_malayalam, event_type, age_category, gender, max_team_size, created_at) VALUES (${esc(e.id)}, ${esc(e.name)}, NULL, ${esc(e.eventType)}, ${esc(e.ageCategory)}, NULL, NULL, ${now});`
    )
  }
  sql.push("")

  // Seed sample students
  const students = [
    {
      id: nanoid(),
      studentId: `STU-${nanoid(10)}`.toUpperCase(),
      chestNumber: `CH-${nanoid(8)}`.toUpperCase(),
      studentName: "Arjun Nair",
      dateOfBirth: "2015-03-15",
      ageCategory: "Sub Junior",
      class: "5th Standard",
      rollNumber: "101",
      schoolId: schools[0].id,
      addedByFacultyId: faculties[0].id,
      photoUrl: "/placeholder-user.jpg",
      disabilityCertificateUrl: "/placeholder.pdf",
    },
    {
      id: nanoid(),
      studentId: `STU-${nanoid(10)}`.toUpperCase(),
      chestNumber: `CH-${nanoid(8)}`.toUpperCase(),
      studentName: "Meera Krishna",
      dateOfBirth: "2014-08-20",
      ageCategory: "Sub Junior",
      class: "6th Standard",
      rollNumber: "102",
      schoolId: schools[0].id,
      addedByFacultyId: faculties[0].id,
      photoUrl: "/placeholder-user.jpg",
      disabilityCertificateUrl: "/placeholder.pdf",
    },
    {
      id: nanoid(),
      studentId: `STU-${nanoid(10)}`.toUpperCase(),
      chestNumber: `CH-${nanoid(8)}`.toUpperCase(),
      studentName: "Aditya Pillai",
      dateOfBirth: "2010-05-10",
      ageCategory: "Junior",
      class: "10th Standard",
      rollNumber: "103",
      schoolId: schools[0].id,
      addedByFacultyId: faculties[0].id,
      photoUrl: "/placeholder-user.jpg",
      disabilityCertificateUrl: "/placeholder.pdf",
    },
    {
      id: nanoid(),
      studentId: `STU-${nanoid(10)}`.toUpperCase(),
      chestNumber: `CH-${nanoid(8)}`.toUpperCase(),
      studentName: "Lakshmi Menon",
      dateOfBirth: "2008-12-05",
      ageCategory: "Junior",
      class: "12th Standard",
      rollNumber: "104",
      schoolId: schools[1].id,
      addedByFacultyId: faculties[1].id,
      photoUrl: "/placeholder-user.jpg",
      disabilityCertificateUrl: "/placeholder.pdf",
    },
    {
      id: nanoid(),
      studentId: `STU-${nanoid(10)}`.toUpperCase(),
      chestNumber: `CH-${nanoid(8)}`.toUpperCase(),
      studentName: "Ravi Kumar",
      dateOfBirth: "2003-07-22",
      ageCategory: "Senior",
      class: "Special Training",
      rollNumber: "105",
      schoolId: schools[1].id,
      addedByFacultyId: faculties[1].id,
      photoUrl: "/placeholder-user.jpg",
      disabilityCertificateUrl: "/placeholder.pdf",
    },
  ]

  sql.push("-- Students")
  for (const s of students) {
    sql.push(
      `INSERT INTO students (id, student_id, chest_number, student_name, date_of_birth, age_category, class, roll_number, photo_url, disability_certificate_url, school_id, added_by_faculty_id, created_at, updated_at) VALUES (${esc(s.id)}, ${esc(s.studentId)}, ${esc(s.chestNumber)}, ${esc(s.studentName)}, ${esc(s.dateOfBirth)}, ${esc(s.ageCategory)}, ${esc(s.class)}, ${esc(s.rollNumber)}, ${esc(s.photoUrl)}, ${esc(s.disabilityCertificateUrl)}, ${esc(s.schoolId)}, ${esc(s.addedByFacultyId)}, ${now}, ${now});`
    )
  }

  console.log(sql.join("\n"))
}

generateSeedSQL().catch(console.error)
