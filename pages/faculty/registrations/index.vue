<template>
  <div class="min-h-screen bg-gray-50 grid grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <NuxtLink to="/faculty/dashboard" class="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
              ← Back to Dashboard
            </NuxtLink>
            <h1 class="text-2xl font-bold text-gray-900">Event Registrations</h1>
          </div>
          
          <NuxtLink
            to="/faculty/registrations/new"
            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
          >
            + New Registration
          </NuxtLink>
         
          <!-- <button
            disabled
            class="px-4 py-2 bg-gray-400 text-white rounded-md font-medium cursor-not-allowed opacity-50"
          >
            + New Registration
          </button> -->

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
              placeholder="Search by event name, team name..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select
              v-model="filterEventType"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="Individual">Individual</option>
              <option value="Group">Group</option>
              <option value="Combined">Combined</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Registrations List -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">
            All Registrations ({{ metadata?.total || registrations.length }})
          </h2>
          <div v-if="metadata" class="text-sm text-gray-500">
            Page {{ metadata.page }} of {{ metadata.totalPages }}
          </div>
        </div>

        <div v-if="loading" class="text-center py-12 text-gray-500">
          Loading registrations...
        </div>

        <div v-else-if="registrations.length === 0" class="text-center py-12 text-gray-500">
          <p>No registrations yet.</p>
          
          <NuxtLink to="/faculty/registrations/new" class="text-green-600 hover:text-green-700 font-medium mt-2 inline-block">
            Register students for events
          </NuxtLink>
         
          <!-- <button
            disabled
            class="text-gray-400 cursor-not-allowed font-medium mt-2 inline-block pointer-events-none"
          >
            Register students for events
          </button>
          <p class="text-sm text-yellow-600 mt-2">Registration is closed. You can still update existing registrations.</p> -->
          
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th 
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  @click="handleSort('eventName')"
                >
                  <div class="flex items-center gap-1">
                    Event
                    <span v-if="sortBy === 'eventName'" class="text-blue-600">
                      {{ sortOrder === 'asc' ? '↑' : '↓' }}
                    </span>
                  </div>
                </th>
                <th 
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  @click="handleSort('teamName')"
                >
                  <div class="flex items-center gap-1">
                    Team Name
                    <span v-if="sortBy === 'teamName'" class="text-blue-600">
                      {{ sortOrder === 'asc' ? '↑' : '↓' }}
                    </span>
                  </div>
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participants
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="registration in registrations" :key="registration.id" class="hover:bg-gray-50">
                <td class="px-6 py-4">
                  <div>
                    <p class="text-sm font-semibold text-gray-900 mb-1">{{ registration.event?.name }}</p>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span
                        class="px-2 py-1 text-xs font-medium rounded-full"
                        :class="{
                          'bg-blue-100 text-blue-800': registration.event?.eventType === 'Individual',
                          'bg-purple-100 text-purple-800': registration.event?.eventType === 'Group',
                          'bg-green-100 text-green-800': registration.event?.eventType === 'Combined',
                        }"
                      >
                        {{ registration.event?.eventType }}<template v-if="registration.event?.ageCategory === 'Combined'"> (Combined)</template>
                      </span>
                      <span
                        class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800"
                      >
                        {{ registration.event?.ageCategory }}
                      </span>
                      <span class="text-xs text-gray-500">
                        {{ (registration.participants?.length || 0) + (registration.facultyParticipants?.length || 0) }} {{ ((registration.participants?.length || 0) + (registration.facultyParticipants?.length || 0)) === 1 ? 'participant' : 'participants' }}
                      </span>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  <span v-if="registration.teamName" class="font-medium">{{ registration.teamName }}</span>
                  <span v-else class="text-gray-400 italic">Individual</span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-2 items-center">
                    <!-- Student Participants -->
                    <div
                      v-for="participant in registration.participants?.slice(0, 3)"
                      :key="participant.id"
                      class="flex items-center gap-2 px-2 py-1 bg-blue-50 rounded-full"
                    >
                      <div class="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs text-blue-700 font-semibold">
                        {{ participant.studentName?.charAt(0).toUpperCase() }}
                      </div>
                      <span class="text-sm text-gray-700">{{ participant.studentName }}</span>
                    </div>
                    <!-- Faculty Participants -->
                    <div
                      v-for="facultyParticipant in registration.facultyParticipants"
                      :key="facultyParticipant.id"
                      class="flex items-center gap-2 px-2 py-1 bg-green-50 rounded-full"
                    >
                      <div class="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-xs text-green-700 font-semibold">
                        {{ facultyParticipant.facultyName?.charAt(0).toUpperCase() }}
                      </div>
                      <span class="text-sm text-gray-700">{{ facultyParticipant.facultyName }} <span class="text-xs text-gray-500">(Faculty)</span></span>
                    </div>
                    <span
                      v-if="registration.participants && registration.participants.length > 3"
                      class="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full"
                    >
                      +{{ registration.participants.length - 3 }} more
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <div class="flex items-center gap-2">
                    <NuxtLink
                      :to="`/faculty/registrations/edit/${registration.id}`"
                      class="text-blue-600 hover:text-blue-700 font-medium px-4 py-2 bg-blue-50 rounded transition-colors"
                    >
                      Edit
                    </NuxtLink>
                    <button
                      @click="handleDeleteClick(registration.id)"
                      class="text-red-600 hover:text-red-700 font-medium px-4 py-2 bg-red-50 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="metadata && metadata.totalPages > 1" class="px-6 py-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <button
                @click="changePage(metadata.page - 1)"
                :disabled="metadata.page === 1"
                class="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span class="text-sm text-gray-700">
                Page {{ metadata.page }} of {{ metadata.totalPages }}
              </span>
              <button
                @click="changePage(metadata.page + 1)"
                :disabled="metadata.page === metadata.totalPages"
                class="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div class="text-sm text-gray-500">
              Showing {{ ((metadata.page - 1) * metadata.limit) + 1 }} - {{ Math.min(metadata.page * metadata.limit, metadata.total) }} of {{ metadata.total }}
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <Footer />

    <!-- Delete Registration Modal -->
    <DeleteRegistrationModal
      v-model="showDeleteModal"
      :registration="selectedRegistration"
      :deleting="deleting"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { faculty, checkAuth } = useFaculty()

const registrations = ref<any[]>([])
const metadata = ref<any>(null)
const loading = ref(true)
const searchQuery = ref('')
const filterEventType = ref('')
const sortBy = ref<string>('')
const sortOrder = ref<'asc' | 'desc'>('desc')
const currentPage = ref(1)
const pageLimit = ref(10)
const showDeleteModal = ref(false)
const selectedRegistration = ref<any>(null)
const deleting = ref(false)

let searchTimeout: NodeJS.Timeout | null = null

const fetchRegistrations = async () => {
  if (!faculty.value) return

  loading.value = true
  try {
    const params: Record<string, any> = {
      schoolId: faculty.value.schoolId,
      page: currentPage.value,
      limit: pageLimit.value,
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    // Only pass sortBy to server if it's a direct field on registrations table
    if (sortBy.value && sortBy.value !== 'eventName') {
      params.sortBy = sortBy.value
      params.sortOrder = sortOrder.value
    }

    const response = await $fetch(`/api/registrations/by-school`, { params })
    let fetchedRegistrations = response.data || response.registrations || []
    
    // Filter by event type on client side if needed
    if (filterEventType.value) {
      fetchedRegistrations = fetchedRegistrations.filter((r: any) => 
        r.event?.eventType === filterEventType.value
      )
    }
    
    // Apply client-side sorting for eventName
    if (sortBy.value === 'eventName') {
      fetchedRegistrations.sort((a: any, b: any) => {
        const aName = a.event?.name || ''
        const bName = b.event?.name || ''
        return sortOrder.value === 'asc' 
          ? aName.localeCompare(bName)
          : bName.localeCompare(aName)
      })
    }
    
    registrations.value = fetchedRegistrations
    metadata.value = response.metadata
  } catch (err) {
    console.error('Failed to fetch registrations:', err)
  } finally {
    loading.value = false
  }
}

const handleSort = (field: string) => {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortOrder.value = 'asc'
  }
  currentPage.value = 1
  fetchRegistrations()
}

const changePage = (page: number) => {
  currentPage.value = page
  fetchRegistrations()
}

// Debounce filter changes
watch([filterEventType], () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchRegistrations()
  }, 300)
})

// Debounce search separately
watch(searchQuery, () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchRegistrations()
  }, 300)
})

onMounted(async () => {
  if (!checkAuth()) {
    return
  }
  await fetchRegistrations()
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const handleDeleteClick = async (registrationId: string) => {
  try {
    // Fetch full registration details for the modal
    const registrationData = await $fetch(`/api/registrations/${registrationId}`)
    selectedRegistration.value = registrationData
    showDeleteModal.value = true
  } catch (err) {
    console.error('Failed to fetch registration details:', err)
    alert('Failed to load registration details. Please try again.')
  }
}

const handleDeleteConfirm = async (registrationId: string) => {
  if (!faculty.value || deleting.value) return

  deleting.value = true
  try {
    await $fetch(`/api/registrations/${registrationId}`, {
      method: 'DELETE',
    })

    // Close modal and refresh the list
    showDeleteModal.value = false
    selectedRegistration.value = null
    
    // Refresh the registrations list
    await fetchRegistrations()
    
    alert('Registration deleted successfully')
  } catch (err: any) {
    console.error('Failed to delete registration:', err)
    alert(err?.data?.message || 'Failed to delete registration. Please try again.')
  } finally {
    deleting.value = false
  }
}
</script>
