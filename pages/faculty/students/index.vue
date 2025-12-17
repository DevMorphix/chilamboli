import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
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
            <h1 class="text-2xl font-bold text-gray-900">Student Management</h1>
          </div>
          <NuxtLink
            to="/faculty/students/add"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
          >
            + Add Student
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <input
              v-model="filterClass"
              type="text"
              placeholder="Filter by class..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- Students List -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">
            Students ({{ filteredStudents.length }})
          </h2>
        </div>

        <div v-if="loading" class="text-center py-12 text-gray-500">
          Loading students...
        </div>

        <div v-else-if="filteredStudents.length === 0" class="text-center py-12 text-gray-500">
          <p>No students found.</p>
          <NuxtLink to="/faculty/students/add" class="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block">
            Add your first student
          </NuxtLink>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student ID
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chest No
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="student in filteredStudents" :key="student.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <img
                      v-if="student.photoUrl"
                      :src="student.photoUrl"
                      :alt="student.studentName"
                      class="w-10 h-10 rounded-full object-cover"
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
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ student.chestNumber }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ student.class }}
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
                    class="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Edit
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

const faculty = ref<any>(null)
const students = ref<any[]>([])
const loading = ref(true)
const searchQuery = ref('')
const filterCategory = ref('')
const filterClass = ref('')

const filteredStudents = computed(() => {
  let filtered = students.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (s) =>
        s.studentName.toLowerCase().includes(query) ||
        s.studentId.toLowerCase().includes(query) ||
        s.chestNumber.toLowerCase().includes(query)
    )
  }

  if (filterCategory.value) {
    filtered = filtered.filter((s) => s.ageCategory === filterCategory.value)
  }

  if (filterClass.value) {
    filtered = filtered.filter((s) => s.class.toLowerCase().includes(filterClass.value.toLowerCase()))
  }

  return filtered
})

onMounted(async () => {
  const storedFaculty = localStorage.getItem('faculty')
  if (!storedFaculty) {
    router.push('/faculty/login')
    return
  }

  faculty.value = JSON.parse(storedFaculty)

  try {
    const response = await $fetch(`/api/students/by-school?schoolId=${faculty.value.schoolId}`)
    students.value = response.students
  } catch (err) {
    console.error('Failed to fetch students:', err)
  } finally {
    loading.value = false
  }
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB')
}
</script>
