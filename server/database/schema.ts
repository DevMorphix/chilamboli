import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core"
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

// Auth table - stores authentication credentials for both faculty and admin
export const auth = sqliteTable("auth", {
  id: text("id").primaryKey(),
  email: text("email"),
  mobileNumber: text("mobile_number"),
  password: text("password").notNull(),
  userType: text("user_type", { enum: ["faculty", "admin", "judge", "volunteer"] }).notNull(),
  userId: text("user_id").notNull(), // References faculty.id or admin.id or judges.id identifier
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
}, (table) => ({
  emailUserTypeIdx: index("idx_auth_email_user_type").on(table.email, table.userType),
  mobileNumberUserTypeIdx: index("idx_auth_mobile_number_user_type").on(table.mobileNumber, table.userType),
}))

// Faculty table
export const faculty = sqliteTable("faculty", {
  id: text("id").primaryKey(),
  schoolId: text("school_id")
    .notNull()
    .references(() => schools.id),
  facultyName: text("faculty_name").notNull(),
  mobileNumber: text("mobile_number").notNull(),
  createdBy: text("created_by")
    .references(() => faculty.id), // Nullable - null for initial faculty, faculty.id for faculty-added faculty
  isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
}, (table) => ({
  schoolIdIdx: index("idx_faculty_school_id").on(table.schoolId),
}))

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
  birthCertificateUrl: text("birth_certificate_url"),
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
}, (table) => ({
  schoolIdIdx: index("idx_students_school_id").on(table.schoolId),
  genderIdx: index("idx_students_gender").on(table.gender),
}))

// Events table
export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  eventType: text("event_type", { enum: ["Individual", "Group", "Combined"] }).notNull(),
  ageCategory: text("age_category", { enum: ["Sub Junior", "Junior", "Senior", "Combined", "Special"] }).notNull(),
  gender: text("gender", { enum: ["Boys", "Girls", "All"] }),
  maxTeamSize: integer("max_team_size"),
  isCompleted: integer("is_completed", { mode: "boolean" }).notNull().default(false),
  registrationClosed: integer("registration_closed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  nameIdx: index("idx_events_name").on(table.name),
  createdAtIdx: index("idx_events_created_at").on(table.createdAt),
  isCompletedIdx: index("idx_events_is_completed").on(table.isCompleted),
}))

// Judges table
export const judges = sqliteTable("judges", {
  id: text("id").primaryKey(),
  judgeName: text("judge_name").notNull(),
  mobileNumber: text("mobile_number").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
})

// Event-Judge assignments (many-to-many relationship)
export const eventJudges = sqliteTable("event_judges", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  judgeId: text("judge_id")
    .notNull()
    .references(() => judges.id, { onDelete: "cascade" }),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  judgeIdEnabledIdx: index("idx_event_judges_judge_id_enabled").on(table.judgeId, table.enabled),
  eventIdIdx: index("idx_event_judges_event_id").on(table.eventId),
  eventIdJudgeIdUniqueIdx: uniqueIndex("idx_event_judges_event_id_judge_id").on(table.eventId, table.judgeId),
}))

// Registrations table
export const registrations = sqliteTable("registrations", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id),
  chestNumber: text("chest_number"), // Judges see this; used on leaderboard & reports. NULL until seeded.
  teamName: text("team_name"),
  schoolId: text("school_id")
    .notNull()
    .references(() => schools.id),
  registeredByFacultyId: text("registered_by_faculty_id")
    .notNull()
    .references(() => faculty.id),
  createdByProxyUserId: text("created_by_proxy_user_id"), // ID of admin/volunteer who created this registration on behalf of faculty
  createdByProxyUserType: text("created_by_proxy_user_type", { enum: ["admin", "volunteer"] }), // Type of proxy user (null if faculty created it themselves)
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
}, (table) => ({
  eventIdIdx: index("idx_registrations_event_id").on(table.eventId),
  schoolIdIdx: index("idx_registrations_school_id").on(table.schoolId),
}))

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
}, (table) => ({
  registrationIdIdx: index("idx_registration_participants_registration_id").on(table.registrationId),
  participantTypeIdx: index("idx_registration_participants_participant_type").on(table.participantType),
}))

// Judgments table - stores scores from judges for registrations
export const judgments = sqliteTable("judgments", {
  id: text("id").primaryKey(),
  registrationId: text("registration_id")
    .notNull()
    .references(() => registrations.id, { onDelete: "cascade" }),
  judgeId: text("judge_id")
    .notNull()
    .references(() => judges.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  comments: text("comments"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
}, (table) => ({
  registrationIdIdx: index("idx_judgments_registration_id").on(table.registrationId),
  registrationIdJudgeIdUniqueIdx: uniqueIndex("idx_judgments_registration_id_judge_id").on(table.registrationId, table.judgeId),
}))

// Notifications table - stores notification content
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  schoolId: text("school_id")
    .references(() => schools.id, { onDelete: "cascade" }), // Optional - null for common notifications, specific school ID for school-specific
  title: text("title").notNull(),
  message: text("message").notNull(),
  isImportant: integer("is_important", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  schoolIdIdx: index("idx_notifications_school_id").on(table.schoolId),
}))

// Notification recipients table - tracks which schools have received/viewed each notification
export const notificationRecipients = sqliteTable("notification_recipients", {
  id: text("id").primaryKey(),
  notificationId: text("notification_id")
    .notNull()
    .references(() => notifications.id, { onDelete: "cascade" }),
  schoolId: text("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  viewedAt: integer("viewed_at", { mode: "timestamp" }), // When the notification was first viewed by any faculty from this school
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  notificationIdSchoolIdUniqueIdx: uniqueIndex("idx_notification_recipients_notification_id_school_id").on(table.notificationId, table.schoolId),
}))

// Position rewards table - stores reward points for top 3 positions when event results are published
export const positionRewards = sqliteTable("position_rewards", {
  id: text("id").primaryKey(),
  registrationId: text("registration_id")
    .notNull()
    .references(() => registrations.id, { onDelete: "cascade" }),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  position: integer("position").notNull(), // 1, 2, or 3
  rewardPoints: integer("reward_points").notNull(), // 10, 5, or 3
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  registrationIdIdx: index("idx_position_rewards_registration_id").on(table.registrationId),
  eventIdIdx: index("idx_position_rewards_event_id").on(table.eventId),
  registrationIdEventIdUniqueIdx: uniqueIndex("idx_position_rewards_registration_id_event_id").on(table.registrationId, table.eventId),
}))

// Relations
export const schoolsRelations = relations(schools, ({ many }) => ({
  faculty: many(faculty),
  students: many(students),
  registrations: many(registrations),
  notificationRecipients: many(notificationRecipients),
}))

export const authRelations = relations(auth, ({ one }) => ({
  // Note: Relations to faculty/admin are handled via userId field
  // Actual joins should be done in queries based on userType
}))

export const facultyRelations = relations(faculty, ({ one, many }) => ({
  school: one(schools, {
    fields: [faculty.schoolId],
    references: [schools.id],
  }),
  createdByFaculty: one(faculty, {
    fields: [faculty.createdBy],
    references: [faculty.id],
    relationName: "createdBy",
  }),
  createdFaculties: many(faculty, {
    relationName: "createdBy",
  }),
  students: many(students),
  registrations: many(registrations),
  notificationRecipients: many(notificationRecipients),
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
  judgeAssignments: many(eventJudges),
  positionRewards: many(positionRewards),
}))

export const judgesRelations = relations(judges, ({ many }) => ({
  eventAssignments: many(eventJudges),
  judgments: many(judgments),
}))

export const eventJudgesRelations = relations(eventJudges, ({ one }) => ({
  event: one(events, {
    fields: [eventJudges.eventId],
    references: [events.id],
  }),
  judge: one(judges, {
    fields: [eventJudges.judgeId],
    references: [judges.id],
  }),
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
  judgments: many(judgments),
  positionRewards: many(positionRewards),
}))

export const judgmentsRelations = relations(judgments, ({ one }) => ({
  registration: one(registrations, {
    fields: [judgments.registrationId],
    references: [registrations.id],
  }),
  judge: one(judges, {
    fields: [judgments.judgeId],
    references: [judges.id],
  }),
}))

export const registrationParticipantsRelations = relations(registrationParticipants, ({ one }) => ({
  registration: one(registrations, {
    fields: [registrationParticipants.registrationId],
    references: [registrations.id],
  }),
  // Note: student and faculty relations are conditional based on participantType
  // These are defined for type safety but actual joins should be done in queries
}))

export const notificationsRelations = relations(notifications, ({ one, many }) => ({
  school: one(schools, {
    fields: [notifications.schoolId],
    references: [schools.id],
  }),
  recipients: many(notificationRecipients),
}))

export const notificationRecipientsRelations = relations(notificationRecipients, ({ one }) => ({
  notification: one(notifications, {
    fields: [notificationRecipients.notificationId],
    references: [notifications.id],
  }),
  school: one(schools, {
    fields: [notificationRecipients.schoolId],
    references: [schools.id],
  }),
}))

export const positionRewardsRelations = relations(positionRewards, ({ one }) => ({
  registration: one(registrations, {
    fields: [positionRewards.registrationId],
    references: [registrations.id],
  }),
  event: one(events, {
    fields: [positionRewards.eventId],
    references: [events.id],
  }),
}))

// Type exports
export type School = typeof schools.$inferSelect
export type NewSchool = typeof schools.$inferInsert
export type Auth = typeof auth.$inferSelect
export type NewAuth = typeof auth.$inferInsert
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
export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert
export type NotificationRecipient = typeof notificationRecipients.$inferSelect
export type NewNotificationRecipient = typeof notificationRecipients.$inferInsert
export type Judge = typeof judges.$inferSelect
export type NewJudge = typeof judges.$inferInsert
export type EventJudge = typeof eventJudges.$inferSelect
export type NewEventJudge = typeof eventJudges.$inferInsert
export type Judgment = typeof judgments.$inferSelect
export type NewJudgment = typeof judgments.$inferInsert
export type PositionReward = typeof positionRewards.$inferSelect
export type NewPositionReward = typeof positionRewards.$inferInsert