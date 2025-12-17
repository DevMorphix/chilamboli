import mongoose, { Schema, model, type Document } from "mongoose"
import { nanoid } from "nanoid"

export interface ISchool extends Document {
  id: string
  schoolCode: string
  name: string
  location?: string
  createdAt: Date
}

const schoolSchema = new Schema<ISchool>({
  id: { type: String, default: () => nanoid(), unique: true, index: true },
  schoolCode: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  location: String,
  createdAt: { type: Date, default: Date.now },
})

export interface IFaculty extends Document {
  id: string
  schoolId: string
  facultyName: string
  mobileNumber: string
  schoolEmail: string
  password: string
  isVerified: boolean
  createdAt: Date
}

const facultySchema = new Schema<IFaculty>({
  id: { type: String, default: () => nanoid(), unique: true, index: true },
  schoolId: { type: String, required: true, index: true },
  facultyName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  schoolEmail: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})

export interface IStudent extends Document {
  id: string
  studentId: string
  chestNumber: string
  studentName: string
  dateOfBirth: string
  ageCategory: "Sub Junior" | "Junior" | "Senior"
  class: string
  rollNumber: string
  photoUrl?: string
  disabilityCertificateUrl?: string
  schoolId: string
  addedByFacultyId: string
  createdAt: Date
  updatedAt: Date
}

const studentSchema = new Schema<IStudent>({
  id: { type: String, default: () => nanoid(), unique: true, index: true },
  studentId: { type: String, unique: true, index: true },
  chestNumber: { type: String, unique: true, index: true },
  studentName: { type: String, required: true },
  dateOfBirth: { type: String, required: true },
  ageCategory: { type: String, required: true, enum: ["Sub Junior", "Junior", "Senior"] },
  class: { type: String, required: true },
  rollNumber: { type: String, required: true },
  photoUrl: { type: String },
  disabilityCertificateUrl: { type: String },
  schoolId: { type: String, required: true, index: true },
  addedByFacultyId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

studentSchema.pre("save", function (next) {
  if (!this.studentId) {
    this.studentId = `STU-${nanoid(10)}`.toUpperCase()
  }
  if (!this.chestNumber) {
    this.chestNumber = `CH-${nanoid(8)}`.toUpperCase()
  }
  this.updatedAt = new Date()
  next()
})

export interface IEvent extends Document {
  id: string
  name: string
  nameInMalayalam?: string
  description?: string
  eventType: "Individual" | "Group" | "Combined"
  ageCategory: "Sub Junior" | "Junior" | "Senior" | "Combined"
  gender?: "Boys" | "Girls" | "All"
  maxTeamSize?: number
  createdAt: Date
}

const eventSchema = new Schema<IEvent>({
  id: { type: String, default: () => nanoid(), unique: true, index: true },
  name: { type: String, required: true },
  nameInMalayalam: String,
  description: String,
  eventType: { type: String, required: true, enum: ["Individual", "Group", "Combined"] },
  ageCategory: { type: String, required: true, enum: ["Sub Junior", "Junior", "Senior", "Combined"] },
  gender: { type: String, enum: ["Boys", "Girls", "All"] },
  maxTeamSize: Number,
  createdAt: { type: Date, default: Date.now },
})

export interface IRegistration extends Document {
  id: string
  eventId: string
  teamName?: string
  schoolId: string
  participantIds: string[]
  registeredByFacultyId: string
  createdAt: Date
}

const registrationSchema = new Schema<IRegistration>({
  id: { type: String, default: () => nanoid(), unique: true, index: true },
  eventId: { type: String, required: true, index: true },
  teamName: String,
  schoolId: { type: String, required: true, index: true },
  participantIds: [{ type: String }],
  registeredByFacultyId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
})

// Export models (handle hot reload)
export const School = mongoose.models.School || model<ISchool>("School", schoolSchema)
export const Faculty = mongoose.models.Faculty || model<IFaculty>("Faculty", facultySchema)
export const Student = mongoose.models.Student || model<IStudent>("Student", studentSchema)
export const Event = mongoose.models.Event || model<IEvent>("Event", eventSchema)
export const Registration = mongoose.models.Registration || model<IRegistration>("Registration", registrationSchema)
