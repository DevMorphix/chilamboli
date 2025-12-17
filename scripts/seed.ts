// Seed script for MongoDB
// Run with: npx tsx scripts/seed.ts

import mongoose from "mongoose"
import { School, Event, Student, Faculty } from "../server/database/models"
import bcrypt from "bcryptjs"

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/chilamboli")
  console.log("Connected to MongoDB")

  // Clear existing data
  await Promise.all([School.deleteMany({}), Event.deleteMany({}), Student.deleteMany({}), Faculty.deleteMany({})])
  console.log("Cleared existing data")

  // Seed schools (with school codes)
  const schools = await School.insertMany([
    { schoolCode: "AID001", name: "Model School for Intellectually Disabled - Trivandrum", location: "Trivandrum" },
    { schoolCode: "AID002", name: "Special School Kochi", location: "Kochi" },
    { schoolCode: "AID003", name: "AID Training Center Kozhikode", location: "Kozhikode" },
    { schoolCode: "AID004", name: "Intellectual Disability Center Kannur", location: "Kannur" },
    { schoolCode: "AID005", name: "Special Education School Thrissur", location: "Thrissur" },
  ])
  console.log(`Seeded ${schools.length} schools`)

  // Seed sample faculty
  const hashedPassword = await bcrypt.hash("password123", 10)
  const faculties = await Faculty.insertMany([
    {
      schoolId: schools[0].id,
      facultyName: "Rajesh Kumar",
      mobileNumber: "9876543210",
      schoolEmail: "rajesh@aidschool1.edu.in",
      password: hashedPassword,
      isVerified: true,
    },
    {
      schoolId: schools[1].id,
      facultyName: "Priya Menon",
      mobileNumber: "9876543211",
      schoolEmail: "priya@aidschool2.edu.in",
      password: hashedPassword,
      isVerified: true,
    },
  ])
  console.log(`Seeded ${faculties.length} faculty members`)

  // Seed events according to Chilamboli specification
  const events = []

  // Sub Junior Events
  events.push(
    // Individual
    { name: "Fancy Dress", eventType: "Individual", ageCategory: "Sub Junior" },
    { name: "Coloring", eventType: "Individual", ageCategory: "Sub Junior" },
    // Group
    { name: "Cinematic Dance", eventType: "Group", ageCategory: "Sub Junior", maxTeamSize: 8 },
    { name: "Unified Wheelchair Dance", eventType: "Group", ageCategory: "Sub Junior", maxTeamSize: 6 },
  )

  // Junior Events
  events.push(
    // Individual
    { name: "Kavitha Parayanam", eventType: "Individual", ageCategory: "Junior" },
    { name: "Bottle Art", eventType: "Individual", ageCategory: "Junior" },
    {
      name: "Folk Dance - Boys",
      nameInMalayalam: "നാടോടി നൃത്തം - ആൺകുട്ടികൾ",
      eventType: "Individual",
      ageCategory: "Junior",
      gender: "Boys",
    },
    {
      name: "Folk Dance - Girls",
      nameInMalayalam: "നാടോടി നൃത്തം - പെൺകുട്ടികൾ",
      eventType: "Individual",
      ageCategory: "Junior",
      gender: "Girls",
    },
    // Group
    { name: "Cinematic Dance", eventType: "Group", ageCategory: "Junior", maxTeamSize: 8 },
    { name: "Unified Wheel Chair Dance", eventType: "Group", ageCategory: "Junior", maxTeamSize: 6 },
    { name: "Fashion Show", eventType: "Group", ageCategory: "Junior", maxTeamSize: 10 },
    {
      name: "Katha Prasangam",
      nameInMalayalam: "കഥാപ്രസംഗം",
      eventType: "Group",
      ageCategory: "Junior",
      maxTeamSize: 5,
    },
    {
      name: "Instrumental Music - Fusion",
      nameInMalayalam: "വൃന്ദ വാദ്യം",
      eventType: "Group",
      ageCategory: "Junior",
      maxTeamSize: 8,
    },
    {
      name: "Folk Music",
      nameInMalayalam: "നാടോടി പാട്ട്",
      eventType: "Group",
      ageCategory: "Junior",
      maxTeamSize: 6,
    },
  )

  // Senior Events
  events.push(
    // Individual
    { name: "Vegetable Colouring", eventType: "Individual", ageCategory: "Senior" },
    { name: "Kavitha Parayanam", eventType: "Individual", ageCategory: "Senior" },
    { name: "Mono Act", eventType: "Individual", ageCategory: "Senior" },
    { name: "Folk Dance - Boys", eventType: "Individual", ageCategory: "Senior", gender: "Boys" },
    { name: "Folk Dance - Girls", eventType: "Individual", ageCategory: "Senior", gender: "Girls" },
    // Group
    { name: "Cinematic Dance", eventType: "Group", ageCategory: "Senior", maxTeamSize: 8 },
    { name: "Unified Wheel Chair Dance", eventType: "Group", ageCategory: "Senior", maxTeamSize: 6 },
    { name: "Fashion Show", eventType: "Group", ageCategory: "Senior", maxTeamSize: 10 },
    { name: "Katha Prasangam", eventType: "Group", ageCategory: "Senior", maxTeamSize: 5 },
    {
      name: "Vrunda Vadhyam - Fusion",
      nameInMalayalam: "വൃന്ദ വാദ്യം",
      eventType: "Group",
      ageCategory: "Senior",
      maxTeamSize: 8,
    },
    { name: "Nadodi Pattu", nameInMalayalam: "നാടോടി പാട്ട്", eventType: "Group", ageCategory: "Senior", maxTeamSize: 6 },
    { name: "MIME", eventType: "Group", ageCategory: "Senior", maxTeamSize: 6 },
  )

  // Combined Category Events (not counted in participation limit)
  events.push(
    { name: "BAND Melam", eventType: "Group", ageCategory: "Combined", maxTeamSize: 15 },
    { name: "Chenda Melam", eventType: "Group", ageCategory: "Combined", maxTeamSize: 12 },
    { name: "Shikkari Melam", eventType: "Group", ageCategory: "Combined", maxTeamSize: 10 },
  )

  const createdEvents = await Event.insertMany(events)
  console.log(`Seeded ${createdEvents.length} events`)

  // Seed sample students
  const students = await Student.insertMany([
    {
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
  ])
  console.log(`Seeded ${students.length} students`)

  await mongoose.disconnect()
  console.log("Seeding complete!")
}

seed().catch(console.error)
