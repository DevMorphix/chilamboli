<template>
  <div class="min-h-screen bg-gray-50 grid grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <NuxtLink to="/faculty/faculty" class="text-indigo-600 hover:text-indigo-700 text-sm mb-2 inline-block">
          ← Back to Faculty
        </NuxtLink>
        <h1 class="text-2xl font-bold text-gray-900">Add New Faculty</h1>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div class="bg-white rounded-lg shadow p-8">
        
        <div v-if="!isRegistrationOpen" class="text-center py-12">
          <div class="mb-6">
            <svg class="mx-auto h-16 w-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Registration Closed</h2>
          <p class="text-gray-600 mb-6">New faculty members cannot be added at this time. However, you can still update existing faculty details.</p>
          <NuxtLink
            to="/faculty/faculty"
            class="inline-block px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
          >
            Back to Faculty
          </NuxtLink>
        </div>
        
        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Faculty Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Faculty Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.facultyName"
              type="text"
              required
              placeholder="Enter full name"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <!-- Mobile Number -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.mobileNumber"
              type="tel"
              required
              placeholder="Enter mobile number"
              pattern="[0-9]{10}"
              maxlength="10"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p class="text-xs text-gray-500 mt-1">10-digit mobile number</p>
          </div>

          <!-- Info Message -->
          <div class="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
            <p class="font-medium">Note:</p>
            <p class="mt-1">This will create a faculty record only. Authentication setup (email/password) must be done separately through the registration process.</p>
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
              class="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {{ loading ? 'Adding Faculty...' : 'Add Faculty' }}
            </button>
            <NuxtLink
              to="/faculty/faculty"
              class="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </NuxtLink>
          </div>
        </form>
      </div>
    </main>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { faculty, checkAuth } = useFaculty()
const { isRegistrationOpen } = useRegistration()

const loading = ref(false)
const error = ref('')

const formData = ref({
  facultyName: '',
  mobileNumber: '',
})

onMounted(() => {
  checkAuth()
})

const handleSubmit = async () => {
  error.value = ''
  
  // Validation
  if (formData.value.mobileNumber.length !== 10) {
    error.value = 'Mobile number must be 10 digits'
    return
  }

  loading.value = true

  try {
    await $fetch('/api/faculty/create', {
      method: 'POST',
      body: {
        schoolId: faculty.value.schoolId,
        facultyName: formData.value.facultyName,
        mobileNumber: formData.value.mobileNumber,
        createdByFacultyId: faculty.value.id,
      },
    })

    router.push('/faculty/faculty')
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to add faculty. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

