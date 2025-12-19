import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { relations } from "drizzle-orm"

// Schools table
export const schools = sqliteTable("schools", {
  id: text("id").primaryKey(),
  schoolCode: text("school_code").notNull().unique(),
  name: text("name").notNull().unique(),
  location: text("location"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

// Faculty table
export const faculty = sqliteTable("faculty", {
  id: text("id").primaryKey(),
  schoolId: text("school_id")
    .notNull()
    .references(() => schools.id),
  facultyName: text("faculty_name").notNull(),
  mobileNumber: text("mobile_number").notNull(),
  schoolEmail: text("school_email").notNull().unique(),
  password: text("password").notNull(),
  isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
})

// Students table
export const students = sqliteTable("students", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull().unique(),
  studentName: text("student_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  ageCategory: text("age_category", { enum: ["Sub Junior", "Junior", "Senior"] }).notNull(),
  gender: text("gender", { enum: ["male", "female", "others"] }).notNull(),
  photoUrl: text("photo_url"),
  disabilityCertificateUrl: text("disability_certificate_url"),
  schoolId: text("school_id")
    .notNull()
    .references(() => schools.id),
  addedByFacultyId: text("added_by_faculty_id")
    .notNull()
    .references(() => faculty.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
})

// Events table
export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  eventType: text("event_type", { enum: ["Individual", "Group", "Combined"] }).notNull(),
  ageCategory: text("age_category", { enum: ["Sub Junior", "Junior", "Senior", "Combined", "Special"] }).notNull(),
  gender: text("gender", { enum: ["Boys", "Girls", "All"] }),
  maxTeamSize: integer("max_team_size"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

// Registrations table
export const registrations = sqliteTable("registrations", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id),
  teamName: text("team_name"),
  schoolId: text("school_id")
    .notNull()
    .references(() => schools.id),
  registeredByFacultyId: text("registered_by_faculty_id")
    .notNull()
    .references(() => faculty.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
})

// Registration participants (many-to-many relationship)
export const registrationParticipants = sqliteTable("registration_participants", {
  id: text("id").primaryKey(),
  registrationId: text("registration_id")
    .notNull()
    .references(() => registrations.id, { onDelete: "cascade" }),
  participantId: text("participant_id").notNull(),
  participantType: text("participant_type", { enum: ["student", "faculty"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
})

// Relations
export const schoolsRelations = relations(schools, ({ many }) => ({
  faculty: many(faculty),
  students: many(students),
  registrations: many(registrations),
}))

export const facultyRelations = relations(faculty, ({ one, many }) => ({
  school: one(schools, {
    fields: [faculty.schoolId],
    references: [schools.id],
  }),
  students: many(students),
  registrations: many(registrations),
}))

export const studentsRelations = relations(students, ({ one, many }) => ({
  school: one(schools, {
    fields: [students.schoolId],
    references: [schools.id],
  }),
  addedByFaculty: one(faculty, {
    fields: [students.addedByFacultyId],
    references: [faculty.id],
  }),
  registrationParticipants: many(registrationParticipants),
}))

export const eventsRelations = relations(events, ({ many }) => ({
  registrations: many(registrations),
}))

export const registrationsRelations = relations(registrations, ({ one, many }) => ({
  event: one(events, {
    fields: [registrations.eventId],
    references: [events.id],
  }),
  school: one(schools, {
    fields: [registrations.schoolId],
    references: [schools.id],
  }),
  registeredByFaculty: one(faculty, {
    fields: [registrations.registeredByFacultyId],
    references: [faculty.id],
  }),
  participants: many(registrationParticipants),
}))

export const registrationParticipantsRelations = relations(registrationParticipants, ({ one }) => ({
  registration: one(registrations, {
    fields: [registrationParticipants.registrationId],
    references: [registrations.id],
  }),
  // Note: student and faculty relations are conditional based on participantType
  // These are defined for type safety but actual joins should be done in queries
}))

// Type exports
export type School = typeof schools.$inferSelect
export type NewSchool = typeof schools.$inferInsert
export type Faculty = typeof faculty.$inferSelect
export type NewFaculty = typeof faculty.$inferInsert
export type Student = typeof students.$inferSelect
export type NewStudent = typeof students.$inferInsert
export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
export type Registration = typeof registrations.$inferSelect
export type NewRegistration = typeof registrations.$inferInsert
export type RegistrationParticipant = typeof registrationParticipants.$inferSelect
export type NewRegistrationParticipant = typeof registrationParticipants.$inferInsert
