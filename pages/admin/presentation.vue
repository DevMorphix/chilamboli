<template>
  <div 
    ref="containerRef"
    class="min-h-screen w-screen bg-gradient-to-br from-gray-50 to-white relative overflow-hidden flex items-center justify-center p-8"
    style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;"
  >
    <!-- Main Content - Centered with breathing room -->
    <div class="w-full max-w-4xl mx-auto">
      <Transition
        enter-active-class="fade-enter-active"
        leave-active-class="fade-leave-active"
        enter-from-class="fade-enter-from"
        leave-to-class="fade-leave-to"
        mode="out-in"
      >
        <!-- District Leaderboard -->
        <div
          v-if="currentView === 'district'"
          key="district"
          class="w-full"
        >
          <!-- Title -->
          <div class="text-center mb-8 animate-fade-in">
            <h1 class="text-4xl font-bold text-gray-900 mb-2 tracking-tight animate-pulse-subtle" style="font-family: 'Poppins', sans-serif;">
              District Rankings
            </h1>
            <p class="text-base text-gray-600 font-medium">All Districts by Grade Points</p>
          </div>

          <!-- Leaderboard -->
          <div v-if="paginatedDistrictLeaderboard.length === 0" class="text-center py-16">
            <p class="text-lg text-gray-400 font-medium">No rankings available</p>
          </div>
          
          <div v-else class="space-y-3">
            <div
              v-for="(entry, index) in paginatedDistrictLeaderboard"
              :key="entry.location"
              class="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 px-6 py-4 animate-slide-in"
              :style="{ animationDelay: `${index * 0.05}s` }"
              :class="{
                'bg-gradient-to-r from-amber-50 via-amber-50/50 to-white border-amber-300 shadow-md animate-glow': entry.rank === 1,
                'bg-gradient-to-r from-gray-50 via-gray-50/50 to-white border-gray-300 shadow-md': entry.rank === 2,
                'bg-gradient-to-r from-orange-50 via-orange-50/50 to-white border-orange-300 shadow-md': entry.rank === 3,
              }"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-6 flex-1 min-w-0">
                  <!-- Rank -->
                  <div class="flex-shrink-0">
                    <div
                      v-if="entry.rank === 1"
                      class="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg "
                    >
                      <span class="text-xl font-bold text-white">1</span>
                    </div>
                    <div
                      v-else-if="entry.rank === 2"
                      class="w-14 h-14 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-lg"
                    >
                      <span class="text-xl font-bold text-white">2</span>
                    </div>
                    <div
                      v-else-if="entry.rank === 3"
                      class="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg"
                    >
                      <span class="text-xl font-bold text-white">3</span>
                    </div>
                    <div
                      v-else
                      class="w-12 h-12 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center"
                    >
                      <span class="text-lg font-semibold text-gray-700">{{ entry.rank }}</span>
                    </div>
                  </div>
                  
                  <!-- District Name -->
                  <div class="flex-1 min-w-0">
                    <h3 class="text-xl font-semibold text-gray-900 mb-0.5 truncate animate-text-shimmer" style="font-family: 'Poppins', sans-serif;">
                      {{ entry.location }}
                    </h3>
                    <p class="text-xs text-gray-500 font-normal">District</p>
                  </div>
                </div>
                
                <!-- Grade Points -->
                <div class="text-right ml-6 flex-shrink-0">
                  <div class="text-3xl font-bold text-gray-900 mb-0.5 font-mono tabular-nums animate-count-up" style="font-family: 'JetBrains Mono', 'SF Mono', Monaco, monospace;">
                    {{ entry.totalGradePoints.toFixed(1) }}
                  </div>
                  <p class="text-xs text-gray-500 uppercase tracking-wider font-medium">Points</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- School Leaderboard -->
        <div
          v-if="currentView === 'school'"
          key="school"
          class="w-full"
        >
          <!-- Title -->
          <div class="text-center mb-8 animate-fade-in">
            <h1 class="text-4xl font-bold text-gray-900 mb-2 tracking-tight animate-pulse-subtle" style="font-family: 'Poppins', sans-serif;">
              School Rankings
            </h1>
            <p class="text-base text-gray-600 font-medium">All Schools by Grade Points</p>
          </div>

          <!-- Leaderboard -->
          <div v-if="paginatedSchoolLeaderboard.length === 0" class="text-center py-16">
            <p class="text-lg text-gray-400 font-medium">No rankings available</p>
          </div>
          
          <div v-else class="space-y-3">
            <div
              v-for="(entry, index) in paginatedSchoolLeaderboard"
              :key="entry.schoolId"
              class="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 px-6 py-4 animate-slide-in"
              :style="{ animationDelay: `${index * 0.05}s` }"
              :class="{
                'bg-gradient-to-r from-amber-50 via-amber-50/50 to-white border-amber-300 shadow-md animate-glow': entry.rank === 1,
                'bg-gradient-to-r from-gray-50 via-gray-50/50 to-white border-gray-300 shadow-md': entry.rank === 2,
                'bg-gradient-to-r from-orange-50 via-orange-50/50 to-white border-orange-300 shadow-md': entry.rank === 3,
              }"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-6 flex-1 min-w-0">
                  <!-- Rank -->
                  <div class="flex-shrink-0">
                    <div
                      v-if="entry.rank === 1"
                      class="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg "
                    >
                      <span class="text-xl font-bold text-white">1</span>
                    </div>
                    <div
                      v-else-if="entry.rank === 2"
                      class="w-14 h-14 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-lg"
                    >
                      <span class="text-xl font-bold text-white">2</span>
                    </div>
                    <div
                      v-else-if="entry.rank === 3"
                      class="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg"
                    >
                      <span class="text-xl font-bold text-white">3</span>
                    </div>
                    <div
                      v-else
                      class="w-12 h-12 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center"
                    >
                      <span class="text-lg font-semibold text-gray-700">{{ entry.rank }}</span>
                    </div>
                  </div>
                  
                  <!-- School Name -->
                  <div class="flex-1 min-w-0">
                    <h3 class="text-xl font-semibold text-gray-900 mb-0.5 truncate animate-text-shimmer" style="font-family: 'Poppins', sans-serif;">
                      {{ entry.schoolName }}
                    </h3>
                    <p v-if="entry.schoolCode" class="text-xs text-gray-500 font-normal">{{ entry.schoolCode }}</p>
                    <p v-else class="text-xs text-gray-500 font-normal">School</p>
                  </div>
                </div>
                
                <!-- Grade Points -->
                <div class="text-right ml-6 flex-shrink-0">
                  <div class="text-3xl font-bold text-gray-900 mb-0.5 font-mono tabular-nums animate-count-up" style="font-family: 'JetBrains Mono', 'SF Mono', Monaco, monospace;">
                    {{ entry.totalGradePoints.toFixed(1) }}
                  </div>
                  <p class="text-xs text-gray-500 uppercase tracking-wider font-medium">Points</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Event-wise results (1st, 2nd, 3rd only; no points) -->
        <div
          v-if="currentView === 'events'"
          key="events"
          class="w-full"
        >
          <template v-if="currentEventLeaderboard">
            <div class="text-center mb-8 animate-fade-in">
              <h1 class="text-4xl font-bold text-gray-900 mb-2 tracking-tight animate-pulse-subtle" style="font-family: 'Poppins', sans-serif;">
                {{ currentEventLeaderboard.event.name }}
              </h1>
              <p class="text-base text-gray-600 font-medium">{{ currentEventLeaderboard.event.eventType }} • {{ currentEventLeaderboard.event.ageCategory }}</p>
            </div>
            <div v-if="currentEventLeaderboard.leaderboard.length === 0" class="text-center py-16">
              <p class="text-lg text-gray-400 font-medium">No results for this event yet.</p>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="(entry, index) in currentEventLeaderboard.leaderboard"
                :key="entry.rank"
                class="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 px-6 py-4 animate-slide-in"
                :style="{ animationDelay: `${index * 0.05}s` }"
                :class="{
                  'bg-gradient-to-r from-amber-50 via-amber-50/50 to-white border-amber-300 shadow-md animate-glow': entry.rank === 1,
                  'bg-gradient-to-r from-gray-50 via-gray-50/50 to-white border-gray-300 shadow-md': entry.rank === 2,
                  'bg-gradient-to-r from-orange-50 via-orange-50/50 to-white border-orange-300 shadow-md': entry.rank === 3,
                }"
              >
                <div class="flex items-center gap-6">
                  <div
                    v-if="entry.rank === 1"
                    class="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg flex-shrink-0"
                  >
                    <span class="text-xl font-bold text-white">1</span>
                  </div>
                  <div
                    v-else-if="entry.rank === 2"
                    class="w-14 h-14 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-lg flex-shrink-0"
                  >
                    <span class="text-xl font-bold text-white">2</span>
                  </div>
                  <div
                    v-else-if="entry.rank === 3"
                    class="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg flex-shrink-0"
                  >
                    <span class="text-xl font-bold text-white">3</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-xl font-semibold text-gray-900 truncate animate-text-shimmer" style="font-family: 'Poppins', sans-serif;">
                      {{ currentEventLeaderboard.event.eventType === 'Individual' ? (entry.studentName || '–') : (entry.teamName || '–') }}
                    </h3>
                    <p v-if="entry.schoolName" class="text-sm text-gray-600 mt-0.5 truncate">{{ entry.schoolName }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <div v-else class="text-center py-16">
            <p class="text-lg text-gray-400 font-medium">No event results available.</p>
          </div>
        </div>
      </Transition>
    </div>

    <!-- View Indicator -->
    <div class="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20">
      <div class="flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-full px-5 py-3 border border-gray-200 shadow-lg">
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-gray-600">Districts</span>
          <div class="flex items-center gap-1">
            <div 
              v-for="i in totalDistrictPages"
              :key="`district-${i}`"
              class="h-2 rounded-full transition-all duration-500 ease-out"
              :class="currentView === 'district' && currentDistrictPage === i - 1 ? 'bg-blue-600 w-8' : 'bg-gray-300 w-2'"
            ></div>
          </div>
        </div>
        <div class="h-4 w-px bg-gray-300"></div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-gray-600">Schools</span>
          <div class="flex items-center gap-1">
            <div 
              v-for="i in totalSchoolPages"
              :key="`school-${i}`"
              class="h-2 rounded-full transition-all duration-500 ease-out"
              :class="currentView === 'school' && currentSchoolPage === i - 1 ? 'bg-green-600 w-8' : 'bg-gray-300 w-2'"
            ></div>
          </div>
        </div>
        <template v-if="totalEventsPages > 0">
          <div class="h-4 w-px bg-gray-300"></div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-medium text-gray-600">Events</span>
            <div class="flex items-center gap-1">
              <div 
                v-for="i in totalEventsPages"
                :key="`events-${i}`"
                class="h-2 rounded-full transition-all duration-500 ease-out"
                :class="currentView === 'events' && currentEventsPage === i - 1 ? 'bg-purple-600 w-8' : 'bg-gray-300 w-2'"
              ></div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false // No layout for presentation mode
})

useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700;800&family=JetBrains+Mono:wght@400;700&display=swap' }
  ]
})

interface EventLeaderboardEntry {
  rank: number
  teamName: string | null
  studentName: string | null
  schoolName: string | null
}
interface EventLeaderboardItem {
  event: { id: string; name: string; eventType: string; ageCategory: string }
  leaderboard: EventLeaderboardEntry[]
}
const containerRef = ref<HTMLElement | null>(null)
const districtLeaderboard = ref<any[]>([])
const schoolLeaderboard = ref<any[]>([])
const eventLeaderboards = ref<EventLeaderboardItem[]>([])
const loading = ref(false)
const lastUpdated = ref<number | null>(null)
const currentView = ref<'district' | 'school' | 'events'>('district')
const currentDistrictPage = ref(0)
const currentSchoolPage = ref(0)
const currentEventsPage = ref(0)
const itemsPerPage = 5
let pollInterval: NodeJS.Timeout | null = null
let viewCycleInterval: NodeJS.Timeout | null = null

// Computed properties for pagination
const totalDistrictPages = computed(() => Math.ceil(districtLeaderboard.value.length / itemsPerPage) || 1)
const totalSchoolPages = computed(() => Math.ceil(schoolLeaderboard.value.length / itemsPerPage) || 1)
const totalEventsPages = computed(() => eventLeaderboards.value.length || 1)
const currentEventLeaderboard = computed(() => eventLeaderboards.value[currentEventsPage.value] ?? null)

const paginatedDistrictLeaderboard = computed(() => {
  const start = currentDistrictPage.value * itemsPerPage
  const end = start + itemsPerPage
  return districtLeaderboard.value.slice(start, end)
})

const paginatedSchoolLeaderboard = computed(() => {
  const start = currentSchoolPage.value * itemsPerPage
  const end = start + itemsPerPage
  return schoolLeaderboard.value.slice(start, end)
})

const fetchDistrictLeaderboard = async () => {
  try {
    const response = await $fetch('/api/leaderboard', {
      params: {
        type: 'district',
        context: 'presentation', // Presentation context - only shows completed events
        // No limit - fetch all districts
      },
    }) as any
    
    if (response.success) {
      districtLeaderboard.value = response.leaderboard || []
    }
  } catch (err) {
    console.error('Failed to fetch district leaderboard:', err)
    districtLeaderboard.value = []
  }
}

const fetchSchoolLeaderboard = async () => {
  try {
    const response = await $fetch('/api/leaderboard', {
      params: {
        type: 'school',
        context: 'presentation', // Presentation context - only shows completed events
        // No limit - fetch all schools
      },
    }) as any
    
    if (response.success) {
      schoolLeaderboard.value = response.leaderboard || []
    }
  } catch (err) {
    console.error('Failed to fetch school leaderboard:', err)
    schoolLeaderboard.value = []
  }
}

const fetchEventLeaderboards = async () => {
  try {
    const response = await $fetch('/api/leaderboard/events', {
      params: {
        context: 'presentation', // Only completed events
        resultsLimit: 3, // 1st, 2nd, 3rd only
      },
    }) as { success: boolean; events?: EventLeaderboardItem[] }
    if (response.success && response.events) {
      eventLeaderboards.value = response.events
    } else {
      eventLeaderboards.value = []
    }
  } catch (err) {
    console.error('Failed to fetch event leaderboards:', err)
    eventLeaderboards.value = []
  }
}

const loadLeaderboards = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchDistrictLeaderboard(),
      fetchSchoolLeaderboard(),
      fetchEventLeaderboards(),
    ])
    lastUpdated.value = Date.now()
  } finally {
    loading.value = false
  }
}

const cycleViews = () => {
  if (currentView.value === 'district') {
    if (currentDistrictPage.value < totalDistrictPages.value - 1) {
      currentDistrictPage.value++
    } else {
      currentView.value = 'school'
      currentDistrictPage.value = 0
    }
  } else if (currentView.value === 'school') {
    if (currentSchoolPage.value < totalSchoolPages.value - 1) {
      currentSchoolPage.value++
    } else {
      // Only show events phase when there are published events
      currentSchoolPage.value = 0
      if (totalEventsPages.value > 0) {
        currentView.value = 'events'
      } else {
        currentView.value = 'district'
      }
    }
  } else {
    // events view (only reached when we have published events)
    if (currentEventsPage.value < totalEventsPages.value - 1) {
      currentEventsPage.value++
    } else {
      currentView.value = 'district'
      currentEventsPage.value = 0
    }
  }
}

const requestFullscreen = () => {
  const elem = containerRef.value || document.documentElement
  
  if (elem.requestFullscreen) {
    elem.requestFullscreen().catch(err => {
      console.error('Error attempting to enable fullscreen:', err)
    })
  } else if ((elem as any).webkitRequestFullscreen) {
    (elem as any).webkitRequestFullscreen()
  } else if ((elem as any).msRequestFullscreen) {
    (elem as any).msRequestFullscreen()
  }
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  // Load immediately
  loadLeaderboards()
  
  // Request fullscreen
  requestFullscreen()
  
  // Set up polling every 1 minute (60000 ms)
  pollInterval = setInterval(() => {
    loadLeaderboards()
  }, 60 * 1000)
  
  // Cycle views every 10 seconds
  viewCycleInterval = setInterval(() => {
    cycleViews()
  }, 10 * 1000)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
  if (viewCycleInterval) {
    clearInterval(viewCycleInterval)
    viewCycleInterval = null
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.95);
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse-subtle {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.85;
  }
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  50% {
    box-shadow: 0 10px 15px -3px rgba(251, 191, 36, 0.3), 0 4px 6px -2px rgba(251, 191, 36, 0.2);
  }
}

@keyframes text-shimmer {
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
}

@keyframes count-up {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}

.animate-slide-in {
  animation: slide-in 0.5s ease-out both;
}

.animate-pulse-subtle {
  animation: pulse-subtle 3s ease-in-out infinite;
}

.animate-glow {
  animation: glow 2s ease-in-out infinite;
}

.animate-text-shimmer {
  background: linear-gradient(90deg, #111827 0%, #374151 50%, #111827 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: text-shimmer 3s linear infinite;
}

.animate-count-up {
  animation: count-up 0.6s ease-out;
}
</style>