<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="border-b border-border bg-card">
      <div class="container mx-auto px-4 py-6">
        <h1 class="text-3xl font-bold text-foreground">Event Registration</h1>
        <p class="text-muted-foreground mt-2">Register for upcoming school events</p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
      <div class="max-w-3xl mx-auto">
        <!-- Success Message -->
        <div
          v-if="showSuccess"
          class="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-start gap-3"
        >
          <svg class="h-5 w-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          <div class="flex-1">
            <h3 class="font-semibold">Registration Successful!</h3>
            <p class="text-sm mt-1">{{ successMessage }}</p>
          </div>
          <button @click="showSuccess = false" class="text-green-600 hover:text-green-700">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Progress Steps -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div
              v-for="(step, index) in steps"
              :key="index"
              class="flex items-center"
              :class="{ 'flex-1': index < steps.length - 1 }"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors"
                  :class="
                    currentStep > index
                      ? 'bg-primary border-primary text-primary-foreground'
                      : currentStep === index
                      ? 'border-primary text-primary'
                      : 'border-border text-muted-foreground'
                  "
                >
                  <span class="text-sm font-semibold">{{ index + 1 }}</span>
                </div>
                <div class="hidden sm:block">
                  <div
                    class="text-sm font-medium"
                    :class="currentStep >= index ? 'text-foreground' : 'text-muted-foreground'"
                  >
                    {{ step.title }}
                  </div>
                </div>
              </div>
              <div
                v-if="index < steps.length - 1"
                class="mx-4 h-0.5 flex-1 transition-colors"
                :class="currentStep > index ? 'bg-primary' : 'bg-border'"
              />
            </div>
          </div>
        </div>

        <!-- Form Card -->
        <div class="bg-card border border-border rounded-lg shadow-sm p-6 sm:p-8">
          <!-- Step 1: Personal Information -->
          <div v-if="currentStep === 0">
            <h2 class="text-2xl font-semibold text-foreground mb-6">Personal Information</h2>
            <form @submit.prevent="goToNextStep" class="space-y-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="firstName" class="block text-sm font-medium text-foreground mb-2">
                    First Name <span class="text-error">*</span>
                  </label>
                  <input
                    id="firstName"
                    v-model="formData.firstName"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label for="lastName" class="block text-sm font-medium text-foreground mb-2">
                    Last Name <span class="text-error">*</span>
                  </label>
                  <input
                    id="lastName"
                    v-model="formData.lastName"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label for="email" class="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  id="email"
                  v-model="formData.email"
                  type="email"
                  class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="john.doe@example.com"
                />
              </div>

              <div>
                <label for="phone" class="block text-sm font-medium text-foreground mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  v-model="formData.phone"
                  type="tel"
                  class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="555-0123"
                />
              </div>

              <div>
                <label for="dateOfBirth" class="block text-sm font-medium text-foreground mb-2">
                  Date of Birth <span class="text-error">*</span>
                </label>
                <input
                  id="dateOfBirth"
                  v-model="formData.dateOfBirth"
                  type="date"
                  required
                  class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label for="school" class="block text-sm font-medium text-foreground mb-2">
                  School <span class="text-error">*</span>
                </label>
                <select
                  id="school"
                  v-model="formData.schoolId"
                  required
                  class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select your school</option>
                  <option v-for="school in schools" :key="school.id" :value="school.id">
                    {{ school.name }}
                  </option>
                </select>
              </div>

              <div class="flex justify-end pt-4">
                <button
                  type="submit"
                  class="px-6 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                >
                  Next Step
                </button>
              </div>
            </form>
          </div>

          <!-- Step 2: Select Event -->
          <div v-else-if="currentStep === 1">
            <h2 class="text-2xl font-semibold text-foreground mb-6">Select Event</h2>
            <div class="space-y-4">
              <p class="text-sm text-muted-foreground mb-4">
                Based on your age, here are the events you can participate in:
              </p>
              
              <div v-if="eligibleEvents.length === 0" class="text-center py-8">
                <p class="text-muted-foreground">No events available for your age group at this time.</p>
              </div>

              <div
                v-for="event in eligibleEvents"
                :key="event.id"
                @click="selectEvent(event)"
                class="border border-border rounded-lg p-4 cursor-pointer transition-all hover:border-primary hover:shadow-md"
                :class="formData.selectedEvent?.id === event.id ? 'border-primary bg-primary/5' : 'bg-card'"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="font-semibold text-foreground mb-1">{{ event.name }}</h3>
                    <p class="text-sm text-muted-foreground mb-2">{{ event.description }}</p>
                    <div class="flex flex-wrap gap-2">
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="getEventTypeBadgeClass(event.eventType)"
                      >
                        {{ formatEventType(event.eventType) }}
                      </span>
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                        Ages {{ event.minAge }}-{{ event.maxAge }}
                      </span>
                      <span
                        v-if="event.eventType !== 'single'"
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground"
                      >
                        Team size: {{ event.maxTeamSize }}
                      </span>
                    </div>
                  </div>
                  <div
                    v-if="formData.selectedEvent?.id === event.id"
                    class="ml-4 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  >
                    <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div class="flex justify-between pt-4">
                <button
                  type="button"
                  @click="goToPreviousStep"
                  class="px-6 py-2.5 border border-border rounded-md font-medium hover:bg-muted transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  @click="goToNextStep"
                  :disabled="!formData.selectedEvent"
                  class="px-6 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Step
                </button>
              </div>
            </div>
          </div>

          <!-- Step 3: Team Members (for group/combined events) -->
          <div v-else-if="currentStep === 2">
            <h2 class="text-2xl font-semibold text-foreground mb-6">
              {{ formData.selectedEvent?.eventType === 'single' ? 'Confirm Registration' : 'Add Team Members' }}
            </h2>

            <div v-if="formData.selectedEvent?.eventType !== 'single'" class="space-y-6">
              <div>
                <label for="teamName" class="block text-sm font-medium text-foreground mb-2">
                  Team Name <span class="text-error">*</span>
                </label>
                <input
                  id="teamName"
                  v-model="formData.teamName"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter team name"
                />
              </div>

              <div>
                <p class="text-sm text-muted-foreground mb-4">
                  You can add up to {{ formData.selectedEvent?.maxTeamSize }} team members total (including yourself).
                  All team members must be from {{ getSchoolName(formData.schoolId) }}.
                  <span v-if="formData.selectedEvent?.eventType === 'group'">
                    <strong>Note:</strong> All team members must be in the same age category ({{ formData.selectedEvent.minAge }}-{{ formData.selectedEvent.maxAge }} years).
                  </span>
                </p>

                <!-- Team member list -->
                <div class="border border-border rounded-lg p-4 bg-muted/30">
                  <h3 class="font-medium text-foreground mb-3">Team Members ({{ teamMembersWithCaptain.length }}/{{ formData.selectedEvent?.maxTeamSize }})</h3>
                  <div class="space-y-2">
                    <!-- Team captain (current user) -->
                    <div class="flex items-center justify-between p-3 bg-background rounded-md border border-primary/30">
                      <div>
                        <p class="font-medium text-foreground">{{ formData.firstName }} {{ formData.lastName }}</p>
                        <p class="text-sm text-muted-foreground">You (Team Captain) • Age: {{ calculateAge(formData.dateOfBirth) }}</p>
                      </div>
                      <span class="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded">
                        Captain
                      </span>
                    </div>

                    <!-- Added team members -->
                    <div
                      v-for="(member, index) in formData.teamMembers"
                      :key="member.id"
                      class="flex items-center justify-between p-3 bg-background rounded-md"
                    >
                      <div>
                        <p class="font-medium text-foreground">{{ member.firstName }} {{ member.lastName }}</p>
                        <p class="text-sm text-muted-foreground">
                          {{ member.email || 'No email' }} • Age: {{ calculateAge(member.dateOfBirth) }}
                        </p>
                      </div>
                      <button
                        type="button"
                        @click="removeTeamMember(index)"
                        class="text-error hover:text-error/80 transition-colors"
                      >
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <!-- Add member button -->
                    <div v-if="teamMembersWithCaptain.length < formData.selectedEvent?.maxTeamSize" class="pt-2">
                      <StudentSearch
                        :school-id="formData.schoolId"
                        :exclude-ids="excludedStudentIds"
                        placeholder="Search for a student or create new..."
                        @select="addTeamMember"
                      />
                    </div>

                    <div v-else class="text-center py-2 text-sm text-muted-foreground">
                      Team is full ({{ formData.selectedEvent?.maxTeamSize }} members maximum)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="space-y-4">
              <div class="border border-border rounded-lg p-6 bg-muted/30">
                <h3 class="font-medium text-foreground mb-4">Registration Summary</h3>
                <dl class="space-y-3">
                  <div class="flex justify-between">
                    <dt class="text-sm text-muted-foreground">Participant:</dt>
                    <dd class="text-sm font-medium text-foreground">{{ formData.firstName }} {{ formData.lastName }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-sm text-muted-foreground">Event:</dt>
                    <dd class="text-sm font-medium text-foreground">{{ formData.selectedEvent?.name }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-sm text-muted-foreground">School:</dt>
                    <dd class="text-sm font-medium text-foreground">{{ getSchoolName(formData.schoolId) }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-sm text-muted-foreground">Age:</dt>
                    <dd class="text-sm font-medium text-foreground">{{ calculateAge(formData.dateOfBirth) }} years</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div v-if="errorMessage" class="mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <p class="text-sm">{{ errorMessage }}</p>
            </div>

            <div class="flex justify-between pt-6">
              <button
                type="button"
                @click="goToPreviousStep"
                class="px-6 py-2.5 border border-border rounded-md font-medium hover:bg-muted transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                @click="submitRegistration"
                :disabled="isSubmitting || !canSubmit"
                class="px-6 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {{ isSubmitting ? 'Submitting...' : 'Complete Registration' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import StudentSearch from '~/components/StudentSearch.vue'

const currentStep = ref(0)
const isSubmitting = ref(false)
const showSuccess = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const steps = [
  { title: 'Personal Info', id: 'personal' },
  { title: 'Select Event', id: 'event' },
  { title: 'Team Details', id: 'team' },
]

const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  schoolId: '',
  selectedEvent: null as any,
  teamName: '',
  teamMembers: [] as any[],
})

const { data: schoolsData } = useFetch('/api/schools')
const { data: eventsData } = useFetch('/api/events')

const schools = computed(() => schoolsData.value || [])
const allEvents = computed(() => eventsData.value || [])

const eligibleEvents = computed(() => {
  if (!formData.value.dateOfBirth || !allEvents.value) return []
  
  const age = calculateAge(formData.value.dateOfBirth)
  return allEvents.value.filter((event: any) => age >= event.minAge && age <= event.maxAge)
})

const teamMembersWithCaptain = computed(() => {
  return [
    {
      id: 'captain',
      firstName: formData.value.firstName,
      lastName: formData.value.lastName,
      dateOfBirth: formData.value.dateOfBirth,
      isCaptain: true,
    },
    ...formData.value.teamMembers,
  ]
})

const excludedStudentIds = computed(() => {
  return formData.value.teamMembers.map((m: any) => m.id)
})

const canSubmit = computed(() => {
  if (formData.value.selectedEvent?.eventType === 'single') {
    return true
  }
  
  if (!formData.value.teamName) {
    return false
  }
  
  if (formData.value.selectedEvent?.eventType === 'group') {
    const allInRange = formData.value.teamMembers.every((member: any) => {
      const age = calculateAge(member.dateOfBirth)
      return age >= formData.value.selectedEvent.minAge && age <= formData.value.selectedEvent.maxAge
    })
    return allInRange
  }
  
  return true
})

function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

function selectEvent(event: any) {
  formData.value.selectedEvent = event
}

function formatEventType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function getEventTypeBadgeClass(type: string): string {
  const classes = {
    single: 'bg-blue-100 text-blue-800',
    group: 'bg-green-100 text-green-800',
    combined: 'bg-purple-100 text-purple-800',
  }
  return classes[type as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

function getSchoolName(schoolId: string): string {
  const school = schools.value?.find((s: any) => s.id === Number(schoolId))
  return school?.name || ''
}

function goToNextStep() {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

function goToPreviousStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function addTeamMember(student: any) {
  if (teamMembersWithCaptain.value.length >= formData.value.selectedEvent.maxTeamSize) {
    alert('Team is already full')
    return
  }
  
  if (formData.value.selectedEvent?.eventType === 'group') {
    const age = calculateAge(student.dateOfBirth)
    if (age < formData.value.selectedEvent.minAge || age > formData.value.selectedEvent.maxAge) {
      alert(`This student (age ${age}) is not in the required age range (${formData.value.selectedEvent.minAge}-${formData.value.selectedEvent.maxAge} years) for this event.`)
      return
    }
  }
  
  formData.value.teamMembers.push(student)
}

function removeTeamMember(index: number) {
  formData.value.teamMembers.splice(index, 1)
}

async function submitRegistration() {
  isSubmitting.value = true
  errorMessage.value = ''
  
  try {
    const payload = {
      eventId: formData.value.selectedEvent.id,
      schoolId: formData.value.schoolId,
      teamName: formData.value.teamName || null,
      captainData: {
        isNew: true,
        firstName: formData.value.firstName,
        lastName: formData.value.lastName,
        email: formData.value.email,
        phone: formData.value.phone,
        dateOfBirth: formData.value.dateOfBirth,
      },
      teamMembers: formData.value.teamMembers,
    }

    const response: any = await $fetch('/api/registrations/create', {
      method: 'POST',
      body: payload,
    })
    
    if (response.success) {
      successMessage.value = formData.value.selectedEvent.eventType === 'single'
        ? `You have been registered for ${formData.value.selectedEvent.name}!`
        : `Team "${formData.value.teamName}" has been registered for ${formData.value.selectedEvent.name} with ${teamMembersWithCaptain.value.length} members!`
      
      showSuccess.value = true
      
      formData.value = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        schoolId: '',
        selectedEvent: null,
        teamName: '',
        teamMembers: [],
      }
      currentStep.value = 0
      
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  } catch (error: any) {
    console.error('Registration error:', error)
    errorMessage.value = error.data?.message || 'Failed to submit registration. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
