<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <NuxtLink to="/" class="text-purple-600 hover:text-purple-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </NuxtLink>
            <h1 class="text-2xl font-bold text-gray-900">Leaderboards</h1>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Tabs -->
      <div class="mb-6">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8">
            <button
              @click="activeTab = 'overall'"
              :class="[
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === 'overall'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              Overall Rankings
            </button>
            <button
              @click="activeTab = 'events'"
              :class="[
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === 'events'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              By Event
            </button>
          </nav>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12 text-gray-500">
        <svg class="animate-spin h-8 w-8 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading leaderboards...
      </div>

      <!-- Overall Leaderboard -->
      <div v-else-if="activeTab === 'overall'">
        <div v-if="overallLeaderboard.length === 0" class="text-center py-12 text-gray-500">
          <p>No rankings available yet.</p>
        </div>
        <div v-else class="bg-white rounded-lg shadow overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 bg-purple-50">
            <h2 class="text-lg font-semibold text-gray-900">Overall Rankings</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team/School</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="(entry, index) in overallLeaderboard"
                  :key="entry.registrationId"
                  class="hover:bg-gray-50"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <span
                        v-if="index === 0"
                        class="text-2xl"
                      >🥇</span>
                      <span
                        v-else-if="index === 1"
                        class="text-2xl"
                      >🥈</span>
                      <span
                        v-else-if="index === 2"
                        class="text-2xl"
                      >🥉</span>
                      <span
                        v-else
                        class="text-lg font-semibold text-gray-900"
                      >{{ entry.rank }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ entry.teamName || `Registration #${entry.registrationId.slice(0, 8)}` }}
                    </div>
                    <div class="text-sm text-gray-500">{{ entry.schoolName }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ entry.eventName }}</div>
                    <div class="text-xs text-gray-500">{{ entry.eventType }} • {{ entry.ageCategory }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-semibold text-gray-900">{{ entry.normalizedScore.toFixed(1) }}%</div>
                    <div class="text-xs text-gray-500">{{ entry.totalScore }}/{{ entry.judgeCount * 10 }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="px-2 py-1 text-xs font-semibold rounded-full"
                      :class="getGradeColor(entry.grade)"
                    >
                      {{ entry.grade }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Events Leaderboard -->
      <div v-else-if="activeTab === 'events'">
        <div v-if="eventLeaderboards.length === 0" class="text-center py-12 text-gray-500">
          <p>No event rankings available yet.</p>
        </div>
        <div v-else class="space-y-6">
          <div
            v-for="eventLeaderboard in eventLeaderboards"
            :key="eventLeaderboard.event.id"
            class="bg-white rounded-lg shadow overflow-hidden"
          >
            <div class="px-6 py-4 border-b border-gray-200 bg-purple-50">
              <h2 class="text-lg font-semibold text-gray-900">{{ eventLeaderboard.event.name }}</h2>
              <p class="text-sm text-gray-600 mt-1">{{ eventLeaderboard.event.eventType }} • {{ eventLeaderboard.event.ageCategory }}</p>
            </div>
            <div v-if="eventLeaderboard.leaderboard.length === 0" class="px-6 py-8 text-center text-gray-500">
              No rankings available for this event yet.
            </div>
            <div v-else class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team/School</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr
                    v-for="(entry, index) in eventLeaderboard.leaderboard"
                    :key="entry.registrationId"
                    class="hover:bg-gray-50"
                  >
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <span
                          v-if="index === 0"
                          class="text-2xl"
                        >🥇</span>
                        <span
                          v-else-if="index === 1"
                          class="text-2xl"
                        >🥈</span>
                        <span
                          v-else-if="index === 2"
                          class="text-2xl"
                        >🥉</span>
                        <span
                          v-else
                          class="text-lg font-semibold text-gray-900"
                        >{{ entry.rank }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ entry.teamName || `Registration #${entry.registrationId.slice(0, 8)}` }}
                      </div>
                      <div class="text-sm text-gray-500">{{ entry.schoolName }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-semibold text-gray-900">{{ entry.normalizedScore.toFixed(1) }}%</div>
                      <div class="text-xs text-gray-500">{{ entry.totalScore }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        class="px-2 py-1 text-xs font-semibold rounded-full"
                        :class="getGradeColor(entry.grade)"
                      >
                        {{ entry.grade }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
const activeTab = ref<'overall' | 'events'>('overall')
const loading = ref(true)
const overallLeaderboard = ref<any[]>([])
const eventLeaderboards = ref<any[]>([])

const fetchOverallLeaderboard = async () => {
  try {
    const response = await $fetch('/api/leaderboard', {
      params: {
        type: 'overall',
        limit: 10,
      },
    })
    if (response.success) {
      overallLeaderboard.value = response.leaderboard || []
    }
  } catch (err) {
    console.error('Failed to fetch overall leaderboard:', err)
  }
}

const fetchEventLeaderboards = async () => {
  try {
    const response = await $fetch('/api/leaderboard/events')
    if (response.success) {
      eventLeaderboards.value = response.events || []
    }
  } catch (err) {
    console.error('Failed to fetch event leaderboards:', err)
  }
}

const loadLeaderboards = async () => {
  loading.value = true
  await Promise.all([fetchOverallLeaderboard(), fetchEventLeaderboards()])
  loading.value = false
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
    'F': 'bg-red-100 text-red-800',
  }
  return colors[grade] || 'bg-gray-100 text-gray-800'
}

watch(activeTab, () => {
  loadLeaderboards()
})

onMounted(() => {
  loadLeaderboards()
})
</script>
