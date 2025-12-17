import mongoose, { Schema, model, type Document } from "mongoose"
import { nanoid } from "nanoid"

// School
export interface ISchool extends Document {
  id: string
  name: string
  location?: string
  createdAt: Date
}

const schoolSchema = new Schema<ISchool>({
  id: { type: String, default: () => nanoid(), unique: true, index: true },
  name: { type: String, required: true, unique: true },
  location: String,
  createdAt: { type: Date, default: Date.now },
})

// Student
export interface IStudent extends Document {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  dateOfBirth: string
  schoolId: string
  createdAt: Date
}

const studentSchema = new Schema<IStudent>({
  id: { type: String, default: () => nanoid(), unique: true, index: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: String,
  phone: String,
  dateOfBirth: { type: String, required: true },
  schoolId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
})

// Event
export interface IEvent extends Document {
  id: string
  name: string
  description?: string
  eventType: "single" | "group" | "combined"
  minAge: number
  maxAge: number
  maxTeamSize?: number
  createdAt: Date
}

const eventSchema = new Schema<IEvent>({
  id: { type: String, default: () => nanoid(), unique: true, index: true },
  name: { type: String, required: true },
  description: String,
  eventType: { type: String, required: true, enum: ["single", "group", "combined"] },
  minAge: { type: Number, required: true },
  maxAge: { type: Number, required: true },
  maxTeamSize: Number,
  createdAt: { type: Date, default: Date.now },
})

// Registration
export interface IRegistration extends Document {
  id: string
  eventId: string
  teamName?: string
  schoolId: string
  participantIds: string[]
  createdAt: Date
}

const registrationSchema = new Schema<IRegistration>({
  id: { type: String, default: () => nanoid(), unique: true, index: true },
  eventId: { type: String, required: true, index: true },
  teamName: String,
  schoolId: { type: String, required: true, index: true },
  participantIds: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
})

// Export models (handle hot reload)
export const School = mongoose.models.School || model<ISchool>("School", schoolSchema)
export const Student = mongoose.models.Student || model<IStudent>("Student", studentSchema)
export const Event = mongoose.models.Event || model<IEvent>("Event", eventSchema)
export const Registration = mongoose.models.Registration || model<IRegistration>("Registration", registrationSchema)
