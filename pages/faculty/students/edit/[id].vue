<template>
  <div class="min-h-screen bg-gray-50 grid grid-rows-[auto_1fr_auto]">
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
    <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
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
              <div v-if="!photoPreview && !existingPhotoUrl" class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors" @click="$refs.photoInput.click()">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="mt-2 text-sm text-gray-600">Click to upload student photo</p>
                <p class="text-xs text-gray-500 mt-1">JPEG, PNG, or WebP (Max 5MB)</p>
              </div>
              <div v-else class="relative">
                <img :src="photoPreview || existingPhotoUrl" alt="Preview" class="w-full h-48 object-cover rounded-lg" />
                <button
                  type="button"
                  @click="removePhoto"
                  class="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <button
                  type="button"
                  @click="$refs.photoInput.click()"
                  class="absolute top-2 left-2 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
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
              <div v-if="!certificateFile && !existingCertificateUrl" class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors" @click="$refs.certificateInput.click()">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="mt-2 text-sm text-gray-600">Click to upload certificate</p>
                <p class="text-xs text-gray-500 mt-1">PDF or Image (Max 5MB)</p>
              </div>
              <div v-else class="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <svg v-if="!certificateFile" class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900">
                    {{ certificateFile ? certificateFile.name : 'Existing certificate' }}
                  </p>
                  <p v-if="certificateFile" class="text-xs text-gray-500">{{ (certificateFile.size / 1024).toFixed(2) }} KB</p>
                  <a v-else-if="existingCertificateUrl" :href="existingCertificateUrl" target="_blank" class="text-xs text-blue-600 hover:text-blue-700">View certificate</a>
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
                <button
                  type="button"
                  @click="$refs.certificateInput.click()"
                  class="text-blue-500 hover:text-blue-600"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
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
              <div v-if="!birthCertificateFile && !existingBirthCertificateUrl" class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors" @click="$refs.birthCertificateInput.click()">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="mt-2 text-sm text-gray-600">Click to upload birth certificate</p>
                <p class="text-xs text-gray-500 mt-1">PDF or Image (Max 5MB)</p>
              </div>
              <div v-else class="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <svg v-if="!birthCertificateFile" class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900">
                    {{ birthCertificateFile ? birthCertificateFile.name : 'Existing birth certificate' }}
                  </p>
                  <p v-if="birthCertificateFile" class="text-xs text-gray-500">{{ (birthCertificateFile.size / 1024).toFixed(2) }} KB</p>
                  <a v-else-if="existingBirthCertificateUrl" :href="existingBirthCertificateUrl" target="_blank" class="text-xs text-blue-600 hover:text-blue-700">View certificate</a>
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
                <button
                  type="button"
                  @click="$refs.birthCertificateInput.click()"
                  class="text-blue-500 hover:text-blue-600"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
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

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { nanoid } from 'nanoid'

const route = useRoute()
const router = useRouter()
const { toFullUrl } = useUrl()

const studentId = route.params.id
const faculty = ref<any>(null)
const student = ref<any>(null)
const loadingStudent = ref(true)
const loading = ref(false)
const error = ref('')

const formData = ref({
  studentName: '',
  dateOfBirth: '',
  gender: '',
})

const photoFile = ref<File | null>(null)
const photoPreview = ref<string>('')
const existingPhotoUrl = ref<string | null>(null)
const photoRemoved = ref(false)
const certificateFile = ref<File | null>(null)
const existingCertificateUrl = ref<string | null>(null)
const certificateRemoved = ref(false)
const birthCertificateFile = ref<File | null>(null)
const existingBirthCertificateUrl = ref<string | null>(null)
const birthCertificateRemoved = ref(false)

onMounted(async () => {
  const storedFaculty = localStorage.getItem('faculty')
  if (!storedFaculty) {
    router.push('/faculty/login')
    return
  }
  faculty.value = JSON.parse(storedFaculty)

  try {
    const response = await $fetch(`/api/students/${studentId}`)
    student.value = response.student || response
    
    if (student.value) {
      formData.value = {
        studentName: student.value.studentName,
        dateOfBirth: student.value.dateOfBirth,
        gender: student.value.gender,
      }
      existingPhotoUrl.value = student.value.photoUrl ? toFullUrl(student.value.photoUrl) : null
      existingCertificateUrl.value = student.value.disabilityCertificateUrl ? toFullUrl(student.value.disabilityCertificateUrl) : null
      existingBirthCertificateUrl.value = student.value.birthCertificateUrl ? toFullUrl(student.value.birthCertificateUrl) : null
    } else {
      error.value = 'Student not found'
    }
  } catch (err: any) {
    console.error('Failed to fetch student:', err)
    error.value = err.data?.message || 'Failed to load student. Please try again.'
  } finally {
    loadingStudent.value = false
  }
})

const handlePhotoChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    photoFile.value = file
    photoPreview.value = URL.createObjectURL(file)
    photoRemoved.value = false
  }
}

const removePhoto = () => {
  photoFile.value = null
  photoPreview.value = ''
  photoRemoved.value = true
  existingPhotoUrl.value = null
}

const handleCertificateChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    certificateFile.value = file
    certificateRemoved.value = false
  }
}

const removeCertificate = () => {
  certificateFile.value = null
  certificateRemoved.value = true
  existingCertificateUrl.value = null
}

const handleBirthCertificateChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    birthCertificateFile.value = file
    birthCertificateRemoved.value = false
  }
}

const removeBirthCertificate = () => {
  birthCertificateFile.value = null
  birthCertificateRemoved.value = true
  existingBirthCertificateUrl.value = null
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
    let photoUrl: string | null | undefined = undefined
    let certificateUrl: string | null | undefined = undefined
    let birthCertificateUrl: string | null | undefined = undefined
    
    // Upload new files if provided
    if (photoFile.value) {
      const uniquePhotoId = nanoid()
      photoUrl = await uploadFile(photoFile.value, 'photo', `photo_${uniquePhotoId}`)
    } else if (photoRemoved.value) {
      // If photo was explicitly removed, set to null
      photoUrl = null
    }
    
    if (certificateFile.value) {
      const uniqueCertId = nanoid()
      certificateUrl = await uploadFile(certificateFile.value, 'certificate', `certificate_${uniqueCertId}`)
    } else if (certificateRemoved.value) {
      // If certificate was explicitly removed, set to null
      certificateUrl = null
    }
    
    if (birthCertificateFile.value) {
      const uniqueBirthCertId = nanoid()
      birthCertificateUrl = await uploadFile(birthCertificateFile.value, 'birth-certificate', `birth_certificate_${uniqueBirthCertId}`)
    } else if (birthCertificateRemoved.value) {
      // If birth certificate was explicitly removed, set to null
      birthCertificateUrl = null
    }

    const updateBody: any = {
      studentId: student.value.id,
      studentName: formData.value.studentName,
      dateOfBirth: formData.value.dateOfBirth,
      gender: formData.value.gender,
    }

    // Only include photoUrl and certificateUrl if they were changed
    if (photoUrl !== undefined) {
      updateBody.photoUrl = photoUrl
    }
    if (certificateUrl !== undefined) {
      updateBody.disabilityCertificateUrl = certificateUrl
    }
    if (birthCertificateUrl !== undefined) {
      updateBody.birthCertificateUrl = birthCertificateUrl
    }

    await $fetch('/api/students/update', {
      method: 'PUT',
      body: updateBody,
    })

    router.push('/faculty/students')
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to update student. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
