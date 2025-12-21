<template>
  <div class="min-h-screen bg-gray-50 relative grid grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div class="flex flex-row items-center justify-between gap-3 sm:gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex flex-col items-start">
              <h1 class="text-xl sm:text-2xl font-bold text-gray-900 truncate">Admin Dashboard</h1>
              <p class="hidden lg:inline text-xs text-gray-600 truncate">Comprehensive System Insights & Performance Metrics</p>
            </div>
          </div>
          <div class="flex items-center gap-2 sm:gap-4">
            <div class="text-right flex-1 sm:flex-none min-w-0">
              <p class="text-xs sm:text-sm font-medium text-gray-900 truncate">{{ admin?.email }}</p>
              <p class="text-xs text-gray-500 truncate hidden sm:block">Administrator</p>
            </div>
            <button
              @click="showPurgeModal = true"
              :disabled="purgingCache"
              class="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-blue-500 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Reload data"
            >
              <svg 
                v-if="!purgingCache"
                class="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <svg 
                v-else
                class="w-5 h-5 animate-spin" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              @click="handleLogout"
              class="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors border border-red-500 flex-shrink-0"
              title="Logout"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 w-full">
      <!-- Data Info Bar -->
      <div class="mb-6 flex items-center justify-between gap-4">
        <div v-if="loading" class="flex items-center gap-2 text-sm text-gray-500">
          <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading analytics...
        </div>
        <div v-else-if="analytics.dataCapturedAt" class="flex items-center gap-2 text-xs sm:text-sm text-gray-600 bg-gray-50 rounded-lg px-3 sm:px-4 py-2 border border-gray-200">
          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Data captured at: <span class="font-medium">{{ formatTimestamp(analytics.dataCapturedAt) }}</span></span>
          <span v-if="analytics.cached" class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">Cached</span>
        </div>
      </div>

      <!-- Overview Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div class="bg-white rounded-lg shadow p-4 sm:p-6">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm font-medium text-gray-600">Total Schools</p>
              <p class="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
                {{ analytics.overview?.participatingSchools || 0 }}/{{ analytics.overview?.totalSchools || 0 }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                {{ analytics.overview?.totalSchools > 0 
                  ? Math.round(((analytics.overview?.participatingSchools || 0) / analytics.overview.totalSchools) * 100) 
                  : 0 }}% participating
              </p>
            </div>
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-4 sm:p-6">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm font-medium text-gray-600">Total Students</p>
              <p class="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{{ analytics.overview?.totalStudents || 0 }}</p>
            </div>
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-4 sm:p-6">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm font-medium text-gray-600">Total Registrations</p>
              <p class="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{{ analytics.overview?.totalRegistrations || 0 }}</p>
            </div>
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-4 sm:p-6">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm font-medium text-gray-600">Faculty Verified</p>
              <p class="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
                {{ analytics.overview?.verifiedFaculty || 0 }}/{{ analytics.overview?.totalFaculty || 0 }}
              </p>
              <p class="text-xs text-gray-500 mt-1">{{ analytics.overview?.verificationRate || 0 }}% verified</p>
            </div>
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Multi-Series Trends Comparison -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">Activity Trends</h2>
        <apexchart
          v-if="activityTrendsChartOptions"
          type="line"
          height="350"
          :options="activityTrendsChartOptions"
          :series="activityTrendsSeries"
        />
        <div v-else class="h-64 flex items-center justify-center text-gray-400">
          No data available
        </div>
      </div>

      <!-- Distribution Charts -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <!-- Student Distribution by Age -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-base font-semibold text-gray-900 mb-4">Students by Age Category</h3>
          <apexchart
            v-if="studentAgeChartOptions"
            type="donut"
            height="300"
            :options="studentAgeChartOptions"
            :series="studentAgeSeries"
          />
          <div v-else class="h-64 flex items-center justify-center text-gray-400">
            No data available
          </div>
        </div>

        <!-- Student Gender Distribution -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-base font-semibold text-gray-900 mb-4">Students by Gender</h3>
          <apexchart
            v-if="studentGenderChartOptions"
            type="pie"
            height="300"
            :options="studentGenderChartOptions"
            :series="studentGenderSeries"
          />
          <div v-else class="h-64 flex items-center justify-center text-gray-400">
            No data available
          </div>
        </div>

        <!-- Registration by Event Type -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-base font-semibold text-gray-900 mb-4">Registrations by Event Type</h3>
          <apexchart
            v-if="eventTypeChartOptions"
            type="bar"
            height="300"
            :options="eventTypeChartOptions"
            :series="eventTypeSeries"
          />
          <div v-else class="h-64 flex items-center justify-center text-gray-400">
            No data available
          </div>
        </div>
      </div>

      <!-- School Performance Table -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">School Performance Breakdown</h2>
        <div v-if="paginatedSchools.length === 0" class="text-center py-8 text-gray-500">
          No schools with data available
        </div>
        <div v-else>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 border-b">
                <tr>
                  <th class="px-4 py-3 text-left font-medium text-gray-700">School</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-700">Students</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-700">Registrations</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-700">Registration Rate</th>
                  <th class="px-4 py-3 text-left font-medium text-gray-700">Verified Faculty</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="school in paginatedSchools" :key="school.schoolId" class="hover:bg-gray-50">
                  <td class="px-4 py-3">
                    <div class="font-medium text-gray-900">{{ school.schoolName }}</div>
                    <div class="text-xs text-gray-500">{{ school.schoolCode }}</div>
                  </td>
                  <td class="px-4 py-3 text-gray-900">{{ school.students }}</td>
                  <td class="px-4 py-3 text-gray-900">{{ school.registrations }}</td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {{ school.registrationRate }}%
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-gray-900">{{ school.verifiedFaculty }}</span>
                    <span class="text-gray-500 text-xs">/ {{ school.totalFaculty }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <div v-if="totalPages > 1" class="mt-4 flex items-center justify-between">
            <div class="text-sm text-gray-700">
              Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, totalSchools) }} of {{ totalSchools }} schools
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="currentPage = Math.max(1, currentPage - 1)"
                :disabled="currentPage === 1"
                class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span class="text-sm text-gray-700">
                Page {{ currentPage }} of {{ totalPages }}
              </span>
              <button
                @click="currentPage = Math.min(totalPages, currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

    </main>

    <!-- Footer -->
    <Footer />

    <!-- Purge Cache Confirmation Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showPurgeModal"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          @click.self="showPurgeModal = false"
          @keydown.esc="showPurgeModal = false"
        >
          <div
            class="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">Reload Analytics Data</h2>
              <button
                @click="showPurgeModal = false"
                class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
                aria-label="Close"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Content -->
            <div class="p-6">
              <p class="text-gray-700 mb-6">
                This will clear the cached analytics data and fetch fresh data from the database. 
                This may take a few moments.
              </p>
              <div class="flex items-center gap-3 justify-end">
                <button
                  @click="showPurgeModal = false"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  :disabled="purgingCache"
                >
                  Cancel
                </button>
                <button
                  @click="confirmPurgeCache"
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  :disabled="purgingCache"
                >
                  <svg 
                    v-if="purgingCache"
                    class="w-4 h-4 animate-spin" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {{ purgingCache ? 'Reloading...' : 'Reload Data' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { admin, checkAuth, logout } = useAdmin()

const loading = ref(true)
const purgingCache = ref(false)
const showPurgeModal = ref(false)
const analytics = ref<any>({})
const currentPage = ref(1)
const pageSize = ref(10)

// Pagination for School Performance Breakdown
const schoolsWithData = computed(() => {
  return analytics.value.breakdowns?.schoolPerformance || []
})

const totalSchools = computed(() => schoolsWithData.value.length)
const totalPages = computed(() => Math.ceil(totalSchools.value / pageSize.value))

const paginatedSchools = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return schoolsWithData.value.slice(start, end)
})

// Activity Trends Comparison (Multi-series)
const activityTrendsSeries = computed(() => {
  const registrations = analytics.value.trends?.registrations || []
  const students = analytics.value.trends?.students || []
  
  return [
    {
      name: 'Registrations',
      data: registrations.map((t: any) => t.count),
    },
    {
      name: 'New Students',
      data: students.map((t: any) => t.count),
    },
  ]
})

const activityTrendsChartOptions = computed(() => {
  const registrations = analytics.value.trends?.registrations || []
  if (registrations.length === 0) return null

  return {
    chart: {
      type: 'line',
      height: 350,
      toolbar: { show: true },
      zoom: { enabled: true },
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    colors: ['#9333ea', '#3b82f6'],
    xaxis: {
      categories: registrations.map((t: any) => {
        const date = new Date(t.date)
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      }),
      labels: {
        style: { fontSize: '12px' },
      },
    },
    yaxis: {
      labels: {
        style: { fontSize: '12px' },
      },
    },
    legend: {
      position: 'top',
    },
    tooltip: {
      theme: 'light',
      shared: true,
      intersect: false,
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
    },
  }
})

// Student Age Distribution Chart
const studentAgeSeries = computed(() => {
  const data = analytics.value.distributions?.studentsByAge || []
  return data.map((item: any) => item.count)
})

const studentAgeChartOptions = computed(() => {
  const data = analytics.value.distributions?.studentsByAge || []
  if (data.length === 0) return null

  return {
    chart: {
      type: 'donut',
      height: 300,
    },
    labels: data.map((item: any) => item.category),
    colors: ['#3b82f6', '#8b5cf6', '#ec4899'],
    legend: {
      position: 'bottom',
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${Math.round(val)}%`,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} students`,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
        },
      },
    },
  }
})

// Student Gender Distribution Chart
const studentGenderSeries = computed(() => {
  const data = analytics.value.distributions?.studentsByGender || []
  return data.map((item: any) => item.count)
})

const studentGenderChartOptions = computed(() => {
  const data = analytics.value.distributions?.studentsByGender || []
  if (data.length === 0) return null

  return {
    chart: {
      type: 'pie',
      height: 300,
    },
    labels: data.map((item: any) => item.gender.charAt(0).toUpperCase() + item.gender.slice(1)),
    colors: ['#3b82f6', '#ec4899', '#8b5cf6'],
    legend: {
      position: 'bottom',
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${Math.round(val)}%`,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} students`,
      },
    },
  }
})

// Event Type Distribution Chart
const eventTypeSeries = computed(() => {
  const data = analytics.value.distributions?.registrationsByEventType || []
  return [{
    name: 'Registrations',
    data: data.map((item: any) => item.count),
  }]
})

const eventTypeChartOptions = computed(() => {
  const data = analytics.value.distributions?.registrationsByEventType || []
  if (data.length === 0) return null

  return {
    chart: {
      type: 'bar',
      height: 300,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: true,
    },
    colors: ['#3b82f6', '#10b981', '#8b5cf6'],
    xaxis: {
      categories: data.map((item: any) => item.eventType),
      labels: {
        style: { fontSize: '12px' },
      },
    },
    yaxis: {
      labels: {
        style: { fontSize: '12px' },
      },
    },
    tooltip: {
      theme: 'light',
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
    },
  }
})

const fetchAnalytics = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/admin/analytics')
    if (response.success) {
      analytics.value = response
    }
  } catch (err) {
    console.error('Failed to fetch analytics:', err)
  } finally {
    loading.value = false
  }
}

const confirmPurgeCache = async () => {
  purgingCache.value = true
  showPurgeModal.value = false
  try {
    await $fetch('/api/admin/analytics/purge-cache', {
      method: 'POST',
    })
    // Refresh analytics after purging cache
    await fetchAnalytics()
  } catch (err) {
    console.error('Failed to purge cache:', err)
  } finally {
    purgingCache.value = false
  }
}

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

onMounted(async () => {
  if (!checkAuth()) {
    return
  }
  await fetchAnalytics()
})

const handleLogout = () => {
  logout()
}
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

.modal-enter-active .bg-white,
.modal-leave-active .bg-white {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from .bg-white,
.modal-leave-to .bg-white {
  transform: scale(0.95);
  opacity: 0;
}
</style>
