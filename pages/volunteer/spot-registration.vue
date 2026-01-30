<template>
  <div class="min-h-screen bg-gray-50 grid grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <NuxtLink to="/volunteer/dashboard" class="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
          ← Back to Dashboard
        </NuxtLink>
        <h1 class="text-2xl font-bold text-gray-900">Spot Registration</h1>
        <p class="text-sm text-gray-600 mt-1">Add students and create registrations on the spot</p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div class="bg-white rounded-lg shadow p-8">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Step 0: Select School -->
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-4">1. Select School</h3>
            <div class="relative" data-school-select>
              <input
                v-model="schoolSearchQuery"
                @input="handleSchoolSearch"
                @focus="showSchoolDropdown = true"
                type="text"
                placeholder="Search for a school..."
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div
                v-if="showSchoolDropdown && filteredSchools.length > 0"
                class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
              >
                <div
                  v-for="school in filteredSchools"
                  :key="school.id"
                  @click="selectSchool(school)"
                  class="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <p class="font-medium text-gray-900">{{ school.name }}</p>
                  <p class="text-sm text-gray-500">{{ school.schoolCode }} • {{ school.location || 'No location' }}</p>
                </div>
              </div>
            </div>
            <p v-if="selectedSchool" class="mt-2 text-sm text-gray-600">
              Selected: <span class="font-medium">{{ selectedSchool.name }}</span>
            </p>
            <p v-if="selectedSchool && !selectedFaculty" class="mt-2 text-sm text-yellow-600">
              ⚠️ No faculty members found for this school. Please add at least one faculty member before creating registrations.
            </p>
          </div>

          <!-- Step 1: Select Event -->
          <div v-if="selectedSchool && selectedFaculty">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">2. Select Event</h3>
            
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
                <option value="Combined">Combined</option>
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

              <div v-if="selectedEvent" class="mt-3 space-y-3">
                <div class="p-4 bg-blue-50 rounded-lg">
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
                
                <!-- Warning for duplicate eventType + ageCategory -->
                <div v-if="existingSameType.length > 0" class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div class="flex items-start">
                    <div class="flex-shrink-0">
                      <svg class="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <div class="ml-3">
                      <h3 class="text-sm font-medium text-yellow-800">
                        Warning: Duplicate Registration Detected
                      </h3>
                      <div class="mt-2 text-sm text-yellow-700">
                        <p>
                          This school has already registered for <strong>{{ selectedEvent.eventType }}</strong> events in the <strong>{{ selectedEvent.ageCategory }}</strong> category.
                        </p>
                        <p class="mt-1">
                          Existing registration(s): <strong>{{ existingSameType.map(r => r.event?.name || 'Unknown').join(', ') }}</strong>
                        </p>
                        <p class="mt-2 font-medium">
                          Note: Schools are typically allowed only one registration per event type per age category (excluding Combined and Special events).
                        </p>
                        <p class="mt-1 text-xs italic">
                          You can still proceed with this registration if needed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: Team Name (for group events) -->
          <div v-if="selectedEvent && selectedEvent.eventType === 'Group'">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">3. Team Name</h3>
            <input
              v-model="teamName"
              type="text"
              required
              placeholder="Enter team name"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Step 3: Add New Students -->
          <div v-if="selectedEvent && selectedSchool && selectedFaculty">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              {{ selectedEvent.eventType === 'Group' ? '4' : '3' }}. Add New Students (Optional)
            </h3>
            <p class="text-sm text-gray-600 mb-4">You can add new students here, or skip to select existing students below.</p>
            
            <div class="space-y-4">
              <div
                v-for="(newStudent, index) in newStudents"
                :key="newStudent.id"
                class="border border-gray-200 rounded-lg p-4 space-y-4"
              >
                <div class="flex items-center justify-between mb-2">
                  <h4 class="font-medium text-gray-900">New Student {{ index + 1 }}</h4>
                  <button
                    v-if="newStudents.length > 1"
                    type="button"
                    @click="removeNewStudent(index)"
                    class="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Student Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="newStudent.studentName"
                      type="text"
                      placeholder="Enter student name"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="newStudent.dateOfBirth"
                      type="date"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Gender <span class="text-red-500">*</span>
                    </label>
                    <select
                      v-model="newStudent.gender"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="others">Others</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <button
                type="button"
                @click="addNewStudent"
                class="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                + Add Another Student
              </button>
            </div>
          </div>

          <!-- Step 4: Select Existing Participants -->
          <div v-if="selectedEvent && selectedSchool && selectedFaculty">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              {{ selectedEvent.eventType === 'Group' ? (newStudents.length > 0 ? '5' : '4') : (newStudents.length > 0 ? '4' : '3') }}. Select Existing Students
            </h3>

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
                <div v-if="studentRegistrationStatusMap.get(student.id)" class="text-xs text-gray-500">
                  {{ studentRegistrationStatusMap.get(student.id) }}
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
              {{ loading ? 'Processing...' : 'Create Registration' }}
            </button>
            <NuxtLink
              to="/volunteer/dashboard"
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
const { toFullUrl } = useUrl()
const { volunteer, checkAuth } = useVolunteer()

const schools = ref<any[]>([])
const schoolSearchQuery = ref('')
const showSchoolDropdown = ref(false)
const selectedSchool = ref<any>(null)
const selectedFaculty = ref<any>(null)

const availableEvents = ref<any[]>([])
const selectedAgeCategory = ref('')
const selectedEventId = ref('')
const selectedEvent = ref<any>(null)

let newStudentIdCounter = 0
const newStudents = ref<Array<{ id: number; studentName: string; dateOfBirth: string; gender: string }>>([
  { id: ++newStudentIdCounter, studentName: '', dateOfBirth: '', gender: '' },
])

const students = ref<any[]>([])
const allRegistrations = ref<any[]>([])
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const selectedStudentIds = ref<string[]>([])
const teamName = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null
let schoolSearchTimeout: ReturnType<typeof setTimeout> | null = null

const filteredSchools = computed(() => {
  if (!schoolSearchQuery.value) {
    return schools.value.slice(0, 10)
  }
  const query = schoolSearchQuery.value.toLowerCase()
  return schools.value.filter((school: any) =>
    school.name.toLowerCase().includes(query) ||
    school.schoolCode.toLowerCase().includes(query) ||
    (school.location && school.location.toLowerCase().includes(query))
  ).slice(0, 10)
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

// All existing registrations for this eventType + ageCategory combo (excluding Combined and Special)
const existingSameType = computed(() => {
  if (!selectedEvent.value || !selectedSchool.value || allRegistrations.value.length === 0) {
    return []
  }

  const eventType = selectedEvent.value.eventType
  const ageCategory = selectedEvent.value.ageCategory

  if (ageCategory === 'Combined' || ageCategory === 'Special') {
    return []
  }

  return allRegistrations.value.filter((reg: any) => {
    if (!reg.event) return false
    return (
      reg.event.eventType === eventType &&
      reg.event.ageCategory === ageCategory
    )
  })
})

const canSubmit = computed(() => {
  if (!selectedSchool.value || !selectedFaculty.value || !selectedEvent.value) return false
  
  // Check if we have at least one participant (new or existing)
  const validNewStudents = newStudents.value.filter(s => 
    s.studentName && s.dateOfBirth && s.gender
  )
  const hasNewStudents = validNewStudents.length > 0
  const hasExistingStudents = selectedStudentIds.value.length > 0
  
  if (!hasNewStudents && !hasExistingStudents) return false
  
  // For individual events, we need exactly 1 participant
  if (selectedEvent.value.eventType === 'Individual') {
    const totalParticipants = validNewStudents.length + selectedStudentIds.value.length
    if (totalParticipants !== 1) return false
  }
  
  // For group events, team name is required
  if (selectedEvent.value.eventType === 'Group') {
    if (!teamName.value) return false
    const totalParticipants = validNewStudents.length + selectedStudentIds.value.length
    if (selectedEvent.value.maxTeamSize && totalParticipants > selectedEvent.value.maxTeamSize) {
      return false
    }
  }
  
  return true
})


const loadSchools = async () => {
  try {
    const response = await $fetch('/api/schools', {
      params: { limit: 10 }
    })
    schools.value = response.data || response || []
  } catch (err) {
    console.error('Failed to fetch schools:', err)
    error.value = 'Failed to load schools. Please try again.'
  }
}

const handleSchoolSearch = () => {
  showSchoolDropdown.value = true
  if (schoolSearchTimeout) clearTimeout(schoolSearchTimeout)
  if (schoolSearchQuery.value.length < 2) return
  schoolSearchTimeout = setTimeout(async () => {
    schoolSearchTimeout = null
    try {
      const response = await $fetch('/api/schools', {
        params: { search: schoolSearchQuery.value.trim(), limit: 20 }
      })
      schools.value = response.data || response || []
    } catch (err) {
      console.error('Failed to search schools:', err)
    }
  }, 250)
}

const selectSchool = async (school: any) => {
  selectedSchool.value = school
  schoolSearchQuery.value = school.name
  showSchoolDropdown.value = false
  selectedFaculty.value = null
  selectedEventId.value = ''
  selectedEvent.value = null
  availableEvents.value = []
  students.value = []
  selectedStudentIds.value = []
  newStudents.value = [{ id: ++newStudentIdCounter, studentName: '', dateOfBirth: '', gender: '' }]
  error.value = ''
  allRegistrations.value = []

  // Get the first faculty from the school and fetch all registrations
  try {
    const [facultyRes, registrationsRes] = await Promise.all([
      $fetch(`/api/faculty/by-school?schoolId=${school.id}&limit=1`),
      $fetch(`/api/registrations/by-school?schoolId=${school.id}&limit=1000`)
    ])
    
    const facultyList = facultyRes.data || []
    if (facultyList.length > 0) {
      selectedFaculty.value = facultyList[0]
    } else {
      error.value = 'No faculty members found for this school. Please add at least one faculty member before creating registrations.'
    }
    
    // Store all registrations for this school
    allRegistrations.value = registrationsRes.data || registrationsRes.registrations || []
  } catch (err) {
    console.error('Failed to fetch faculty or registrations:', err)
    error.value = 'Failed to load faculty. Please try again.'
  }
}

const loadEvents = async () => {
  if (!selectedAgeCategory.value) {
    availableEvents.value = []
    return
  }

  try {
    const response = await $fetch(`/api/events/by-category?ageCategory=${selectedAgeCategory.value}&limit=100&registrationOpen=true`)
    availableEvents.value = response.data || response.events || []
  } catch (err) {
    console.error('Failed to fetch events:', err)
    error.value = 'Failed to load events. Please try again.'
  }
}

const onEventSelect = async () => {
  selectedEvent.value = availableEvents.value.find((e) => e.id === selectedEventId.value)
  selectedStudentIds.value = []
  students.value = []
  searchQuery.value = ''
  searchResults.value = []
  error.value = ''

  if (!selectedEvent.value || !selectedSchool.value) return

  try {
    const params: any = {
      schoolId: selectedSchool.value.id,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      limit: 1000,
    }
    if (selectedEvent.value.ageCategory !== 'Combined') {
      params.filters = JSON.stringify({ ageCategory: selectedEvent.value.ageCategory })
    }

    // Fetch students (registrations already fetched when school was selected)
    const studentsRes = await $fetch(`/api/students/by-school`, { params })
    students.value = studentsRes.data || studentsRes.students || []
    
    // Only refresh registrations if not already loaded
    if (allRegistrations.value.length === 0) {
      const registrationsRes = await $fetch(`/api/registrations/by-school?schoolId=${selectedSchool.value.id}&limit=1000`)
      allRegistrations.value = registrationsRes.data || registrationsRes.registrations || []
    }
  } catch (err) {
    console.error('Failed to fetch students:', err)
    error.value = 'Failed to load students. Please try again.'
  }
}

watch(searchQuery, async () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (!selectedSchool.value || !selectedEvent.value || searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }
  
  searchTimeout = setTimeout(async () => {
    try {
      const response = await $fetch('/api/students/search', {
        params: {
          q: searchQuery.value,
          schoolId: selectedSchool.value.id,
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

const addNewStudent = () => {
  newStudents.value.push({
    id: ++newStudentIdCounter,
    studentName: '',
    dateOfBirth: '',
    gender: '',
  })
}

const removeNewStudent = (index: number) => {
  newStudents.value.splice(index, 1)
}

const toggleStudent = (student: any) => {
  const index = selectedStudentIds.value.indexOf(student.id)
  
  if (index > -1) {
    selectedStudentIds.value.splice(index, 1)
  } else {
    if (selectedEvent.value.eventType === 'Individual') {
      selectedStudentIds.value = [student.id]
    } else {
      const validNewStudents = newStudents.value.filter(s => s.studentName && s.dateOfBirth && s.gender)
      if (selectedEvent.value.maxTeamSize && selectedStudentIds.value.length + validNewStudents.length >= selectedEvent.value.maxTeamSize) {
        error.value = `Maximum ${selectedEvent.value.maxTeamSize} participants allowed`
        return
      }
      selectedStudentIds.value.push(student.id)
    }
  }
  error.value = ''
}

const studentRegistrationStatusMap = computed(() => {
  const map = new Map<string, string>()
  const regs = allRegistrations.value
  for (const student of filteredStudents.value) {
    const studentRegs = regs.filter((r) => {
      if (r.participantIds && Array.isArray(r.participantIds)) return r.participantIds.includes(student.id)
      if (r.participants && Array.isArray(r.participants)) return r.participants.some((p: any) => p.id === student.id)
      return false
    })
    let individualCount = 0
    let groupCount = 0
    for (const reg of studentRegs) {
      if (!reg.event) continue
      if (reg.event.ageCategory === 'Combined' || reg.event.name === 'Fashion Show') continue
      if (reg.event.eventType === 'Individual') individualCount++
      if (reg.event.eventType === 'Group') groupCount++
    }
    const statuses = []
    if (individualCount > 0) statuses.push(`${individualCount} Ind`)
    if (groupCount > 0) statuses.push(`${groupCount} Grp`)
    map.set(student.id, statuses.length > 0 ? statuses.join(', ') : '')
  }
  return map
})

const handleSubmit = async () => {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    // Filter out empty new students
    const validNewStudents = newStudents.value.filter(s => 
      s.studentName && s.dateOfBirth && s.gender
    )

    const createPayloads = validNewStudents.map((s) => ({
      studentName: s.studentName,
      dateOfBirth: s.dateOfBirth,
      gender: s.gender,
      photoUrl: null,
      disabilityCertificateUrl: null,
      birthCertificateUrl: null,
      schoolId: selectedSchool.value.id,
      addedByFacultyId: selectedFaculty.value.id,
    }))
    let createResults: { student: { id: string } }[]
    try {
      createResults = await Promise.all(
        createPayloads.map((body) =>
          $fetch<{ student: { id: string } }>('/api/students/create', { method: 'POST', body })
        )
      )
    } catch (err: any) {
      throw new Error(err.data?.message || 'Failed to create student')
    }
    const createdStudentIds = createResults.map((r) => r.student.id)

    // Combine new and existing student IDs
    const allParticipantIds = [...createdStudentIds, ...selectedStudentIds.value]

    if (allParticipantIds.length === 0) {
      throw new Error('At least one student is required')
    }

    // Create registration using existing API
    const registrationBody: any = {
      eventId: selectedEvent.value.id,
      schoolId: selectedSchool.value.id,
      teamName: selectedEvent.value.eventType === 'Group' ? teamName.value : null,
      participantIds: allParticipantIds,
      registeredByFacultyId: selectedFaculty.value.id,
      isFacultySelfRegistration: false,
    }

    // Add volunteer proxy information
    if (volunteer.value?.userId) {
      registrationBody.createdByProxyUserId = volunteer.value.userId
      registrationBody.createdByProxyUserType = 'volunteer'
    }
    
    await $fetch('/api/registrations/create', {
      method: 'POST',
      body: registrationBody,
    })

    success.value = `Registration created successfully! ${validNewStudents.length > 0 ? `Created ${validNewStudents.length} new student(s).` : ''}`
    
    setTimeout(() => {
      router.push('/volunteer/dashboard')
    }, 2000)
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}

function handleClickOutside(e: MouseEvent) {
  const container = document.querySelector('[data-school-select]')
  if (container && !container.contains(e.target as Node)) {
    showSchoolDropdown.value = false
  }
}

onMounted(async () => {
  checkAuth()
  await loadSchools()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (searchTimeout) clearTimeout(searchTimeout)
  if (schoolSearchTimeout) clearTimeout(schoolSearchTimeout)
})
</script>
