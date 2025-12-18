<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Faculty Dashboard</h1>
            <p class="text-sm text-gray-600 mt-1">{{ faculty?.schoolName }}</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900">{{ faculty?.facultyName }}</p>
              <p class="text-xs text-gray-500">{{ faculty?.schoolEmail }}</p>
            </div>
            <button
              @click="handleLogout"
              class="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Students</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalStudents }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Event Registrations</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalRegistrations }}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">School Code</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">{{ faculty?.schoolCode }}</p>
            </div>
            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <NuxtLink
          to="/faculty/students"
          class="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow p-6 transition-colors flex items-center justify-between group"
        >
          <div>
            <h3 class="text-lg font-semibold">Manage Students</h3>
            <p class="text-blue-100 text-sm mt-1">Add, edit, and view student details</p>
          </div>
          <svg class="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>

        <NuxtLink
          to="/faculty/registrations"
          class="bg-green-600 hover:bg-green-700 text-white rounded-lg shadow p-6 transition-colors flex items-center justify-between group"
        >
          <div>
            <h3 class="text-lg font-semibold">Event Registrations</h3>
            <p class="text-green-100 text-sm mt-1">Register students for events</p>
          </div>
          <svg class="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
      </div>

      <!-- Recent Students -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Recent Students</h2>
        </div>
        <div class="p-6">
          <div v-if="loading" class="text-center py-8 text-gray-500">
            Loading...
          </div>
          <div v-else-if="recentStudents.length === 0" class="text-center py-8 text-gray-500">
            No students added yet. Click "Manage Students" to add your first student.
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="student in recentStudents"
              :key="student.id"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div class="flex items-center gap-4">
                <img
                  v-if="student.photoUrl"
                  :src="toFullUrl(student.photoUrl)"
                  :alt="student.studentName"
                  class="w-12 h-12 rounded-full object-cover"
                />
                <div
                  v-else
                  class="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center"
                >
                  <span class="text-blue-700 font-semibold text-lg">
                    {{ student.studentName.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div>
                  <p class="font-medium text-gray-900">{{ student.studentName }}</p>
                  <p class="text-sm text-gray-500">
                    {{ student.class }} • {{ student.ageCategory }} • {{ student.chestNumber }}
                  </p>
                </div>
              </div>
              <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {{ student.studentId }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { toFullUrl } = useUrl()

const faculty = ref<any>(null)
const loading = ref(true)
const recentStudents = ref<any[]>([])
const registrations = ref<any[]>([])

const stats = computed(() => ({
  totalStudents: recentStudents.value.length,
  totalRegistrations: registrations.value.length,
}))

onMounted(async () => {
  // Check if faculty is logged in
  const storedFaculty = localStorage.getItem('faculty')
  if (!storedFaculty) {
    router.push('/faculty/login')
    return
  }

  faculty.value = JSON.parse(storedFaculty)

  // Fetch data
  try {
    const [studentsRes, registrationsRes] = await Promise.all([
      $fetch(`/api/students/by-school?schoolId=${faculty.value.schoolId}`),
      $fetch(`/api/registrations/by-school?schoolId=${faculty.value.schoolId}`),
    ])

    recentStudents.value = studentsRes.students.slice(0, 5)
    registrations.value = registrationsRes.registrations
  } catch (err) {
    console.error('Failed to fetch data:', err)
  } finally {
    loading.value = false
  }
})

const handleLogout = () => {
  localStorage.removeItem('faculty')
  router.push('/faculty/login')
}
</script>
