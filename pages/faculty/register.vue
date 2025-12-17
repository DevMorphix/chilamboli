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
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Faculty Registration</h1>
        <p class="text-gray-600 mt-2">Register your school account</p>
      </div>

      <div class="bg-white rounded-lg shadow-lg p-8">
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">School</label>
            <select
              v-model="formData.schoolId"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select your school</option>
              <option v-for="school in schools" :key="school.id" :value="school.id">
                {{ school.name }}
              </option>
            </select>
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
const loading = ref(false)
const error = ref('')

const formData = ref({
  schoolId: '',
  facultyName: '',
  mobileNumber: '',
  schoolEmail: '',
  password: '',
  confirmPassword: '',
})

onMounted(async () => {
  try {
    const response = await $fetch('/api/schools')
    schools.value = response
  } catch (err) {
    console.error('Failed to fetch schools:', err)
  }
})

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
