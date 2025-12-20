<template>
  <div class="min-h-screen bg-gray-50 grid grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <NuxtLink to="/admin/dashboard" class="text-purple-600 hover:text-purple-700 text-sm mb-2 inline-block">
              ← Back to Dashboard
            </NuxtLink>
            <h1 class="text-2xl font-bold text-gray-900">Events Management</h1>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search events..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select
              v-model="filterType"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Types</option>
              <option value="Individual">Individual</option>
              <option value="Group">Group</option>
              <option value="Combined">Combined</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Age Category</label>
            <select
              v-model="filterCategory"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Categories</option>
              <option value="Sub Junior">Sub Junior</option>
              <option value="Junior">Junior</option>
              <option value="Senior">Senior</option>
              <option value="Combined">Combined</option>
              <option value="Special">Special</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Events List -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">
            Events ({{ metadata?.total || events.length }})
          </h2>
          <div v-if="metadata" class="text-sm text-gray-500">
            Page {{ metadata.page }} of {{ metadata.totalPages }}
          </div>
        </div>

        <div v-if="loading" class="text-center py-12 text-gray-500">
          Loading events...
        </div>

        <div v-else-if="events.length === 0" class="text-center py-12 text-gray-500">
          <p>No events found.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Name
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age Category
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gender
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Team Size
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="event in events" :key="event.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ event.name }}</div>
                  <div v-if="event.description" class="text-sm text-gray-500 mt-1">
                    {{ event.description }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="px-2 py-1 text-xs font-medium rounded-full"
                    :class="{
                      'bg-blue-100 text-blue-800': event.eventType === 'Individual',
                      'bg-green-100 text-green-800': event.eventType === 'Group',
                      'bg-purple-100 text-purple-800': event.eventType === 'Combined',
                    }"
                  >
                    {{ event.eventType }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                    {{ event.ageCategory }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ event.gender || 'N/A' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ event.maxTeamSize || 'N/A' }}
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
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { checkAuth } = useAdmin()

const events = ref<any[]>([])
const metadata = ref<any>(null)
const loading = ref(true)
const searchQuery = ref('')
const filterType = ref('')
const filterCategory = ref('')
const currentPage = ref(1)
const pageLimit = ref(20)

let searchTimeout: NodeJS.Timeout | null = null

const fetchEvents = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      limit: pageLimit.value,
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    if (filterType.value) {
      params.eventType = filterType.value
    }
    if (filterCategory.value) {
      params.ageCategory = filterCategory.value
    }

    const response = await $fetch('/api/events', { params })
    events.value = response.data || []
    metadata.value = response.metadata
  } catch (err) {
    console.error('Failed to fetch events:', err)
  } finally {
    loading.value = false
  }
}

const changePage = (page: number) => {
  currentPage.value = page
  fetchEvents()
}

watch([searchQuery, filterType, filterCategory], () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
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

