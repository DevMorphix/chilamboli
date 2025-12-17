# Event Registration System

A full-stack event registration application built with Nuxt.js and MongoDB (Mongoose).

## Features

- Multi-step registration form
- School selection
- Age-based event filtering
- Single, group, and combined event types
- Dynamic student creation with autocomplete
- Team formation for group events

## Setup

1. Install dependencies:
```bash
bun install
```

2. Make sure MongoDB is running locally (or use MongoDB Atlas)

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. (Optional) Seed the database:
```bash
bun run scripts/seed.ts
```

5. Start the development server:
```bash
bun dev
```

## Environment Variables

- `MONGODB_URI` - MongoDB connection string (default: `mongodb://localhost:27017/chilamboli`)

## Database Models

- **School**: School information (name, location)
- **Student**: Student details (firstName, lastName, email, phone, dateOfBirth, school ref)
- **Event**: Events with type (single/group/combined) and age restrictions
- **Registration**: Event registrations with participants embedded

## API Routes

All API routes are in the `server/api` directory and follow RESTful conventions.
