<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Judge Login</h1>
        <p class="text-gray-600 mt-2">Access your judging portal</p>
      </div>

      <div class="bg-white rounded-lg shadow-lg p-8">
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <input
              v-model="formData.mobileNumber"
              type="tel"
              required
              placeholder="10 digit mobile number"
              maxlength="10"
              pattern="[0-9]{10}"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">PIN</label>
            <input
              v-model="formData.pin"
              type="password"
              required
              placeholder="Enter your PIN"
              maxlength="4"
              pattern="[0-9]{4}"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            <NuxtLink to="/" class="text-purple-600 hover:text-purple-700 font-medium">
              Back to Home
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

const loading = ref(false)
const error = ref('')

const formData = ref({
  mobileNumber: '',
  pin: '',
})

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  // Validate mobile number format
  if (!/^\d{10}$/.test(formData.value.mobileNumber)) {
    error.value = 'Mobile number must be 10 digits'
    loading.value = false
    return
  }

  // Validate PIN format
  if (!/^\d{4}$/.test(formData.value.pin)) {
    error.value = 'PIN must be 4 digits'
    loading.value = false
    return
  }

  try {
    const response = await $fetch('/api/judge/login', {
      method: 'POST',
      body: {
        mobileNumber: formData.value.mobileNumber,
        pin: formData.value.pin,
      },
    })

    // Store judge data in localStorage
    localStorage.setItem('judge', JSON.stringify(response.judge))

    // Navigate to dashboard
    router.push('/judge/dashboard')
  } catch (err: any) {
    error.value = err.data?.message || 'Login failed. Please check your credentials.'
  } finally {
    loading.value = false
  }
}
</script>
