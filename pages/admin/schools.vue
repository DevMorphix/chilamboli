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
            <h1 class="text-2xl font-bold text-gray-900">Schools Management</h1>
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
              placeholder="Search by name or code..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      <!-- Schools List -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">
            Schools ({{ metadata?.total || schools.length }})
          </h2>
          <div v-if="metadata" class="text-sm text-gray-500">
            Page {{ metadata.page }} of {{ metadata.totalPages }}
          </div>
        </div>

        <div v-if="loading" class="text-center py-12 text-gray-500">
          Loading schools...
        </div>

        <div v-else-if="schools.length === 0" class="text-center py-12 text-gray-500">
          <p>No schools found.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School Name
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School Code
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="school in schools" :key="school.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ school.name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {{ school.schoolCode }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ school.location || 'N/A' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(school.createdAt) }}
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

const schools = ref<any[]>([])
const metadata = ref<any>(null)
const loading = ref(true)
const searchQuery = ref('')
const currentPage = ref(1)
const pageLimit = ref(20)

let searchTimeout: NodeJS.Timeout | null = null

const fetchSchools = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      limit: pageLimit.value,
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    const response = await $fetch(`/api/schools`, { params })
    schools.value = response.data || []
    metadata.value = response.metadata
  } catch (err) {
    console.error('Failed to fetch schools:', err)
  } finally {
    loading.value = false
  }
}

const changePage = (page: number) => {
  currentPage.value = page
  fetchSchools()
}

watch(searchQuery, () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchSchools()
  }, 300)
})

onMounted(async () => {
  if (!checkAuth()) {
    return
  }
  await fetchSchools()
})

const formatDate = (date: Date | number) => {
  const d = typeof date === 'number' ? new Date(date * 1000) : new Date(date)
  return d.toLocaleDateString('en-GB')
}
</script>

