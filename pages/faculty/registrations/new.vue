<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <NuxtLink to="/faculty/registrations" class="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
          ← Back to Registrations
        </NuxtLink>
        <h1 class="text-2xl font-bold text-gray-900">New Event Registration</h1>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-lg shadow p-8">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Step 1: Select Event -->
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-4">1. Select Event</h3>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Age Category</label>
              <select
                v-model="selectedAgeCategory"
                @change="loadEvents"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select age category</option>
                <option value="Sub Junior">Sub Junior</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
                <option value="Special">Special (Faculty Only)</option>
              </select>
            </div>

            <div v-if="selectedAgeCategory">
              <label class="block text-sm font-medium text-gray-700 mb-1">Event</label>
              <select
                v-model="selectedEventId"
                @change="onEventSelect"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an event</option>
                <option v-for="event in availableEvents" :key="event.id" :value="event.id">
                  {{ event.name }} - {{ event.eventType }}<template v-if="event.ageCategory === 'Combined'"> (Combined)</template>
                  <template v-if="event.maxTeamSize">(Max {{ event.maxTeamSize }} members)</template>
                </option>
              </select>

              <div v-if="selectedEvent" class="mt-3 p-4 bg-blue-50 rounded-lg">
                <p class="text-sm text-gray-700">
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
          </div>

          <!-- Step 2: Faculty Self-Registration (for special events) -->
          <div v-if="selectedEvent && isSpecialEvent" class="p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">2. Confirm Registration</h3>
            <p class="text-sm text-gray-700 mb-4">
              This is a special event for faculty members. You will be registering yourself for this event.
            </p>
            <div class="bg-white p-4 rounded-md border border-blue-300">
              <p class="text-sm font-medium text-gray-900">{{ faculty?.facultyName }}</p>
              <p class="text-xs text-gray-600 mt-1">{{ faculty?.schoolEmail }}</p>
              <p class="text-xs text-gray-600">{{ faculty?.schoolName }}</p>
            </div>
          </div>

          <!-- Step 2: Team Name (for group events) -->
          <div v-if="selectedEvent && selectedEvent.eventType === 'Group' && !isSpecialEvent">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">2. Team Name</h3>
            <input
              v-model="teamName"
              type="text"
              required
              placeholder="Enter team name"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Step 3: Select Participants -->
          <div v-if="selectedEvent && !isSpecialEvent">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              {{ selectedEvent.eventType === 'Group' ? '3' : '2' }}. Select Participants
            </h3>

            <div class="mb-4">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search students by name..."
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
                No eligible students found
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
              class="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {{ loading ? 'Registering...' : (isSpecialEvent ? 'Register Myself' : 'Register for Event') }}
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
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { toFullUrl } = useUrl()

const faculty = ref<any>(null)
const students = ref<any[]>([])
const availableEvents = ref<any[]>([])
const allRegistrations = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const success = ref('')

const selectedAgeCategory = ref('')
const selectedEventId = ref('')
const selectedEvent = ref<any>(null)
const teamName = ref('')
const selectedStudentIds = ref<string[]>([])
const searchQuery = ref('')

const isSpecialEvent = computed(() => {
  return selectedEvent.value?.ageCategory === 'Special' && selectedEvent.value?.eventType === 'Individual'
})

const filteredStudents = computed(() => {
  if (!selectedEvent.value) return []
  
  let filtered = students.value.filter((s) => {
    // Filter by age category (include students from selected category or Combined events allow all)
    if (selectedEvent.value.ageCategory === 'Combined') {
      return true
    }
    return s.ageCategory === selectedEvent.value.ageCategory
  })

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((s) =>
      s.studentName?.toLowerCase().includes(query) ||
      s.studentId?.toLowerCase().includes(query)
    )
  }

  return filtered
})

const canSubmit = computed(() => {
  if (!selectedEvent.value) return false
  
  // For special events, faculty registers themselves (no student selection needed)
  if (isSpecialEvent.value) {
    return true
  }
  
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
    const [studentsRes, registrationsRes] = await Promise.all([
      $fetch(`/api/students/by-school?schoolId=${faculty.value.schoolId}&sortBy=createdAt&sortOrder=desc`),
      $fetch(`/api/registrations/by-school?schoolId=${faculty.value.schoolId}&sortBy=createdAt&sortOrder=desc`),
    ])
    students.value = studentsRes.data || studentsRes.students || []
    allRegistrations.value = registrationsRes.data || registrationsRes.registrations || []
  } catch (err) {
    console.error('Failed to fetch data:', err)
  }
})

const loadEvents = async () => {
  if (!selectedAgeCategory.value) {
    availableEvents.value = []
    return
  }

  try {
    const response = await $fetch(`/api/events/by-category?ageCategory=${selectedAgeCategory.value}&limit=100`)
    availableEvents.value = response.data || response.events || []
  } catch (err) {
    console.error('Failed to fetch events:', err)
  }
}

const onEventSelect = () => {
  selectedEvent.value = availableEvents.value.find((e) => e.id === selectedEventId.value)
  selectedStudentIds.value = []
  teamName.value = ''
  error.value = ''
}

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
}

const getStudentRegistrationStatus = (studentId: string) => {
  const studentRegs = allRegistrations.value.filter((r) => {
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
    await $fetch('/api/registrations/create', {
      method: 'POST',
      body: {
        eventId: selectedEventId.value,
        schoolId: faculty.value.schoolId,
        teamName: teamName.value || null,
        participantIds: isSpecialEvent.value ? [] : selectedStudentIds.value,
        registeredByFacultyId: faculty.value.id,
        isFacultySelfRegistration: isSpecialEvent.value,
      },
    })

    success.value = 'Registration successful!'
    
    setTimeout(() => {
      router.push('/faculty/registrations')
    }, 2000)
  } catch (err: any) {
    error.value = err.data?.message || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
