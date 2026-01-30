<template>
  <div class="min-h-screen bg-gray-50 grid grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <NuxtLink to="/judge/dashboard" class="text-purple-600 hover:text-purple-700 text-sm mb-2 inline-block">
              ← Back to Dashboard
            </NuxtLink>
            <h1 class="text-2xl font-bold text-gray-900">{{ event?.name || 'Event Judging' }}</h1>
            <p v-if="event" class="text-sm text-gray-600 mt-1">{{ event.eventType }} • {{ event.ageCategory }}</p>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div v-if="loading" class="text-center py-12 text-gray-500">
        <svg class="animate-spin h-8 w-8 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading registrations...
      </div>

      <div v-else-if="registrations.length === 0" class="text-center py-12">
        <p class="text-gray-600 text-lg">No registrations found for this event.</p>
      </div>

      <div v-else class="space-y-6">
        <!-- Progress Summary -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Judging Progress</h3>
              <p class="text-sm text-gray-600 mt-1">
                {{ judgedCount }} of {{ registrations.length }} registrations judged
              </p>
            </div>
            <div class="w-48 bg-gray-200 rounded-full h-3">
              <div
                class="bg-purple-600 h-3 rounded-full transition-all duration-300"
                :style="{ width: `${(judgedCount / registrations.length) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Registrations List -->
        <div class="space-y-4">
          <div
            v-for="registration in registrations"
            :key="registration.id"
            class="bg-white rounded-lg shadow p-6"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900">
                {{ registration.chestNumber || `Registration #${registration.id.slice(0, 8).toUpperCase()}` }}
                </h3>
                <p class="text-sm text-gray-500 mt-1">
                  <span v-if="registration.participantCount">
                    {{ registration.participantCount }} participant{{ registration.participantCount > 1 ? 's' : '' }}
                  </span>
                  <span v-else class="text-gray-400">Registration details hidden for fairness</span>
                </p>
              </div>
              <span
                v-if="registration.judgment"
                class="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full"
              >
                Judged ({{ registration.judgment.score }}/50)
              </span>
              <span
                v-else
                class="px-3 py-1 text-sm font-medium bg-orange-100 text-orange-800 rounded-full"
              >
                Pending
              </span>
            </div>

            <!-- Note about anonymity -->
            <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p class="text-xs text-blue-800">
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Registration details are anonymized to ensure fair and unbiased judging.
              </p>
            </div>

            <!-- Scoring Form -->
            <div class="border-t border-gray-200 pt-4 mt-4">
              <form @submit.prevent="submitJudgment(registration)" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Score (0-50)
                  </label>
                  <input
                    v-model.number="scores[registration.id]"
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    required
                    placeholder="Enter score (0-50)"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p class="text-xs text-gray-500 mt-1">Maximum score: 50.0</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Comments (Optional)
                  </label>
                  <textarea
                    v-model="comments[registration.id]"
                    rows="3"
                    placeholder="Add any comments or feedback..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  :disabled="submitting[registration.id]"
                  class="w-full sm:w-auto px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors"
                >
                  {{ submitting[registration.id] ? 'Saving...' : registration.judgment ? 'Update Judgment' : 'Submit Judgment' }}
                </button>
              </form>
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
const router = useRouter()
const route = useRoute()
const { judge: judgeRef, checkAuth } = useJudge()

const judge = ref<any>(null)
const eventId = route.params.eventId as string
const loading = ref(false)
const event = ref<any>(null)
const registrations = ref<any[]>([])

// Initialize scores and comments from existing judgments
const scores = ref<Record<string, number>>({})
const comments = ref<Record<string, string>>({})
const submitting = ref<Record<string, boolean>>({})

const judgedCount = computed(() => {
  return registrations.value.filter((r) => r.judgment).length
})

const fetchRegistrations = async () => {
  loading.value = true
  try {
    const response = await $fetch(`/api/judge/events/${eventId}/registrations`, {
      params: {
        judgeId: judge.value?.id,
      },
    })
    if (response.success) {
      event.value = response.event
      registrations.value = response.registrations || []
      
      // Initialize scores and comments from existing judgments
      registrations.value.forEach((reg) => {
        if (reg.judgment) {
          scores.value[reg.id] = reg.judgment.score
          comments.value[reg.id] = reg.judgment.comments || ''
        }
      })
    }
  } catch (err: any) {
    console.error('Failed to fetch registrations:', err)
    if (err.statusCode === 403) {
      router.push('/judge/dashboard')
    }
  } finally {
    loading.value = false
  }
}

const submitJudgment = async (registration: any) => {
  if (!scores.value[registration.id] && scores.value[registration.id] !== 0) {
    alert('Please enter a score')
    return
  }

  submitting.value[registration.id] = true
  try {
    const response = await $fetch('/api/judge/judgments', {
      method: 'POST',
      body: {
        judgeId: judge.value?.id,
        registrationId: registration.id,
        score: scores.value[registration.id],
        comments: comments.value[registration.id] || null,
      },
    })

    if (response.success) {
      // Update judgment in local data
      const regIndex = registrations.value.findIndex((r) => r.id === registration.id)
      if (regIndex !== -1) {
        registrations.value[regIndex].judgment = {
          id: response.judgment.id,
          score: response.judgment.score,
          comments: response.judgment.comments,
          createdAt: response.judgment.createdAt,
          updatedAt: response.judgment.updatedAt,
        }
        // Update scores and comments in form
        scores.value[registration.id] = response.judgment.score
        comments.value[registration.id] = response.judgment.comments || ''
      }
    }
  } catch (err: any) {
    console.error('Failed to submit judgment:', err)
    alert(err.data?.message || 'Failed to submit judgment')
  } finally {
    submitting.value[registration.id] = false
  }
}

onMounted(async () => {
  if (!checkAuth()) {
    return
  }
  if (import.meta.client) {
    const storedJudge = localStorage.getItem('judge')
    if (storedJudge) {
      judge.value = JSON.parse(storedJudge)
      await fetchRegistrations()
    } else {
      router.push('/judge/login')
    }
  }
})
</script>
