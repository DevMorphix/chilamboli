<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Faculty Registration</h1>
        <p class="text-gray-600 mt-2">Register your school account</p>
      </div>

      <div class="bg-white rounded-lg shadow-lg p-8">
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              v-model="selectedLocation"
              @change="handleLocationChange"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select location</option>
              <option v-for="location in locations" :key="location" :value="location">
                {{ location }}
              </option>
            </select>
          </div>

          <div class="relative" id="school-select-container">
            <label class="block text-sm font-medium text-gray-700 mb-1">School</label>
            <div v-if="!selectedLocation" class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500">
              Please select a location first
            </div>
            <div v-else class="relative">
              <input
                v-model="schoolSearchQuery"
                type="text"
                :placeholder="loadingSchools ? 'Loading...' : 'Search school...'"
                :disabled="loadingSchools"
                @focus="showSchoolDropdown = true"
                class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <div
                v-if="showSchoolDropdown && filteredSchools.length > 0"
                class="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
              >
                <div
                  v-for="school in filteredSchools"
                  :key="school.id"
                  @click="selectSchool(school)"
                  class="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {{ school.name }}
                </div>
              </div>
              
              <input
                v-model="formData.schoolId"
                type="hidden"
                required
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Faculty Name</label>
            <input
              v-model="formData.facultyName"
              type="text"
              required
              placeholder="Enter your full name"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <input
              v-model="formData.mobileNumber"
              type="tel"
              required
              placeholder="10 digit mobile number"
              pattern="[0-9]{10}"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">School Email</label>
            <input
              v-model="formData.schoolEmail"
              type="email"
              required
              placeholder="faculty@school.edu"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              v-model="formData.password"
              type="password"
              required
              minlength="6"
              placeholder="Minimum 6 characters"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              v-model="formData.confirmPassword"
              type="password"
              required
              placeholder="Re-enter password"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {{ loading ? 'Registering...' : 'Register' }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            Already have an account?
            <NuxtLink to="/faculty/login" class="text-blue-600 hover:text-blue-700 font-medium">
              Login here
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

const schools = ref([])
const selectedLocation = ref('')
const schoolSearchQuery = ref('')
const showSchoolDropdown = ref(false)
const selectedSchoolName = ref('')
const loading = ref(false)
const loadingSchools = ref(false)
const error = ref('')

const locations = [
  'Alappuzha',
  'Ernakulam',
  'Idukki',
  'Kannur',
  'Kasaragod',
  'Kollam',
  'Kottayam',
  'Kozhikode',
  'Malappuram',
  'Palakkad',
  'Pathanamthitta',
  'Thrissur',
  'Thiruvananthapuram',
  'Wayanad'
]

const formData = ref({
  schoolId: '',
  facultyName: '',
  mobileNumber: '',
  schoolEmail: '',
  password: '',
  confirmPassword: '',
})

const filteredSchools = computed(() => {
  if (!schoolSearchQuery.value) {
    return schools.value
  }
  const query = schoolSearchQuery.value.toLowerCase()
  return schools.value.filter((school: any) =>
    school.name.toLowerCase().includes(query)
  )
})

const selectSchool = (school: any) => {
  formData.value.schoolId = school.id
  selectedSchoolName.value = school.name
  schoolSearchQuery.value = school.name
  showSchoolDropdown.value = false
}

const handleLocationChange = async () => {
  formData.value.schoolId = ''
  schools.value = []
  schoolSearchQuery.value = ''
  selectedSchoolName.value = ''
  showSchoolDropdown.value = false
  
  if (!selectedLocation.value) {
    return
  }
  
  loadingSchools.value = true
  try {
    const response = await $fetch('/api/schools', {
      params: {
        location: selectedLocation.value,
        limit: 100,
      },
    })
    schools.value = response.data || response || []
  } catch (err) {
    console.error('Failed to fetch schools:', err)
    error.value = 'Failed to load schools. Please try again.'
  } finally {
    loadingSchools.value = false
  }
}

// Close dropdown when clicking outside
if (process.client) {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const container = document.getElementById('school-select-container')
    if (container && !container.contains(target)) {
      showSchoolDropdown.value = false
    }
  })
}

const handleRegister = async () => {
  error.value = ''

  if (formData.value.password !== formData.value.confirmPassword) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true

  try {
    const response = await $fetch('/api/faculty/register', {
      method: 'POST',
      body: {
        schoolId: formData.value.schoolId,
        facultyName: formData.value.facultyName,
        mobileNumber: formData.value.mobileNumber,
        schoolEmail: formData.value.schoolEmail,
        password: formData.value.password,
      },
    })

    // Store faculty ID for OTP verification
    localStorage.setItem('pendingFacultyId', response.facultyId)
    localStorage.setItem('pendingFacultyEmail', formData.value.schoolEmail)
    
    // Show development OTP in console
    if (response.developmentOtp) {
      console.log('Development OTP:', response.developmentOtp)
    }

    // Navigate to verify page
    router.push('/faculty/verify')
  } catch (err: any) {
    error.value = err.data?.message || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
