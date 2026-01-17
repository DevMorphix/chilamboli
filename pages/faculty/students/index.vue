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
            <h1 class="text-2xl font-bold text-gray-900">Student Management</h1>
          </div>
          
          <NuxtLink
            v-if="isRegistrationOpen"
            to="/faculty/students/add"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
          >
            + Add Student
          </NuxtLink>
          <button
            v-else
            disabled
            class="px-4 py-2 bg-gray-400 text-white rounded-md font-medium cursor-not-allowed opacity-50"
          >
            + Add Student
          </button>

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
              placeholder="Search by name or ID..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Age Category</label>
            <select
              v-model="filterCategory"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="Sub Junior">Sub Junior</option>
              <option value="Junior">Junior</option>
              <option value="Senior">Senior</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Students List -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">
            Students ({{ metadata?.total || students.length }})
          </h2>
          <div v-if="metadata" class="text-sm text-gray-500">
            Page {{ metadata.page }} of {{ metadata.totalPages }}
          </div>
        </div>

        <div v-if="loading" class="text-center py-12 text-gray-500">
          Loading students...
        </div>

        <div v-else-if="students.length === 0" class="text-center py-12 text-gray-500">
          <p>No students found.</p>
          
          <NuxtLink 
            v-if="isRegistrationOpen"
            to="/faculty/students/add" 
            class="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
          >
            Add your first student
          </NuxtLink>
          <template v-else>
            <button
              disabled
              class="text-gray-400 cursor-not-allowed font-medium mt-2 inline-block pointer-events-none"
            >
              Add your first student
            </button>
            <p class="text-sm text-yellow-600 mt-2">Registration is closed. You can still update existing student details.</p>
          </template>
          
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th 
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  @click="handleSort('studentName')"
                >
                  <div class="flex items-center gap-1">
                    Student
                    <span v-if="sortBy === 'studentName'" class="text-blue-600">
                      {{ sortOrder === 'asc' ? '↑' : '↓' }}
                    </span>
                  </div>
                </th>
                <th 
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  @click="handleSort('studentId')"
                >
                  <div class="flex items-center gap-1">
                    Student ID
                    <span v-if="sortBy === 'studentId'" class="text-blue-600">
                      {{ sortOrder === 'asc' ? '↑' : '↓' }}
                    </span>
                  </div>
                </th>
                <th 
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  @click="handleSort('gender')"
                >
                  <div class="flex items-center gap-1">
                    Gender
                    <span v-if="sortBy === 'gender'" class="text-blue-600">
                      {{ sortOrder === 'asc' ? '↑' : '↓' }}
                    </span>
                  </div>
                </th>
                <th 
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  @click="handleSort('ageCategory')"
                >
                  <div class="flex items-center gap-1">
                    Category
                    <span v-if="sortBy === 'ageCategory'" class="text-blue-600">
                      {{ sortOrder === 'asc' ? '↑' : '↓' }}
                    </span>
                  </div>
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="student in students" :key="student.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <img
                      v-if="student.photoUrl"
                      :src="toFullUrl(student.photoUrl)"
                      :alt="student.studentName"
                      class="w-10 h-10 rounded-full object-cover border border-gray-200 p-0.5"
                    />
                    <div
                      v-else
                      class="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center"
                    >
                      <span class="text-blue-700 font-semibold">
                        {{ student.studentName.charAt(0).toUpperCase() }}
                      </span>
                    </div>
                    <div class="ml-3">
                      <p class="text-sm font-medium text-gray-900">{{ student.studentName }}</p>
                      <p class="text-sm text-gray-500">DOB: {{ formatDate(student.dateOfBirth) }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ student.studentId }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                  {{ student.gender }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="px-2 py-1 text-xs font-medium rounded-full"
                    :class="{
                      'bg-green-100 text-green-800': student.ageCategory === 'Sub Junior',
                      'bg-blue-100 text-blue-800': student.ageCategory === 'Junior',
                      'bg-purple-100 text-purple-800': student.ageCategory === 'Senior',
                    }"
                  >
                    {{ student.ageCategory }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <NuxtLink
                    :to="`/faculty/students/edit/${student.id}`"
                    class="text-blue-600 hover:text-blue-700 font-medium px-4 py-2 bg-blue-50 rounded"
                  >
                    Edit
                  </NuxtLink>
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
const { toFullUrl } = useUrl()
const { faculty, checkAuth } = useFaculty()
const { isRegistrationOpen } = useRegistration()

const students = ref<any[]>([])
const metadata = ref<any>(null)
const loading = ref(true)
const searchQuery = ref('')
const filterCategory = ref('')
const sortBy = ref<string>('createdAt')
const sortOrder = ref<'asc' | 'desc'>('desc')
const currentPage = ref(1)
const pageLimit = ref(10)

let searchTimeout: NodeJS.Timeout | null = null

const fetchStudents = async () => {
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

    if (filterCategory.value) {
      params.ageCategory = filterCategory.value
    }

    if (sortBy.value) {
      params.sortBy = sortBy.value
      params.sortOrder = sortOrder.value
    }

    const response = await $fetch(`/api/students/by-school`, { params })
    students.value = response.data || response.students || []
    metadata.value = response.metadata
  } catch (err) {
    console.error('Failed to fetch students:', err)
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
  fetchStudents()
}

const changePage = (page: number) => {
  currentPage.value = page
  fetchStudents()
}

// Debounce filter changes
watch([filterCategory], () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchStudents()
  }, 300)
})

// Debounce search separately
watch(searchQuery, () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchStudents()
  }, 300)
})

onMounted(async () => {
  if (!checkAuth()) {
    return
  }
  await fetchStudents()
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB')
}
</script>
