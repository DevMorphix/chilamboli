<template>
  <div class="min-h-screen bg-gray-50 relative grid grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div class="flex flex-row items-center justify-between gap-3 sm:gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex flex-col items-start">
              <h1 class="text-xl sm:text-2xl font-bold text-gray-900 truncate">Dashboard</h1>
              <p class="hidden lg:inline text-xs text-gray-600 truncate">{{ faculty?.schoolName }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 sm:gap-4">
            <div class="text-right flex-1 sm:flex-none min-w-0">
              <p class="text-xs sm:text-sm font-medium text-gray-900 truncate">{{ faculty?.facultyName }}</p>
              <p class="text-xs text-gray-500 truncate hidden sm:block">{{ faculty?.schoolEmail }}</p>
            </div>
            <!-- Notifications Icon -->
            <button
              @click="showNotifications = true"
              class="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
              :class="{ 'animate-shake': unreadCount > 0 }"
              aria-label="Notifications"
            >
              <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span
                v-if="unreadCount > 0"
                class="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white"
                aria-label="Unread notifications"
              ></span>
            </button>
            <button
              @click="handleLogout"
              class="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors border border-red-500 whitespace-nowrap flex-shrink-0"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 w-full">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div class="bg-white rounded-lg shadow p-4 sm:p-6">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm font-medium text-gray-600">Total Students</p>
              <p class="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{{ stats.totalStudents }}</p>
            </div>
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-4 sm:p-6">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm font-medium text-gray-600">Total Faculty</p>
              <p class="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{{ stats.totalFaculty }}</p>
            </div>
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-4 sm:p-6">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm font-medium text-gray-600">Event Registrations</p>
              <p class="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{{ stats.totalRegistrations }}</p>
            </div>
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-4 sm:p-6">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm font-medium text-gray-600">School Code</p>
              <p class="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2 break-all">{{ faculty?.schoolCode }}</p>
            </div>
            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <NuxtLink
          to="/faculty/students"
          class="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow p-4 sm:p-6 transition-colors flex items-center justify-between group"
        >
          <div class="flex-1 min-w-0">
            <h3 class="text-base sm:text-lg font-semibold">Manage Students</h3>
            <p class="text-blue-100 text-xs sm:text-sm mt-1">Add, edit, and view student details</p>
          </div>
          <svg class="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>

        <NuxtLink
          to="/faculty/faculty"
          class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow p-4 sm:p-6 transition-colors flex items-center justify-between group"
        >
          <div class="flex-1 min-w-0">
            <h3 class="text-base sm:text-lg font-semibold">Manage Faculty</h3>
            <p class="text-indigo-100 text-xs sm:text-sm mt-1">Add and view faculty members</p>
          </div>
          <svg class="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>

        <NuxtLink
          to="/faculty/registrations"
          class="bg-green-600 hover:bg-green-700 text-white rounded-lg shadow p-4 sm:p-6 transition-colors flex items-center justify-between group"
        >
          <div class="flex-1 min-w-0">
            <h3 class="text-base sm:text-lg font-semibold">Event Registrations</h3>
            <p class="text-green-100 text-xs sm:text-sm mt-1">Register students for events</p>
          </div>
          <svg class="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>

        <button
          @click="showSupport = true"
          class="bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow p-4 sm:p-6 transition-colors flex items-center justify-between group"
        >
          <div class="flex flex-col items-start flex-1 min-w-0">
            <h3 class="text-base sm:text-lg font-semibold">Support</h3>
            <p class="text-orange-100 text-xs sm:text-sm mt-1">Get help and contact support</p>
          </div>
          <svg class="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Recent Students -->
      <div class="bg-white rounded-lg shadow mb-6 sm:mb-8">
        <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 class="text-base sm:text-lg font-semibold text-gray-900">Recent Students</h2>
        </div>
        <div class="p-4 sm:p-6">
          <div v-if="loading" class="text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base">
            Loading...
          </div>
          <div v-else-if="recentStudents.length === 0" class="text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base px-2">
            No students added yet. Click "Manage Students" to add your first student.
          </div>
          <div v-else class="space-y-3 sm:space-y-4">
            <div
              v-for="student in recentStudents"
              :key="student.id"
              class="flex items-center justify-between py-2 sm:py-3 px-3 sm:px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-3"
            >
              <div class="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                <img
                  v-if="student.photoUrl"
                  :src="toFullUrl(student.photoUrl)"
                  :alt="student.studentName"
                  class="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-gray-200 p-1 flex-shrink-0"
                />
                <div
                  v-else
                  class="w-10 h-10 sm:w-12 sm:h-12 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  <span class="text-blue-700 font-semibold text-base sm:text-lg">
                    {{ student.studentName.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 text-sm sm:text-base truncate">{{ student.studentName }}</p>
                  <p class="text-xs sm:text-sm text-gray-500 truncate">
                    {{ student.ageCategory }} • {{ student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : '' }}
                  </p>
                </div>
              </div>
              <span class="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0">
                {{ student.studentId }}
              </span>
            </div>
          </div>
        </div>
      </div>

    </main>

    <!-- Footer with Branding -->
    <Footer />

    <!-- Support Modal -->
    <SupportModal v-model="showSupport" />

    <!-- Notifications Panel -->
    <NotificationsPanel v-model="showNotifications" :faculty-id="faculty?.id || null" />

    <!-- Important Notification Modal (auto-opens on login) -->
    <NotificationDetailModal
      v-model="showImportantModal"
      :notification="importantNotification"
      @read="handleImportantNotificationRead"
    />
  </div>
</template>

<style scoped>
@keyframes shake {
  0%, 100% {
    transform: rotate(0deg);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: rotate(-15deg);
  }
  20%, 40%, 60%, 80% {
    transform: rotate(15deg);
  }
}

.animate-shake {
  animation: shake 0.5s ease-in-out infinite;
}
</style>

<script setup lang="ts">
const router = useRouter()
const { toFullUrl } = useUrl()
const { faculty, checkAuth, logout } = useFaculty()

const loading = ref(true)
const recentStudents = ref<any[]>([])
const showSupport = ref(false)
const showNotifications = ref(false)
const unreadCount = ref(0)
const importantNotification = ref<any>(null)
const showImportantModal = ref(false)

const stats = ref({
  totalStudents: 0,
  totalFaculty: 0,
  totalRegistrations: 0,
})

onMounted(async () => {
  // Check if faculty is logged in
  if (!checkAuth()) {
    return
  }

  // Fetch data - stats (including notifications), and recent students
  try {
    const [statsRes, studentsRes] = await Promise.all([
      $fetch(`/api/faculty/stats?schoolId=${faculty.value.schoolId}&facultyId=${faculty.value.id}`),
      $fetch(`/api/students/by-school?schoolId=${faculty.value.schoolId}&limit=5&sortBy=createdAt&sortOrder=desc`),
    ])

    // Update stats from dedicated stats endpoint
    if (statsRes.stats) {
      stats.value.totalStudents = statsRes.stats.totalStudents
      stats.value.totalFaculty = statsRes.stats.totalFaculty
      stats.value.totalRegistrations = statsRes.stats.totalRegistrations
    }

    // Update notification summary from stats endpoint
    if (statsRes.notifications) {
      unreadCount.value = statsRes.notifications.unreadCount
      
      // Check for important unread notifications and auto-open the first one
      if (statsRes.notifications.importantUnread) {
        importantNotification.value = statsRes.notifications.importantUnread
        // Small delay to ensure UI is ready
        setTimeout(() => {
          showImportantModal.value = true
        }, 500)
      }
    }

    // Update recent students list
    recentStudents.value = studentsRes.data || studentsRes.students || []
  } catch (err) {
    console.error('Failed to fetch data:', err)
  } finally {
    loading.value = false
  }
})

const handleLogout = () => {
  logout()
}

const fetchUnreadCount = async () => {
  if (!faculty.value?.id || !faculty.value?.schoolId) return

  try {
    const response = await $fetch<{ 
      success: boolean
      notifications?: { 
        unreadCount: number
        importantUnread: any | null
      }
    }>(
      `/api/faculty/stats?schoolId=${faculty.value.schoolId}&facultyId=${faculty.value.id}`
    )
    
    if (response.notifications) {
      unreadCount.value = response.notifications.unreadCount
      
      // Check for important unread notifications and auto-open the first one
      if (response.notifications.importantUnread) {
        importantNotification.value = response.notifications.importantUnread
        // Small delay to ensure UI is ready
        setTimeout(() => {
          showImportantModal.value = true
        }, 500)
      }
    }
  } catch (error) {
    console.error('Failed to fetch notifications count:', error)
  }
}

// Watch for notifications panel close to refresh count
watch(showNotifications, (isOpen) => {
  if (!isOpen) {
    fetchUnreadCount()
  }
})

const handleImportantNotificationRead = () => {
  // Refetch notifications count when important notification is marked as read
  fetchUnreadCount()
}

// Watch for important modal close to refresh count
watch(showImportantModal, (isOpen) => {
  if (!isOpen) {
    fetchUnreadCount()
  }
})
</script>
