<template>
  <div>
    <!-- Header with Cache Control -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Leaderboards</h1>
        <p class="mt-1 text-sm text-gray-500">View rankings and performance metrics</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="purgeCache('admin')"
          :disabled="purgingAdminCache"
          :title="purgingAdminCache ? 'Purging cache...' : 'Purge admin leaderboard cache'"
          :class="[
            'inline-flex items-center justify-center rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors',
            'hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50'
          ]"
        >
          <svg
            v-if="purgingAdminCache"
            class="h-5 w-5 animate-spin mr-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg
            v-else
            class="h-5 w-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{{ purgingAdminCache ? 'Purging...' : 'Purge Admin Cache' }}</span>
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="mb-6">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8 overflow-x-auto">
          <button
            @click="leaderboardTab = 'events'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap',
              leaderboardTab === 'events'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            By Event
          </button>
          <button
            @click="leaderboardTab = 'schools'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap',
              leaderboardTab === 'schools'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            School Rankings
          </button>
          <button
            @click="leaderboardTab = 'districts'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap',
              leaderboardTab === 'districts'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            District Rankings
          </button>
        </nav>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="leaderboardLoading" class="text-center py-12 text-gray-500">
      <svg class="animate-spin h-8 w-8 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading leaderboards...
    </div>

    <!-- Events Leaderboard -->
    <div v-else-if="leaderboardTab === 'events'">
      <div v-if="eventLeaderboards.length === 0" class="rounded-lg border border-gray-200 bg-white py-12 text-center">
        <p class="text-gray-500">No event rankings available yet.</p>
      </div>
      <div v-else class="space-y-6">
        <!-- Back to All Events button when viewing single event -->
        <div v-if="viewingFullEventId" class="mb-4">
          <button
            @click="backToAllEvents"
            :disabled="leaderboardLoading"
            class="inline-flex items-center rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to All Events
          </button>
        </div>
        <div
          v-for="eventLeaderboard in eventLeaderboards"
          :key="eventLeaderboard.event.id"
          v-show="!viewingFullEventId || viewingFullEventId === eventLeaderboard.event.id"
          class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
        >
          <div class="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 bg-purple-50 px-6 py-4">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">{{ eventLeaderboard.event.name }}</h2>
              <p class="mt-1 text-sm text-gray-600">{{ eventLeaderboard.event.eventType }} • {{ eventLeaderboard.event.ageCategory }}</p>
              <p v-if="dataCapturedAt" class="mt-1 text-xs text-gray-500">
                Last updated: {{ formatTimestamp(dataCapturedAt) }}
                <span v-if="cached" class="ml-2 rounded bg-purple-100 px-2 py-0.5 text-purple-700">Cached</span>
              </p>
            </div>
            <button
              v-if="shouldShowAllButton(eventLeaderboard)"
              @click="showAllForEvent(eventLeaderboard)"
              :disabled="loadingFullResults[eventLeaderboard.event.id]"
              class="shrink-0 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span v-if="loadingFullResults[eventLeaderboard.event.id]">
                <svg class="inline-block h-4 w-4 animate-spin mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
              <span v-else>Show All</span>
            </button>
          </div>
          <div v-if="getDisplayedResults(eventLeaderboard).length === 0" class="px-6 py-8 text-center text-gray-500">
            No rankings available for this event yet.
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Rank</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {{ eventLeaderboard.event.eventType === 'Individual' ? 'Student Name' : 'Team Name' }}
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">School</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">School Code</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Total Score</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Normalized Score</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Grade</th>
                  <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Grade Points</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr
                  v-for="(entry, index) in getDisplayedResults(eventLeaderboard)"
                  :key="entry.registrationId"
                  class="transition-colors hover:bg-gray-50"
                >
                  <td class="whitespace-nowrap px-4 py-3">
                    <div class="flex items-center">
                      <span v-if="index === 0" class="text-xl">🥇</span>
                      <span v-else-if="index === 1" class="text-xl">🥈</span>
                      <span v-else-if="index === 2" class="text-xl">🥉</span>
                      <span v-else class="text-sm font-semibold text-gray-900">{{ entry.rank }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <div class="text-sm font-medium text-gray-900">
                      {{ eventLeaderboard.event.eventType === 'Individual'
                        ? (entry.studentName || '-')
                        : (entry.teamName || '-') }}
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <div class="text-sm text-gray-900">{{ entry.schoolName || '-' }}</div>
                  </td>
                  <td class="px-4 py-3">
                    <code class="text-xs font-mono text-gray-600">{{ entry.schoolCode || '-' }}</code>
                  </td>
                  <td class="whitespace-nowrap px-4 py-3">
                    <div class="text-sm font-semibold text-gray-900">{{ entry.totalScore.toFixed(1) }}</div>
                  </td>
                  <td class="whitespace-nowrap px-4 py-3">
                    <div class="text-sm font-semibold text-purple-600">{{ entry.normalizedScore.toFixed(1) }}</div>
                  </td>
                  <td class="whitespace-nowrap px-4 py-3">
                    <span
                      class="rounded-full px-2 py-1 text-xs font-semibold"
                      :class="getGradeColor(entry.grade)"
                    >
                      {{ entry.grade }}
                    </span>
                  </td>
                  <td class="whitespace-nowrap px-4 py-3">
                    <div class="text-sm font-semibold text-blue-600">{{ entry.gradePoint }}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- School Leaderboard -->
    <div v-else-if="leaderboardTab === 'schools'">
      <div v-if="schoolLeaderboard.length === 0" class="rounded-lg border border-gray-200 bg-white py-12 text-center">
        <p class="text-gray-500">No school rankings available yet.</p>
      </div>
      <div v-else class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div class="border-b border-gray-200 bg-purple-50 px-6 py-4">
          <h2 class="text-lg font-semibold text-gray-900">School Rankings</h2>
          <p class="mt-1 text-xs text-gray-500">
            Ranked by total grade points across all events
          </p>
          <p v-if="dataCapturedAt" class="mt-1 text-xs text-gray-500">
            Last updated: {{ formatTimestamp(dataCapturedAt) }}
            <span v-if="cached" class="ml-2 rounded bg-purple-100 px-2 py-0.5 text-purple-700">Cached</span>
          </p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Rank</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">School Name</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">School Code</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Location</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Total Grade Points</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr
                v-for="(entry, index) in schoolLeaderboard"
                :key="entry.schoolId"
                class="transition-colors hover:bg-gray-50"
              >
                <td class="whitespace-nowrap px-4 py-3">
                  <div class="flex items-center">
                    <span v-if="index === 0" class="text-xl">🥇</span>
                    <span v-else-if="index === 1" class="text-xl">🥈</span>
                    <span v-else-if="index === 2" class="text-xl">🥉</span>
                    <span v-else class="text-sm font-semibold text-gray-900">{{ entry.rank }}</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="text-sm font-medium text-gray-900">{{ entry.schoolName || '-' }}</div>
                </td>
                <td class="px-4 py-3">
                  <code class="text-xs font-mono text-gray-600">{{ entry.schoolCode || '-' }}</code>
                </td>
                <td class="px-4 py-3">
                  <div class="text-sm text-gray-600">{{ entry.location || 'Unknown' }}</div>
                </td>
                <td class="whitespace-nowrap px-4 py-3">
                  <div class="text-sm font-semibold text-blue-600">{{ entry.totalGradePoints.toFixed(1) }}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- District Leaderboard -->
    <div v-else-if="leaderboardTab === 'districts'">
      <div v-if="districtLeaderboard.length === 0" class="rounded-lg border border-gray-200 bg-white py-12 text-center">
        <p class="text-gray-500">No district rankings available yet.</p>
      </div>
      <div v-else class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div class="border-b border-gray-200 bg-purple-50 px-6 py-4">
          <h2 class="text-lg font-semibold text-gray-900">District Rankings</h2>
          <p class="mt-1 text-xs text-gray-500">
            Ranked by total grade points across all events
          </p>
          <p v-if="dataCapturedAt" class="mt-1 text-xs text-gray-500">
            Last updated: {{ formatTimestamp(dataCapturedAt) }}
            <span v-if="cached" class="ml-2 rounded bg-purple-100 px-2 py-0.5 text-purple-700">Cached</span>
          </p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Rank</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">District/Location</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Total Grade Points</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr
                v-for="(entry, index) in districtLeaderboard"
                :key="entry.location"
                class="transition-colors hover:bg-gray-50"
              >
                <td class="whitespace-nowrap px-4 py-3">
                  <div class="flex items-center">
                    <span v-if="index === 0" class="text-xl">🥇</span>
                    <span v-else-if="index === 1" class="text-xl">🥈</span>
                    <span v-else-if="index === 2" class="text-xl">🥉</span>
                    <span v-else class="text-sm font-semibold text-gray-900">{{ entry.rank }}</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="text-sm font-medium text-gray-900">{{ entry.location || 'Unknown' }}</div>
                </td>
                <td class="whitespace-nowrap px-4 py-3">
                  <div class="text-sm font-semibold text-blue-600">{{ entry.totalGradePoints.toFixed(1) }}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'

// Types
interface LeaderboardEntry {
  registrationId?: string
  schoolId?: string
  location?: string
  totalGradePoints?: number
  teamName?: string | null
  studentName?: string | null
  schoolName?: string | null
  schoolCode?: string | null
  eventName?: string
  eventType?: string
  ageCategory?: string
  totalScore: number
  normalizedScore: number
  grade: string
  gradePoint: number
  rank: number
}

interface EventLeaderboard {
  event: {
    id: string
    name: string
    eventType: string
    ageCategory: string
  }
  leaderboard: LeaderboardEntry[]
  totalResults: number
}

interface ApiResponse<T> {
  success: boolean
  leaderboard?: T[]
  events?: EventLeaderboard[]
  cached?: boolean
  dataCapturedAt?: number
}

definePageMeta({
  layout: 'admin'
})

// State
type LeaderboardTab = 'events' | 'schools' | 'districts'

const leaderboardTab = ref<LeaderboardTab>('events')
const leaderboardLoading = ref(false)
const purgingAdminCache = ref(false)
const eventLeaderboards = ref<EventLeaderboard[]>([])
const schoolLeaderboard = ref<LeaderboardEntry[]>([])
const districtLeaderboard = ref<LeaderboardEntry[]>([])
const cached = ref(false)
const dataCapturedAt = ref<number | null>(null)

// Event leaderboard state
const fullEventResults = ref<Record<string, LeaderboardEntry[]>>({})
const loadingFullResults = ref<Record<string, boolean>>({})
const viewingFullEventId = ref<string | null>(null) // Track which event is being viewed in full mode

// Generic leaderboard fetcher
const fetchLeaderboard = async <T extends LeaderboardEntry>(
  type: 'event' | 'school' | 'district',
  targetRef: Ref<T[]>
) => {
  try {
    const response = await $fetch<ApiResponse<T>>('/api/leaderboard', {
      params: {
        type,
        context: 'admin',
        limit: 500, // Show all in admin view
      },
    })
    
    if (response.success) {
      targetRef.value = response.leaderboard || []
      cached.value = response.cached || false
      dataCapturedAt.value = response.dataCapturedAt || null
    }
  } catch (err) {
    console.error(`Failed to fetch ${type} leaderboard:`, err)
    targetRef.value = []
  }
}

const fetchEventLeaderboards = async () => {
  try {
    const response = await $fetch<ApiResponse<LeaderboardEntry> & { events?: EventLeaderboard[] }>('/api/leaderboard/events', {
      params: {
        context: 'admin',
        resultsLimit: 5,
      },
    })
    
    if (response.success) {
      eventLeaderboards.value = response.events || []
      fullEventResults.value = {}
      loadingFullResults.value = {}
      viewingFullEventId.value = null
      cached.value = response.cached || false
      dataCapturedAt.value = response.dataCapturedAt || null
    }
  } catch (err) {
    console.error('Failed to fetch event leaderboards:', err)
    eventLeaderboards.value = []
  }
}

const loadLeaderboards = async () => {
  leaderboardLoading.value = true
  cached.value = false
  dataCapturedAt.value = null
  
  try {
    switch (leaderboardTab.value) {
      case 'events':
        await fetchEventLeaderboards()
        break
      case 'schools':
        await fetchLeaderboard('school', schoolLeaderboard)
        break
      case 'districts':
        await fetchLeaderboard('district', districtLeaderboard)
        break
    }
  } finally {
    leaderboardLoading.value = false
  }
}

const purgeCache = async (context: 'admin') => {
  if (!confirm(`Are you sure you want to purge ${context} leaderboard cache? This will force fresh data to be fetched.`)) {
    return
  }

  purgingAdminCache.value = true

  try {
    await $fetch('/api/leaderboard/purge-cache', {
      method: 'POST',
      body: {
        context,
      },
    })
    // Reload data after purging cache
    // Clear all local state to ensure fresh data
    eventLeaderboards.value = []
    schoolLeaderboard.value = []
    districtLeaderboard.value = []
    fullEventResults.value = {}
    viewingFullEventId.value = null
    cached.value = false
    dataCapturedAt.value = null
    
    // Reload current tab
    await loadLeaderboards()
  } catch (err) {
    console.error(`Failed to purge ${context} cache:`, err)
    alert(`Failed to purge ${context} cache. Please try again.`)
  } finally {
    purgingAdminCache.value = false
  }
}


const getGradeColor = (grade: string) => {
  const colors: Record<string, string> = {
    'A+': 'bg-green-100 text-green-800',
    'A': 'bg-green-100 text-green-800',
    'B+': 'bg-blue-100 text-blue-800',
    'B': 'bg-blue-100 text-blue-800',
    'C+': 'bg-yellow-100 text-yellow-800',
    'C': 'bg-yellow-100 text-yellow-800',
    'D+': 'bg-orange-100 text-orange-800',
    'D': 'bg-orange-100 text-orange-800',
    'E': 'bg-red-100 text-red-800',
  }
  return colors[grade] || 'bg-gray-100 text-gray-800'
}

const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

// Get displayed results for an event (first 5 from backend or full if expanded)
const getDisplayedResults = (eventLeaderboard: EventLeaderboard): LeaderboardEntry[] => {
  const eventId = eventLeaderboard.event.id
  return fullEventResults.value[eventId] || eventLeaderboard.leaderboard || []
}

// Show "Show All" whenever the event has results (and we're not already showing full data)
const shouldShowAllButton = (eventLeaderboard: EventLeaderboard): boolean => {
  const eventId = eventLeaderboard.event.id
  if (fullEventResults.value[eventId]) return false
  return eventLeaderboard.totalResults > (eventLeaderboard.leaderboard?.length || 0)
}

// Show all results for a single event only. Fetches only that event's data; does not hold other events.
const showAllForEvent = async (eventLeaderboard: EventLeaderboard) => {
  const eventId = eventLeaderboard.event.id
  if (fullEventResults.value[eventId] || loadingFullResults.value[eventId]) {
    return
  }

  loadingFullResults.value[eventId] = true
  try {
    const response = await $fetch<ApiResponse<LeaderboardEntry>>('/api/leaderboard', {
      params: {
        type: 'event',
        context: 'admin',
        eventId,
        limit: 1000,
      },
    })
    
    if (response.success && response.leaderboard) {
      fullEventResults.value[eventId] = response.leaderboard
      // Replace list with only this event — do not hold other events' data
      eventLeaderboards.value = [{
        event: eventLeaderboard.event,
        leaderboard: [],
        totalResults: response.leaderboard.length,
      }]
      viewingFullEventId.value = eventId
    }
  } catch (err) {
    console.error(`Failed to fetch full results for event ${eventId}:`, err)
  } finally {
    loadingFullResults.value[eventId] = false
  }
}

const backToAllEvents = () => {
  viewingFullEventId.value = null
  loadLeaderboards()
}

watch(leaderboardTab, () => {
  loadLeaderboards()
})

onMounted(() => {
  loadLeaderboards()
})
</script>
