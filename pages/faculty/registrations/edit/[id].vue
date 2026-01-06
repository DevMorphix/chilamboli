<template>
  <div class="min-h-screen bg-gray-50 grid grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <NuxtLink to="/faculty/registrations" class="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
          ← Back to Registrations
        </NuxtLink>
        <h1 class="text-2xl font-bold text-gray-900">Edit Event Registration</h1>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div v-if="loadingRegistration" class="text-center py-12 text-gray-500">
        Loading registration data...
      </div>

      <div v-else-if="registration && selectedEvent" class="bg-white rounded-lg shadow p-8">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Event Info (Read-only) -->
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Event Information</h3>
            <div class="p-4 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-700">
                <span class="font-medium">Event:</span> {{ selectedEvent.name }}
              </p>
              <p class="text-sm text-gray-700 mt-1">
                <span class="font-medium">Type:</span> {{ selectedEvent.eventType }}<template v-if="selectedEvent.ageCategory === 'Combined'"> (Combined)</template> •
                <span class="font-medium">Category:</span> {{ selectedEvent.ageCategory }}
                <template v-if="selectedEvent.maxTeamSize">
                  • <span class="font-medium">Max Team Size:</span> {{ selectedEvent.maxTeamSize }}
                </template>
              </p>
              <p v-if="selectedEvent.description" class="text-sm text-gray-600 mt-1">
                {{ selectedEvent.description }}
              </p>
            </div>
          </div>

          <!-- Team Name (for group events) -->
          <div v-if="selectedEvent.eventType === 'Group'">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Team Name</h3>
            <input
              v-model="teamName"
              type="text"
              required
              placeholder="Enter team name"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Select Participants (for regular events) -->
          <div v-if="!isSpecialGroupEvent">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Select Participants</h3>

            <div class="mb-4">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search participants by name..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div class="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
              <div
                v-for="student in filteredStudents"
                :key="student.id"
                class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                @click="toggleStudent(student)"
              >
                <input
                  type="checkbox"
                  :checked="selectedStudentIds.includes(student.id)"
                  class="w-4 h-4 text-blue-600"
                  @click.stop="toggleStudent(student)"
                />
                <img
                  v-if="student.photoUrl"
                  :src="toFullUrl(student.photoUrl)"
                  :alt="student.studentName"
                  class="w-10 h-10 rounded-full object-cover border border-gray-200 p-0.5"
                />
                <div
                  v-else
                  class="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center"
                >
                  <span class="text-blue-700 font-semibold">
                    {{ student.studentName.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900">{{ student.studentName }}</p>
                  <p class="text-xs text-gray-500">
                    {{ student.ageCategory }} • {{ student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : '' }}
                  </p>
                </div>
                <div v-if="getStudentRegistrationStatus(student.id)" class="text-xs text-gray-500">
                  {{ getStudentRegistrationStatus(student.id) }}
                </div>
              </div>

              <div v-if="filteredStudents.length === 0" class="text-center py-8 text-gray-500">
                No eligible participants found
              </div>
            </div>

            <p class="text-sm text-gray-600 mt-2">
              Selected: {{ selectedStudentIds.length }}
              <template v-if="selectedEvent.eventType === 'Individual'">
                (Individual event - select 1 student)
              </template>
              <template v-else-if="selectedEvent.maxTeamSize">
                / {{ selectedEvent.maxTeamSize }} (max)
              </template>
            </p>
          </div>

          <!-- Select Faculty Participants (for Special Group events) -->
          <div v-if="isSpecialGroupEvent">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Select Faculty Participants</h3>
            <div class="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
              <div
                v-for="facultyMember in faculties"
                :key="facultyMember.id"
                class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                @click="toggleFaculty(facultyMember)"
              >
                <input
                  type="checkbox"
                  :checked="selectedFacultyIds.includes(facultyMember.id)"
                  class="w-4 h-4 text-blue-600"
                  @click.stop="toggleFaculty(facultyMember)"
                />
                <div
                  class="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center"
                >
                  <span class="text-blue-700 font-semibold">
                    {{ facultyMember.facultyName.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900">{{ facultyMember.facultyName }}</p>
                  <p class="text-xs text-gray-500">
                    {{ facultyMember.mobileNumber }}
                  </p>
                </div>
              </div>

              <div v-if="faculties.length === 0" class="text-center py-8 text-gray-500">
                No faculty members found
              </div>
            </div>

            <p class="text-sm text-gray-600 mt-2">
              Selected: {{ selectedFacultyIds.length }}
              <template v-if="selectedEvent.maxTeamSize">
                / {{ selectedEvent.maxTeamSize }} (max)
              </template>
            </p>
          </div>

          <!-- Error/Success Messages -->
          <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {{ error }}
          </div>

          <div v-if="success" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
            {{ success }}
          </div>

          <!-- Submit Button -->
          <div class="flex gap-3">
            <button
              type="submit"
              :disabled="loading || !canSubmit"
              class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {{ loading ? 'Updating...' : 'Update Registration' }}
            </button>
            <NuxtLink
              to="/faculty/registrations"
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
const route = useRoute()
const router = useRouter()
const { toFullUrl } = useUrl()

const registrationId = route.params.id as string
const faculty = ref<any>(null)
const registration = ref<any>(null)
const students = ref<any[]>([])
const faculties = ref<any[]>([])
const allRegistrations = ref<any[]>([])
const loadingRegistration = ref(true)
const loading = ref(false)
const error = ref('')
const success = ref('')

const selectedEvent = ref<any>(null)
const teamName = ref('')
const selectedStudentIds = ref<string[]>([])
const selectedFacultyIds = ref<string[]>([])
const searchQuery = ref('')
const searchResults = ref<any[]>([])
let searchTimeout: NodeJS.Timeout | null = null

const isSpecialGroupEvent = computed(() => {
  return selectedEvent.value?.ageCategory === 'Special' && selectedEvent.value?.eventType === 'Group'
})

const filteredStudents = computed(() => {
  if (!selectedEvent.value) return []
  
  const studentsToFilter = searchQuery.value.length >= 2 ? searchResults.value : students.value
  
  return studentsToFilter.filter((s) => {
    if (selectedEvent.value.ageCategory === 'Combined') {
      return true
    }
    return s.ageCategory === selectedEvent.value.ageCategory
  })
})

const canSubmit = computed(() => {
  if (!selectedEvent.value) return false
  
  // For special group events, check faculty selection
  if (isSpecialGroupEvent.value) {
    if (selectedFacultyIds.value.length === 0) return false
    if (!teamName.value) return false
    if (selectedEvent.value.maxTeamSize && selectedFacultyIds.value.length > selectedEvent.value.maxTeamSize) {
      return false
    }
    return true
  }
  
  // Regular events with students
  if (selectedStudentIds.value.length === 0) return false
  
  if (selectedEvent.value.eventType === 'Individual') {
    return selectedStudentIds.value.length === 1
  }
  
  if (selectedEvent.value.eventType === 'Group') {
    if (!teamName.value) return false
    if (selectedEvent.value.maxTeamSize && selectedStudentIds.value.length > selectedEvent.value.maxTeamSize) {
      return false
    }
  }
  
  return true
})

onMounted(async () => {
  const storedFaculty = localStorage.getItem('faculty')
  if (!storedFaculty) {
    router.push('/faculty/login')
    return
  }

  faculty.value = JSON.parse(storedFaculty)

  try {
    // Fetch registration details
    const registrationRes = await $fetch(`/api/registrations/${registrationId}`)
    registration.value = registrationRes
    selectedEvent.value = registrationRes.event
    
    teamName.value = registrationRes.teamName || ''
    
    // Set initially selected participants
    const isSpecialGroup = selectedEvent.value?.ageCategory === 'Special' && selectedEvent.value?.eventType === 'Group'
    
    if (isSpecialGroup) {
      if (registrationRes.facultyParticipants && Array.isArray(registrationRes.facultyParticipants)) {
        selectedFacultyIds.value = registrationRes.facultyParticipants.map((p: any) => p.id)
      }
    } else {
      if (registrationRes.participants && Array.isArray(registrationRes.participants)) {
        selectedStudentIds.value = registrationRes.participants.map((p: any) => p.id)
      }
    }
    if (selectedEvent.value && isSpecialGroup) {
      // Load faculties for Special Group events
      const [facultiesRes, registrationsRes] = await Promise.all([
        $fetch(`/api/faculty/by-school?schoolId=${faculty.value.schoolId}&limit=100`),
        $fetch(`/api/registrations/by-school?schoolId=${faculty.value.schoolId}&sortBy=createdAt&sortOrder=desc`),
      ])
      faculties.value = facultiesRes.data || []
      allRegistrations.value = registrationsRes.data || registrationsRes.registrations || []
    } else if (selectedEvent.value && selectedEvent.value.ageCategory !== 'Special') {
      const params: any = {
        schoolId: faculty.value.schoolId,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 100,
      }
      if (selectedEvent.value.ageCategory !== 'Combined') {
        params.ageCategory = selectedEvent.value.ageCategory
      }

      const [studentsRes, registrationsRes] = await Promise.all([
        $fetch(`/api/students/by-school`, { params }),
        $fetch(`/api/registrations/by-school?schoolId=${faculty.value.schoolId}&sortBy=createdAt&sortOrder=desc`),
      ])
      students.value = studentsRes.data || studentsRes.students || []
      allRegistrations.value = registrationsRes.data || registrationsRes.registrations || []
    } else {
      const registrationsRes = await $fetch(`/api/registrations/by-school?schoolId=${faculty.value.schoolId}&sortBy=createdAt&sortOrder=desc`)
      allRegistrations.value = registrationsRes.data || registrationsRes.registrations || []
    }
  } catch (err: any) {
    console.error('Failed to fetch data:', err)
    error.value = err.data?.message || 'Failed to load registration. Please try again.'
  } finally {
    loadingRegistration.value = false
  }
})

watch(searchQuery, async () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (!faculty.value || !selectedEvent.value || searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }
  
  searchTimeout = setTimeout(async () => {
    try {
      const response = await $fetch('/api/students/search', {
        params: {
          q: searchQuery.value,
          schoolId: faculty.value.schoolId,
          ageCategory: selectedEvent.value.ageCategory,
          limit: 100,
        },
      })
      searchResults.value = response.data || response.students || []
    } catch (err) {
      console.error('Failed to search students:', err)
      searchResults.value = []
    }
  }, 300)
})

const toggleStudent = (student: any) => {
  const index = selectedStudentIds.value.indexOf(student.id)
  
  if (index > -1) {
    selectedStudentIds.value.splice(index, 1)
  } else {
    if (selectedEvent.value.eventType === 'Individual') {
      selectedStudentIds.value = [student.id]
    } else {
      if (selectedEvent.value.maxTeamSize && selectedStudentIds.value.length >= selectedEvent.value.maxTeamSize) {
        error.value = `Maximum ${selectedEvent.value.maxTeamSize} participants allowed`
        return
      }
      selectedStudentIds.value.push(student.id)
    }
  }
  error.value = ''
}

const toggleFaculty = (facultyMember: any) => {
  const index = selectedFacultyIds.value.indexOf(facultyMember.id)
  
  if (index > -1) {
    selectedFacultyIds.value.splice(index, 1)
  } else {
    if (selectedEvent.value.maxTeamSize && selectedFacultyIds.value.length >= selectedEvent.value.maxTeamSize) {
      error.value = `Maximum ${selectedEvent.value.maxTeamSize} participants allowed`
      return
    }
    selectedFacultyIds.value.push(facultyMember.id)
  }
  error.value = ''
}

const getStudentRegistrationStatus = (studentId: string) => {
  const studentRegs = allRegistrations.value.filter((r) => {
    // Skip the current registration being edited
    if (r.id === registrationId) return false
    
    // Prefer participantIds if available, otherwise check participants array
    if (r.participantIds && Array.isArray(r.participantIds)) {
      return r.participantIds.includes(studentId)
    }
    // Fallback to checking participants array
    if (r.participants && Array.isArray(r.participants)) {
      return r.participants.some((p: any) => p.id === studentId)
    }
    return false
  })

  let individualCount = 0
  let groupCount = 0

  for (const reg of studentRegs) {
    if (!reg.event) continue
    
    // Skip Combined and Fashion Show
    if (reg.event.ageCategory === 'Combined' || reg.event.name === 'Fashion Show') continue
    
    if (reg.event.eventType === 'Individual') individualCount++
    if (reg.event.eventType === 'Group') groupCount++
  }

  const statuses = []
  if (individualCount > 0) statuses.push(`${individualCount} Ind`)
  if (groupCount > 0) statuses.push(`${groupCount} Grp`)
  
  return statuses.length > 0 ? statuses.join(', ') : ''
}

const handleSubmit = async () => {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    await $fetch(`/api/registrations/${registrationId}`, {
      method: 'PATCH',
      body: {
        teamName: teamName.value || null,
        participantIds: isSpecialGroupEvent.value ? selectedFacultyIds.value : selectedStudentIds.value,
        participantType: isSpecialGroupEvent.value ? 'faculty' : 'student',
      },
    })

    success.value = 'Registration updated successfully!'
    
    setTimeout(() => {
      router.push('/faculty/registrations')
    }, 2000)
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to update registration. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

