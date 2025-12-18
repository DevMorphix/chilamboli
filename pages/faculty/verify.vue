<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Verify Your Email</h1>
        <p class="text-gray-600 mt-2">Enter the OTP sent to {{ email }}</p>
      </div>

      <div class="bg-white rounded-lg shadow-lg p-8">
        <form @submit.prevent="handleVerify" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2 text-center">Enter 6-Digit OTP</label>
            <input
              v-model="otp"
              type="text"
              required
              maxlength="6"
              pattern="[0-9]{6}"
              placeholder="000000"
              class="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {{ error }}
          </div>

          <div v-if="success" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
            {{ success }}
          </div>

          <button
            type="submit"
            :disabled="loading || otp.length !== 6"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {{ loading ? 'Verifying...' : 'Verify OTP' }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            Didn't receive OTP?
            <button
              @click="handleResendOtp"
              :disabled="resendLoading || resendCooldown > 0"
              class="text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
            >
              {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP' }}
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

const facultyId = ref('')
const email = ref('')
const otp = ref('')
const loading = ref(false)
const resendLoading = ref(false)
const error = ref('')
const success = ref('')
const resendCooldown = ref(0)

onMounted(() => {
  facultyId.value = localStorage.getItem('pendingFacultyId') || ''
  email.value = localStorage.getItem('pendingFacultyEmail') || ''

  if (!facultyId.value) {
    router.push('/faculty/register')
  }
})

const handleVerify = async () => {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    const response = await $fetch('/api/faculty/verify-otp', {
      method: 'POST',
      body: {
        facultyId: facultyId.value,
        otp: otp.value,
      },
    })

    success.value = response.message
    
    // Clear stored data
    localStorage.removeItem('pendingFacultyId')
    localStorage.removeItem('pendingFacultyEmail')

    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push('/faculty/login')
    }, 2000)
  } catch (err: any) {
    error.value = err.data?.message || 'Verification failed. Please try again.'
  } finally {
    loading.value = false
  }
}

const handleResendOtp = async () => {
  error.value = ''
  success.value = ''
  resendLoading.value = true

  try {
    const response = await $fetch('/api/faculty/resend-otp', {
      method: 'POST',
      body: {
        facultyId: facultyId.value,
      },
    })

    success.value = response.message
    
    // Show development OTP in console
    if (response.developmentOtp) {
      console.log('Development OTP:', response.developmentOtp)
    }

    // Start cooldown
    resendCooldown.value = 60
    const interval = setInterval(() => {
      resendCooldown.value--
      if (resendCooldown.value <= 0) {
        clearInterval(interval)
      }
    }, 1000)
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to resend OTP.'
  } finally {
    resendLoading.value = false
  }
}
</script>
