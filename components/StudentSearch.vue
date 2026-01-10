<template>
  <div class="relative">
    <div>
      <label :for="id" class="block text-sm font-medium text-foreground mb-2">
        {{ label }}
      </label>
      <div class="relative">
        <input
          :id="id"
          v-model="searchQuery"
          type="text"
          :placeholder="placeholder"
          @input="handleSearch"
          @focus="showDropdown = true"
          @keydown.escape="showDropdown = false"
          @keydown.down.prevent="navigateDown"
          @keydown.up.prevent="navigateUp"
          @keydown.enter.prevent="selectHighlighted"
          class="w-full px-3 py-2 pr-10 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            class="h-5 w-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
    </div>

    <!-- Dropdown with search results -->
    <div
      v-if="showDropdown && (searchResults.length > 0 || searchQuery.length >= 2)"
      class="absolute z-10 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
    >
      <div v-if="isSearching" class="px-4 py-3 text-sm text-muted-foreground">
        Searching...
      </div>
      
      <div v-else-if="searchResults.length === 0 && searchQuery.length >= 2" class="px-4 py-3">
        <p class="text-sm text-muted-foreground mb-2">No students found</p>

        <button
          type="button"
          @click="openCreateDialog"
          class="w-full px-3 py-2 text-sm text-left bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          + Create new student "{{ searchQuery }}"
        </button>
       
        <!-- <button
          type="button"
          disabled
          class="w-full px-3 py-2 text-sm text-left bg-gray-300 text-gray-500 rounded-md cursor-not-allowed opacity-50"
        >
          + Create new student "{{ searchQuery }}"
        </button>
        <p class="text-xs text-yellow-600 mt-2">Registration is closed</p> -->

      </div>

      <div v-else>
        <button
          v-for="(student, index) in searchResults"
          :key="student.id"
          type="button"
          @click="selectStudent(student)"
          class="w-full px-4 py-3 text-left hover:bg-muted transition-colors"
          :class="highlightedIndex === index ? 'bg-muted' : ''"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-foreground">
                {{ student.firstName }} {{ student.lastName }}
              </p>
              <p class="text-sm text-muted-foreground">
                {{ student.email || 'No email' }} • Age: {{ calculateAge(student.dateOfBirth) }}
              </p>
            </div>
          </div>
        </button>
        
        
        <div class="border-t border-border px-4 py-2">
          <button
            type="button"
            @click="openCreateDialog"
            class="w-full px-3 py-2 text-sm text-primary hover:bg-muted rounded-md transition-colors"
          >
            + Create new student
          </button>
        </div>
       
        <!-- <div class="border-t border-border px-4 py-2">
          <button
            type="button"
            disabled
            class="w-full px-3 py-2 text-sm text-gray-400 bg-gray-100 rounded-md cursor-not-allowed opacity-50"
          >
            + Create new student
          </button>
          <p class="text-xs text-yellow-600 mt-2">Registration is closed</p>
        </div> -->

      </div>
    </div>

    <!-- Create Student Dialog -->
    <!-- Registration is closed - dialog disabled but kept for reference -->
    <div
      v-if="showCreateDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="closeCreateDialog"
    >
      <div class="bg-card border border-border rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h3 class="text-xl font-semibold text-foreground mb-4">Add New Student</h3>
        
        <form @submit.prevent="createStudent" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="newFirstName" class="block text-sm font-medium text-foreground mb-1">
                First Name <span class="text-error">*</span>
              </label>
              <input
                id="newFirstName"
                v-model="newStudent.firstName"
                type="text"
                required
                class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label for="newLastName" class="block text-sm font-medium text-foreground mb-1">
                Last Name <span class="text-error">*</span>
              </label>
              <input
                id="newLastName"
                v-model="newStudent.lastName"
                type="text"
                required
                class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label for="newEmail" class="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              id="newEmail"
              v-model="newStudent.email"
              type="email"
              class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label for="newPhone" class="block text-sm font-medium text-foreground mb-1">
              Phone
            </label>
            <input
              id="newPhone"
              v-model="newStudent.phone"
              type="tel"
              class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label for="newDob" class="block text-sm font-medium text-foreground mb-1">
              Date of Birth <span class="text-error">*</span>
            </label>
            <input
              id="newDob"
              v-model="newStudent.dateOfBirth"
              type="date"
              required
              class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="closeCreateDialog"
              class="flex-1 px-4 py-2 border border-border rounded-md font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isCreating"
              class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {{ isCreating ? 'Creating...' : 'Create Student' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Student {
  id: number
  firstName: string
  lastName: string
  email: string | null
  dateOfBirth: string
  schoolId: number
}

interface Props {
  id?: string
  label?: string
  placeholder?: string
  schoolId: number | string
  excludeIds?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  id: 'student-search',
  label: 'Search Student',
  placeholder: 'Type to search for a student...',
  excludeIds: () => [],
})

const emit = defineEmits<{
  select: [student: Student]
}>()

const searchQuery = ref('')
const searchResults = ref<Student[]>([])
const showDropdown = ref(false)
const isSearching = ref(false)
const highlightedIndex = ref(0)

const showCreateDialog = ref(false)
const isCreating = ref(false)
const newStudent = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
})

let searchTimeout: NodeJS.Timeout | null = null

function handleSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }

  searchTimeout = setTimeout(async () => {
    isSearching.value = true
    try {
      const response = await $fetch('/api/students/search', {
        params: {
          q: searchQuery.value,
          schoolId: props.schoolId,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      })
      
      // Handle paginated response
      const studentsList = (response as any).data || (response as Student[])
      
      // Filter out already selected students
      searchResults.value = studentsList.filter(
        (student: Student) => !props.excludeIds.includes(student.id)
      )
      highlightedIndex.value = 0
    } catch (error) {
      console.error('Error searching students:', error)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 300)
}

function selectStudent(student: Student) {
  emit('select', student)
  searchQuery.value = ''
  searchResults.value = []
  showDropdown.value = false
}

function navigateDown() {
  if (highlightedIndex.value < searchResults.value.length - 1) {
    highlightedIndex.value++
  }
}

function navigateUp() {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--
  }
}

function selectHighlighted() {
  if (searchResults.value[highlightedIndex.value]) {
    selectStudent(searchResults.value[highlightedIndex.value])
  }
}

function openCreateDialog() {
  // Pre-fill first name if search query exists
  const names = searchQuery.value.trim().split(' ')
  newStudent.value.firstName = names[0] || ''
  newStudent.value.lastName = names[1] || ''
  showCreateDialog.value = true
  showDropdown.value = false
}

function closeCreateDialog() {
  showCreateDialog.value = false
  newStudent.value = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
  }
}

async function createStudent() {
  isCreating.value = true
  try {
    const response = await $fetch('/api/students/create', {
      method: 'POST',
      body: {
        ...newStudent.value,
        schoolId: props.schoolId,
      },
    })
    
    emit('select', response as Student)
    closeCreateDialog()
    searchQuery.value = ''
  } catch (error) {
    console.error('Error creating student:', error)
    alert('Failed to create student. Please try again.')
  } finally {
    isCreating.value = false
  }
}

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

// Close dropdown when clicking outside
if (process.client) {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest(`#${props.id}`)?.parentElement?.contains(target)) {
      showDropdown.value = false
    }
  })
}
</script>
