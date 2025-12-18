<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <NuxtLink to="/faculty/students" class="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
          ← Back to Students
        </NuxtLink>
        <h1 class="text-2xl font-bold text-gray-900">Edit Student</h1>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loadingStudent" class="text-center py-12 text-gray-500">
        Loading student data...
      </div>

      <div v-else-if="student" class="bg-white rounded-lg shadow p-8">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          
          <!-- Student Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Student Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.studentName"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Date of Birth -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.dateOfBirth"
              type="date"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Class and Roll Number -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <input
                v-model="formData.class"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
              <input
                v-model="formData.rollNumber"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {{ error }}
          </div>

          <!-- Submit Button -->
          <div class="flex gap-3">
            <button
              type="submit"
              :disabled="loading"
              class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {{ loading ? 'Updating...' : 'Update Student' }}
            </button>
            <NuxtLink
              to="/faculty/students"
              class="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </NuxtLink>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const studentId = route.params.id
const faculty = ref<any>(null)
const student = ref<any>(null)
const loadingStudent = ref(true)
const loading = ref(false)
const error = ref('')

const formData = ref({
  studentName: '',
  dateOfBirth: '',
  class: '',
  rollNumber: '',
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
    const studentsList = response.data || response.students || []
    student.value = studentsList.find((s: any) => s.id === studentId)
    
    if (student.value) {
      formData.value = {
        studentName: student.value.studentName,
        dateOfBirth: student.value.dateOfBirth,
        class: student.value.class,
        rollNumber: student.value.rollNumber,
      }
    }
  } catch (err) {
    console.error('Failed to fetch student:', err)
  } finally {
    loadingStudent.value = false
  }
})

const handleSubmit = async () => {
  error.value = ''
  loading.value = true

  try {
    await $fetch('/api/students/update', {
      method: 'PUT',
      body: {
        studentId: student.value.id,
        studentName: formData.value.studentName,
        dateOfBirth: formData.value.dateOfBirth,
        class: formData.value.class,
        rollNumber: formData.value.rollNumber,
      },
    })

    router.push('/faculty/students')
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to update student. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
