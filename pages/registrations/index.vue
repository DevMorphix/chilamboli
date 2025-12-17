<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="border-b border-border bg-card">
      <div class="container mx-auto px-4 py-6">
        <h1 class="text-3xl font-bold text-foreground">View Registrations</h1>
        <p class="text-muted-foreground mt-2">Browse all event registrations</p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
      <div class="max-w-5xl mx-auto">
        <!-- Filters -->
        <div class="bg-card border border-border rounded-lg p-4 mb-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="filterEvent" class="block text-sm font-medium text-foreground mb-2">
                Filter by Event
              </label>
              <select
                id="filterEvent"
                v-model="filterEventId"
                class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">All Events</option>
                <option v-for="event in events" :key="event.id" :value="event.id">
                  {{ event.name }}
                </option>
              </select>
            </div>
            <div>
              <label for="filterSchool" class="block text-sm font-medium text-foreground mb-2">
                Filter by School
              </label>
              <select
                id="filterSchool"
                v-model="filterSchoolId"
                class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                <option value="">All Schools</option>
                <option v-for="school in schools" :key="school.id" :value="school.id">
                  {{ school.name }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Registrations List -->
        <div v-if="pending" class="text-center py-12">
          <p class="text-muted-foreground">Loading registrations...</p>
        </div>

        <div v-else-if="registrations && registrations.length > 0" class="space-y-4">
          <div
            v-for="registration in registrations"
            :key="registration.id"
            class="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-foreground mb-2">
                  {{ registration.teamName || 'Individual Registration' }}
                </h3>
                <div class="space-y-1 text-sm text-muted-foreground">
                  <p><strong>Event:</strong> {{ registration.eventName }}</p>
                  <p><strong>School:</strong> {{ registration.schoolName }}</p>
                  <p><strong>Type:</strong> {{ formatEventType(registration.eventType) }}</p>
                  <p><strong>Participants:</strong> {{ registration.participantCount }}</p>
                </div>
              </div>
              <div class="ml-4">
                <NuxtLink
                  :to="`/registrations/${registration.id}`"
                  class="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  View Details
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12 bg-card border border-border rounded-lg">
          <p class="text-muted-foreground">No registrations found.</p>
          <NuxtLink
            to="/"
            class="inline-block mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            Register for an Event
          </NuxtLink>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useFetch } from '#app' // Import useFetch

const filterEventId = ref('')
const filterSchoolId = ref('')

const { data: schools } = useFetch('/api/schools')
const { data: events } = useFetch('/api/events')
const { data: registrations, pending, refresh } = useFetch('/api/registrations')

watch([filterEventId, filterSchoolId], async () => {
  await refresh()
})

function formatEventType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}
</script>
