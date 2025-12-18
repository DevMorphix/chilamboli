<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Faculty Login</h1>
        <p class="text-gray-600 mt-2">Access your dashboard</p>
      </div>

      <div class="bg-white rounded-lg shadow-lg p-8">
        <form @submit.prevent="handleLogin" class="space-y-4">
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
              placeholder="Enter your password"
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
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
        </form>

        <div class="mt-6 text-center space-y-2">
          <p class="text-sm text-gray-600">
            Don't have an account?
            <NuxtLink to="/faculty/register" class="text-blue-600 hover:text-blue-700 font-medium">
              Register here
            </NuxtLink>
          </p>
          <p class="text-sm text-gray-600">
            <NuxtLink to="/" class="text-blue-600 hover:text-blue-700 font-medium">
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
  schoolEmail: '',
  password: '',
})

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  try {
    const response = await $fetch('/api/faculty/login', {
      method: 'POST',
      body: {
        schoolEmail: formData.value.schoolEmail,
        password: formData.value.password,
      },
    })

    // Store faculty data in localStorage
    localStorage.setItem('faculty', JSON.stringify(response.faculty))

    // Navigate to dashboard
    router.push('/faculty/dashboard')
  } catch (err: any) {
    error.value = err.data?.message || 'Login failed. Please check your credentials.'
  } finally {
    loading.value = false
  }
}
</script>
