<template>
  <div class="min-h-screen bg-gray-50 grid grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <NuxtLink to="/admin/dashboard#control" class="text-purple-600 hover:text-purple-700 text-sm mb-2 inline-block">
              ← Back to Dashboard
            </NuxtLink>
            <h1 class="text-2xl font-bold text-gray-900">Event-Judge Assignments</h1>
            <p class="text-sm text-gray-500 mt-1">Assign judges to events and manage their assignments</p>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by event name, type, or age category..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      <!-- Events with Judge Assignments -->
      <div v-if="loadingEvents" class="text-center py-8 text-gray-500">
        <svg class="animate-spin h-8 w-8 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading events...
      </div>

      <div v-else-if="events.length === 0" class="text-center py-8 text-gray-500">
        No events found.
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          v-for="event in events"
          :key="event.id"
          class="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
        >
          <!-- Event Header -->
          <div class="bg-white px-4 py-3 border-b border-gray-200">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="font-bold text-gray-900">{{ event.name }}</h3>
              </div>
              <div class="flex items-center gap-2 ml-4">
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-semibold"
                  :class="{
                    'bg-blue-100 text-blue-700': event.eventType === 'Individual',
                    'bg-green-100 text-green-700': event.eventType === 'Group',
                    'bg-purple-100 text-purple-700': event.eventType === 'Combined',
                  }"
                >
                  {{ event.eventType }}
                </span>
                <span class="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                  {{ event.ageCategory }}
                </span>
              </div>
            </div>
          </div>

          <!-- Event Content -->
          <div class="px-4 py-3">
            <!-- Assigned Judges List -->
            <div v-if="event.assignments && event.assignments.length > 0" class="space-y-2 mb-3">
              <h4 class="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Judge Assignments</h4>
              <div class="space-y-1.5">
                <div
                  v-for="assignment in event.assignments"
                  :key="assignment.assignmentId"
                  class="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm text-gray-900 truncate">{{ assignment.judgeName }}</div>
                    <div class="text-xs text-gray-500">{{ assignment.judgeMobileNumber }}</div>
                  </div>
                  <div class="flex items-center gap-1.5 ml-2">
                    <span
                      :class="[
                        assignment.enabled
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200',
                        'px-2 py-0.5 rounded text-xs font-semibold border'
                      ]"
                    >
                      {{ assignment.enabled ? 'Active' : 'Inactive' }}
                    </span>
                    <button
                      @click="toggleAssignmentStatus(assignment)"
                      :disabled="togglingAssignmentId === assignment.assignmentId"
                      :class="[
                        assignment.enabled
                          ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200'
                          : 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200',
                        'px-2 py-1 rounded text-xs font-semibold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                      ]"
                    >
                      {{ togglingAssignmentId === assignment.assignmentId ? '...' : assignment.enabled ? 'Disable' : 'Enable' }}
                    </button>
                    <button
                      @click="removeJudgeFromEvent(assignment)"
                      :disabled="removingAssignmentId === assignment.assignmentId"
                      class="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {{ removingAssignmentId === assignment.assignmentId ? '...' : 'Remove' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="mb-3">
              <div class="text-center py-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg class="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <p class="mt-1.5 text-xs text-gray-500">No judges assigned</p>
              </div>
            </div>

            <!-- Action Button -->
            <button
              @click="openAssignJudgeModal(event)"
              class="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-semibold text-xs shadow-sm hover:shadow-md flex items-center justify-center gap-1.5"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Assign Judges
            </button>
          </div>
        </div>

        <!-- Pagination for Events -->
        <div v-if="eventsMetadata && eventsMetadata.totalPages > 1" class="lg:col-span-2 mt-6 py-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <button
                @click="changeEventsPage(eventsMetadata.page - 1)"
                :disabled="eventsMetadata.page === 1"
                class="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span class="text-sm text-gray-700">
                Page {{ eventsMetadata.page }} of {{ eventsMetadata.totalPages }}
              </span>
              <button
                @click="changeEventsPage(eventsMetadata.page + 1)"
                :disabled="eventsMetadata.page === eventsMetadata.totalPages"
                class="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div class="text-sm text-gray-500">
              Showing {{ ((eventsMetadata.page - 1) * eventsMetadata.limit) + 1 }} - {{ Math.min(eventsMetadata.page * eventsMetadata.limit, eventsMetadata.total) }} of {{ eventsMetadata.total }}
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <Footer />

    <!-- Assign Judges to Event Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showAssignJudgesModal && selectedEvent"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          @click.self="showAssignJudgesModal = false"
        >
          <div class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">
                Assign Judges to {{ selectedEvent.name }}
              </h2>
              <button
                @click="showAssignJudgesModal = false"
                class="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="p-6 overflow-y-auto flex-1">
              <div v-if="loadingJudgesForAssign" class="text-center py-8 text-gray-500">
                Loading judges...
              </div>
              <div v-else class="space-y-2">
                <label
                  v-for="judge in allJudges"
                  :key="judge.id"
                  class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :value="judge.id"
                    v-model="selectedJudgeIds"
                    class="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <div class="flex-1">
                    <div class="font-medium text-gray-900">{{ judge.judgeName }}</div>
                    <div class="text-sm text-gray-500">{{ judge.mobileNumber }}</div>
                  </div>
                </label>
              </div>
              <div v-if="allJudges.length === 0" class="text-center py-8 text-gray-500">
                No judges available
              </div>
            </div>
            <div class="px-6 py-4 border-t border-gray-200 flex items-center gap-3 justify-end">
              <button
                @click="showAssignJudgesModal = false"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                :disabled="assigningJudges"
              >
                Cancel
              </button>
              <button
                @click="assignJudgesToEvent"
                class="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                :disabled="assigningJudges || selectedJudgeIds.length === 0"
              >
                {{ assigningJudges ? 'Assigning...' : 'Assign Judges' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { admin, checkAuth } = useAdmin()

const events = ref<any[]>([])
const loadingEvents = ref(false)

// Search
const searchQuery = ref('')

// Pagination for Events
const eventsMetadata = ref<any>(null)
const eventsPage = ref(1)
const eventsLimit = ref(10)

let searchTimeout: NodeJS.Timeout | null = null

// Assign Judges
const showAssignJudgesModal = ref(false)
const selectedEvent = ref<any>(null)
const allJudges = ref<any[]>([])
const selectedJudgeIds = ref<string[]>([])
const loadingJudgesForAssign = ref(false)
const assigningJudges = ref(false)

// Toggle Assignment Status
const togglingAssignmentId = ref<string | null>(null)
const removingAssignmentId = ref<string | null>(null)

const fetchEvents = async () => {
  loadingEvents.value = true
  try {
    const params: Record<string, any> = {
      page: eventsPage.value,
      limit: eventsLimit.value,
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    const response = await $fetch('/api/events/with-judges', {
      params,
    })
    if (response.success) {
      events.value = response.data || []
      eventsMetadata.value = response.metadata
    }
  } catch (err) {
    console.error('Failed to fetch events:', err)
  } finally {
    loadingEvents.value = false
  }
}

const changeEventsPage = (page: number) => {
  eventsPage.value = page
  fetchEvents()
}

const openAssignJudgeModal = async (event: any) => {
  selectedEvent.value = event
  selectedJudgeIds.value = []
  showAssignJudgesModal.value = true

  loadingJudgesForAssign.value = true
  try {
    const response = await $fetch('/api/judges', { params: { limit: 1000 } })
    if (response.success) {
      allJudges.value = response.data || []
    }

    if (event.assignments && event.assignments.length > 0) {
      selectedJudgeIds.value = event.assignments.map((a: any) => a.judgeId)
    }
  } catch (err) {
    console.error('Failed to fetch judges:', err)
  } finally {
    loadingJudgesForAssign.value = false
  }
}

const assignJudgesToEvent = async () => {
  if (!selectedEvent.value || selectedJudgeIds.value.length === 0) return

  assigningJudges.value = true
  try {
    await Promise.all(
      selectedJudgeIds.value.map((judgeId) =>
        $fetch(`/api/judges/${judgeId}/assign`, {
          method: 'POST',
          body: {
            eventIds: [selectedEvent.value.id],
          },
        })
      )
    )
    showAssignJudgesModal.value = false
    await fetchEvents()
  } catch (err: any) {
    alert(err.data?.message || 'Failed to assign judges')
  } finally {
    assigningJudges.value = false
  }
}

const toggleAssignmentStatus = async (assignment: any) => {
  togglingAssignmentId.value = assignment.assignmentId
  try {
    await $fetch(`/api/event-judges/${assignment.assignmentId}/toggle`, {
      method: 'POST',
      body: {
        enabled: !assignment.enabled,
      },
    })
    assignment.enabled = !assignment.enabled
    await fetchEvents()
  } catch (err: any) {
    alert(err.data?.message || 'Failed to toggle assignment status')
  } finally {
    togglingAssignmentId.value = null
  }
}

const removeJudgeFromEvent = async (assignment: any) => {
  if (!confirm(`Are you sure you want to remove ${assignment.judgeName} from this event?`)) {
    return
  }

  removingAssignmentId.value = assignment.assignmentId
  try {
    await $fetch(`/api/event-judges/${assignment.assignmentId}`, {
      method: 'DELETE',
    })
    await fetchEvents()
  } catch (err: any) {
    alert(err.data?.message || 'Failed to remove judge from event')
  } finally {
    removingAssignmentId.value = null
  }
}

watch(searchQuery, () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    eventsPage.value = 1
    fetchEvents()
  }, 300)
})

onMounted(async () => {
  if (!checkAuth()) {
    return
  }
  await fetchEvents()
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
