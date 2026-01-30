<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <h1 class="text-xl font-bold text-gray-900 truncate">{{ judge?.judgeName || 'Judge Dashboard' }}</h1>
            <p v-if="event" class="text-xs text-gray-600 mt-0.5 truncate">{{ event.name }}</p>
          </div>
          <button
            @click="handleLogout"
            class="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
            title="Logout"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="w-full md:max-w-7xl md:mx-auto px-4 py-4 pb-20 flex-1">
      <div v-if="loading" class="text-center py-12 text-gray-500">
        <svg class="animate-spin h-8 w-8 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-sm">Loading...</p>
      </div>

      <div v-else-if="!event" class="text-center py-12 px-4">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-gray-600 text-base font-medium">No event assigned yet</p>
        <p class="text-gray-500 text-sm mt-2">Contact the administrator to get assigned to an event.</p>
      </div>

      <div v-else>
        <!-- Progress Summary - Mobile Friendly -->
        <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-sm font-semibold text-gray-700">Progress</h2>
            <span class="text-sm font-bold text-gray-900">{{ judgedCount }}/{{ registrations.length }}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-green-500 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${progressPercentage}%` }"
            ></div>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            {{ event.pendingRegistrations }} pending judgment{{ event.pendingRegistrations !== 1 ? 's' : '' }}
          </p>
        </div>

        <!-- Registrations Grid - Mobile First -->
        <div v-if="registrations.length === 0" class="text-center py-12">
          <p class="text-gray-500 text-sm">No registrations found for this event.</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="registration in registrations"
            :key="registration.id"
            @click="openJudgmentModal(registration)"
            class="bg-white rounded-lg shadow-sm p-4 cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
            :class="{
              'border-2 border-green-500 bg-green-50': registration.judgment,
              'border border-gray-200': !registration.judgment
            }"
          >
            <!-- Chest Number and Judge Status Circles -->
            <div class="flex items-center justify-between mb-3">
              <div class="flex-1 min-w-0">
                <div class="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                  {{ registration.chestNumber || `#${registration.id.slice(0, 8).toUpperCase()}` }}
                </div>
                <p class="text-xs text-gray-500">
                  {{ registration.participantCount }} participant{{ registration.participantCount !== 1 ? 's' : '' }}
                </p>
              </div>
              
              <!-- Judge Status Circles - Right Side -->
              <div class="flex items-center gap-1.5 flex-shrink-0 ml-3">
                <div
                  v-for="(judgeStatus, index) in (registration.judgeStatus || [])"
                  :key="judgeStatus.judgeId"
                  class="w-4 h-4 rounded-full border-2 flex-shrink-0"
                  :class="judgeStatus.hasJudged ? 'bg-green-500 border-green-600' : 'bg-orange-400 border-orange-500'"
                  :title="judgeStatus.hasJudged ? `${judgeStatus.judgeName} - Completed` : `${judgeStatus.judgeName} - Pending`"
                ></div>
                <div v-if="!registration.judgeStatus || registration.judgeStatus.length === 0" class="flex gap-2">
                  <div
                    class="w-4 h-4 rounded-full border-2 flex-shrink-0"
                    :class="registration.judgment ? 'bg-green-500 border-green-600' : 'bg-orange-400 border-orange-500'"
                    :title="registration.judgment ? 'Completed' : 'Pending'"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Score Display -->
            <div v-if="registration.judgment" class="pt-2 border-t border-gray-200">
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-600">Score:</span>
                <span class="text-base font-bold text-green-700">{{ registration.judgment.score }}/50</span>
              </div>
            </div>
            <div v-else class="pt-2 border-t border-gray-200">
              <span class="text-xs text-orange-600 font-medium">Tap to judge</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Judgment Modal -->
    <JudgmentModal
      :registration="selectedRegistration"
      :submitting="submitting"
      @close="closeJudgmentModal"
      @submit="handleJudgmentSubmit"
    />

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { judge: judgeRef, checkAuth } = useJudge()

const judge = ref<any>(null)
const event = ref<any>(null)
const registrations = ref<any[]>([])
const loading = ref(false)
const selectedRegistration = ref<any>(null)
const submitting = ref(false)

const judgedCount = computed(() => {
  return registrations.value.filter((r) => r.judgment).length
})

const progressPercentage = computed(() => {
  if (registrations.value.length === 0) return 0
  return Math.round((judgedCount.value / registrations.value.length) * 100)
})

const fetchDashboard = async () => {
  if (!judge.value?.id) return
  
  loading.value = true
  try {
    const response = await $fetch('/api/judge/dashboard', {
      params: {
        judgeId: judge.value.id,
      },
    })
    if (response.success) {
      event.value = response.event
      const regs = response.registrations || []
      
      // Reconstruct judgeStatus array from event.judges and registration.judgedBy
      // This optimizes payload by avoiding repetition of judge data
      const eventJudges = event.value?.judges || []
      registrations.value = regs.map((reg: any) => {
        const judgedBySet = new Set(reg.judgedBy || [])
        return {
          ...reg,
          judgeStatus: eventJudges.map((judge: any) => ({
            judgeId: judge.judgeId,
            judgeName: judge.judgeName,
            hasJudged: judgedBySet.has(judge.judgeId),
          })),
        }
      })
    }
  } catch (err: any) {
    console.error('Failed to fetch dashboard:', err)
    if (err.statusCode === 401 || err.statusCode === 403) {
      router.push('/judge/login')
    }
  } finally {
    loading.value = false
  }
}

const openJudgmentModal = (registration: any) => {
  selectedRegistration.value = registration
}

const closeJudgmentModal = () => {
  selectedRegistration.value = null
}

const handleJudgmentSubmit = async (score: number, comments: string | null) => {
  if (!selectedRegistration.value) {
    return
  }

  submitting.value = true
  try {
    const response = await $fetch('/api/judge/judgments', {
      method: 'POST',
      body: {
        judgeId: judge.value?.id,
        registrationId: selectedRegistration.value.id,
        score: score,
        comments: comments,
      },
    })
    if (response.success) {
      const regIndex = registrations.value.findIndex((r) => r.id === selectedRegistration.value.id)
      if (regIndex !== -1) {
        const registration = registrations.value[regIndex]
        registration.judgment = {
          id: response.judgment.id,
          score: response.judgment.score,
          comments: response.judgment.comments,
          createdAt: response.judgment.createdAt,
          updatedAt: response.judgment.updatedAt,
        }
        
        // Update judgedBy array if judge ID is not already included
        const judgeId = judge.value?.id
        if (judgeId && registration.judgedBy && !registration.judgedBy.includes(judgeId)) {
          registration.judgedBy.push(judgeId)
        } else if (judgeId && !registration.judgedBy) {
          registration.judgedBy = [judgeId]
        }
        
        // Reconstruct judgeStatus from updated judgedBy
        const eventJudges = event.value?.judges || []
        const judgedBySet = new Set(registration.judgedBy || [])
        registration.judgeStatus = eventJudges.map((judgeItem: any) => ({
          judgeId: judgeItem.judgeId,
          judgeName: judgeItem.judgeName,
          hasJudged: judgedBySet.has(judgeItem.judgeId),
        }))
      }
      if (event.value) {
        const wasJudged = selectedRegistration.value.judgment !== null
        if (!wasJudged) {
          event.value.judgedRegistrations++
          event.value.pendingRegistrations--
        }
      }
      closeJudgmentModal()
    }
  } catch (err: any) {
    console.error('Failed to submit judgment:', err)
    alert(err.data?.message || 'Failed to submit judgment')
  } finally {
    submitting.value = false
  }
}

const handleLogout = () => {
  if (import.meta.client) {
    localStorage.removeItem('judge')
  }
  router.push('/judge/login')
}

onMounted(async () => {
  if (!checkAuth()) {
    return
  }
  if (import.meta.client) {
    const storedJudge = localStorage.getItem('judge')
    if (storedJudge) {
      judge.value = JSON.parse(storedJudge)
      await fetchDashboard()
    } else {
      router.push('/judge/login')
    }
  }
})
</script>
