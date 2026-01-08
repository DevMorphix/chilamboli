<template>
  <div class="min-h-screen bg-gray-50 grid grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <NuxtLink to="/faculty/students" class="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
          ← Back to Students
        </NuxtLink>
        <h1 class="text-2xl font-bold text-gray-900">Add New Student</h1>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div class="bg-white rounded-lg shadow p-8">
        <div class="text-center py-12">
          <div class="mb-6">
            <svg class="mx-auto h-16 w-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Registration Closed</h2>
          <p class="text-gray-600 mb-6">New students cannot be added at this time. However, you can still update existing student details.</p>
          <NuxtLink
            to="/faculty/students"
            class="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
          >
            Back to Students
          </NuxtLink>
        </div>
        <!-- Registration is closed - form commented out but kept for reference -->
        <form v-if="false" @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Student Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Student Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.studentName"
              type="text"
              required
              placeholder="Enter full name"
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
            <p v-if="calculatedCategory" class="text-sm text-gray-600 mt-1">
              Age Category: <span class="font-medium">{{ calculatedCategory }}</span>
            </p>
          </div>

          <!-- Gender -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Gender <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formData.gender"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="others">Others</option>
            </select>
          </div>

          <!-- Photo Upload -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Student Photo
            </label>
            <div class="mt-2">
              <input
                ref="photoInput"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                @change="handlePhotoChange"
                class="hidden"
              />
              <div
                v-if="!photoPreview"
                @click="$refs.photoInput.click()"
                class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
              >
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="mt-2 text-sm text-gray-600">Click to upload student photo</p>
                <p class="text-xs text-gray-500 mt-1">JPEG, PNG, or WebP (Max 5MB)</p>
              </div>
              <div v-else class="relative">
                <img :src="photoPreview" alt="Preview" class="w-full h-48 object-cover rounded-lg" />
                <button
                  type="button"
                  @click="removePhoto"
                  class="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Disability Certificate Upload -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Disability Certificate
            </label>
            <div class="mt-2">
              <input
                ref="certificateInput"
                type="file"
                accept="application/pdf,image/jpeg,image/jpg,image/png"
                @change="handleCertificateChange"
                class="hidden"
              />
              <div
                v-if="!certificateFile"
                @click="$refs.certificateInput.click()"
                class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
              >
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="mt-2 text-sm text-gray-600">Click to upload certificate</p>
                <p class="text-xs text-gray-500 mt-1">PDF or Image (Max 5MB)</p>
              </div>
              <div v-else class="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900">{{ certificateFile.name }}</p>
                  <p class="text-xs text-gray-500">{{ (certificateFile.size / 1024).toFixed(2) }} KB</p>
                </div>
                <button
                  type="button"
                  @click="removeCertificate"
                  class="text-red-500 hover:text-red-600"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Birth Certificate Upload -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Birth Certificate
            </label>
            <div class="mt-2">
              <input
                ref="birthCertificateInput"
                type="file"
                accept="application/pdf,image/jpeg,image/jpg,image/png"
                @change="handleBirthCertificateChange"
                class="hidden"
              />
              <div
                v-if="!birthCertificateFile"
                @click="$refs.birthCertificateInput.click()"
                class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
              >
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="mt-2 text-sm text-gray-600">Click to upload birth certificate</p>
                <p class="text-xs text-gray-500 mt-1">PDF or Image (Max 5MB)</p>
              </div>
              <div v-else class="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900">{{ birthCertificateFile.name }}</p>
                  <p class="text-xs text-gray-500">{{ (birthCertificateFile.size / 1024).toFixed(2) }} KB</p>
                </div>
                <button
                  type="button"
                  @click="removeBirthCertificate"
                  class="text-red-500 hover:text-red-600"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
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
              {{ loading ? 'Adding Student...' : 'Add Student' }}
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

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { nanoid } from 'nanoid'

const router = useRouter()
const { faculty, checkAuth } = useFaculty()

const loading = ref(false)
const error = ref('')

const formData = ref({
  studentName: '',
  dateOfBirth: '',
  gender: '',
})

const photoFile = ref<File | null>(null)
const photoPreview = ref<string>('')
const certificateFile = ref<File | null>(null)
const birthCertificateFile = ref<File | null>(null)

const calculatedCategory = computed(() => {
  if (!formData.value.dateOfBirth) return ''

  const dob = new Date(formData.value.dateOfBirth)
  const subJuniorCutoff = new Date('2014-01-01')
  const seniorCutoff = new Date('2005-12-31')

  if (dob >= subJuniorCutoff) return 'Sub Junior'
  if (dob <= seniorCutoff) return 'Senior'
  return 'Junior'
})

onMounted(() => {
  checkAuth()
})

const handlePhotoChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    photoFile.value = file
    photoPreview.value = URL.createObjectURL(file)
  }
}

const removePhoto = () => {
  photoFile.value = null
  photoPreview.value = ''
}

const handleCertificateChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    certificateFile.value = file
  }
}

const removeCertificate = () => {
  certificateFile.value = null
}

const handleBirthCertificateChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    birthCertificateFile.value = file
  }
}

const removeBirthCertificate = () => {
  birthCertificateFile.value = null
}

const uploadFile = async (file: File, folder: string, filename: string): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await $fetch(`/api/upload?folder=${folder}&filename=${filename}`, {
    method: 'POST',
    body: formData,
  })

  return response.url
}

const handleSubmit = async () => {
  error.value = ''
  loading.value = true

  try {
    // Generate student ID first (same as backend)
    const id = nanoid()
    
    // Upload files only if they are provided
    let photoUrl: string | null = null
    let certificateUrl: string | null = null
    let birthCertificateUrl: string | null = null
    
    if (photoFile.value) {
      photoUrl = await uploadFile(photoFile.value, 'photo', `photo_${id}`)
    }
    
    if (certificateFile.value) {
      certificateUrl = await uploadFile(certificateFile.value, 'certificate', `certificate_${id}`)
    }
    
    if (birthCertificateFile.value) {
      birthCertificateUrl = await uploadFile(birthCertificateFile.value, 'birth-certificate', `birth_certificate_${id}`)
    }

    // Create student
    await $fetch('/api/students/create', {
      method: 'POST',
      body: {
        studentName: formData.value.studentName,
        dateOfBirth: formData.value.dateOfBirth,
        gender: formData.value.gender,
        photoUrl,
        disabilityCertificateUrl: certificateUrl,
        birthCertificateUrl,
        schoolId: faculty.value.schoolId,
        addedByFacultyId: faculty.value.id,
        id,
      },
    })

    router.push('/faculty/students')
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to add student. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
