<template>
  <div class="min-h-screen bg-gray-50">
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
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <label class="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              v-model="sortBy"
              @change="handleSortChange"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt">Date Created</option>
              <option value="teamName">Team Name</option>
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
        </div>

        <div v-else class="divide-y divide-gray-200">
          <div
            v-for="registration in registrations"
            :key="registration.id"
            class="p-6 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-lg font-semibold text-gray-900">
                    {{ registration.event?.name }}
                  </h3>
                  <span
                    class="px-2 py-1 text-xs font-medium rounded-full"
                    :class="{
                      'bg-blue-100 text-blue-800': registration.event?.eventType === 'Individual',
                      'bg-purple-100 text-purple-800': registration.event?.eventType === 'Group',
                      'bg-green-100 text-green-800': registration.event?.eventType === 'Combined',
                    }"
                  >
                    {{ registration.event?.eventType }}
                  </span>
                  <span
                    class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800"
                  >
                    {{ registration.event?.ageCategory }}
                  </span>
                </div>

                <p v-if="registration.teamName" class="text-sm text-gray-600 mb-2">
                  Team: <span class="font-medium">{{ registration.teamName }}</span>
                </p>

                <div class="flex flex-wrap gap-2 mt-3">
                  <div
                    v-for="participant in registration.participants"
                    :key="participant.id"
                    class="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full"
                  >
                    <div class="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs text-blue-700 font-semibold">
                      {{ participant.studentName.charAt(0).toUpperCase() }}
                    </div>
                    <span class="text-sm text-gray-700">{{ participant.studentName }}</span>
                  </div>
                </div>
              </div>

              <div class="text-right text-sm text-gray-500">
                {{ formatDate(registration.createdAt) }}
              </div>
            </div>
          </div>
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
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

const faculty = ref<any>(null)
const registrations = ref<any[]>([])
const metadata = ref<any>(null)
const loading = ref(true)
const searchQuery = ref('')
const sortBy = ref('createdAt')
const sortOrder = ref<'asc' | 'desc'>('desc')
const currentPage = ref(1)
const pageLimit = ref(20)

let searchTimeout: NodeJS.Timeout | null = null

const fetchRegistrations = async () => {
  if (!faculty.value) return

  loading.value = true
  try {
    const params: Record<string, any> = {
      schoolId: faculty.value.schoolId,
      page: currentPage.value,
      limit: pageLimit.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    const response = await $fetch(`/api/registrations/by-school`, { params })
    registrations.value = response.data || response.registrations || []
    metadata.value = response.metadata
  } catch (err) {
    console.error('Failed to fetch registrations:', err)
  } finally {
    loading.value = false
  }
}

const handleSortChange = () => {
  currentPage.value = 1
  fetchRegistrations()
}

const changePage = (page: number) => {
  currentPage.value = page
  fetchRegistrations()
}

// Debounce search
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
  const storedFaculty = localStorage.getItem('faculty')
  if (!storedFaculty) {
    router.push('/faculty/login')
    return
  }

  faculty.value = JSON.parse(storedFaculty)
  await fetchRegistrations()
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
</script>
