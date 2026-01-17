<template>
  <div class="min-h-screen bg-gray-50 grid grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <NuxtLink to="/admin/dashboard#control" class="text-purple-600 hover:text-purple-700 text-sm mb-2 inline-block">
              ← Back to Dashboard
            </NuxtLink>
            <h1 class="text-2xl font-bold text-gray-900">Judges Management</h1>
          </div>
          <button
            @click="showCreateModal = true"
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors"
          >
            + Add Judge
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name or mobile number..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      <!-- Judges List -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">
            Judges ({{ metadata?.total || judges.length }})
          </h2>
          <div v-if="metadata" class="text-sm text-gray-500">
            Page {{ metadata.page }} of {{ metadata.totalPages }}
          </div>
        </div>

        <div v-if="loading" class="text-center py-12 text-gray-500">
          Loading judges...
        </div>

        <div v-else-if="judges.length === 0" class="text-center py-12 text-gray-500">
          <p>No judges found.</p>
          <button
            @click="showCreateModal = true"
            class="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors"
          >
            Create First Judge
          </button>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mobile Number
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Events
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="judgeItem in judges" :key="judgeItem.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ judgeItem.judgeName }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ judgeItem.mobileNumber }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ judgeItem.assignedEventsCount || 0 }} events
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(judgeItem.createdAt) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                  <button
                    @click="openEditModal(judgeItem)"
                    class="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    @click="openDeleteModal(judgeItem)"
                    class="text-red-600 hover:text-red-700 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="metadata && metadata.totalPages > 1" class="px-6 py-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <button
                @click="changePage(metadata.page - 1)"
                :disabled="metadata.page === 1"
                class="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span class="text-sm text-gray-700">
                Page {{ metadata.page }} of {{ metadata.totalPages }}
              </span>
              <button
                @click="changePage(metadata.page + 1)"
                :disabled="metadata.page === metadata.totalPages"
                class="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div class="text-sm text-gray-500">
              Showing {{ ((metadata.page - 1) * metadata.limit) + 1 }} - {{ Math.min(metadata.page * metadata.limit, metadata.total) }} of {{ metadata.total }}
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <Footer />

    <!-- Create Judge Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showCreateModal"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          @click.self="closeModal"
        >
          <div class="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">{{ editingJudgeId ? 'Edit Judge' : 'Create Judge' }}</h2>
              <button
                @click="closeModal"
                class="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form @submit.prevent="editingJudgeId ? updateJudge() : createJudge()" class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Judge Name</label>
                <input
                  v-model="createForm.judgeName"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input
                  v-model="createForm.mobileNumber"
                  type="tel"
                  required
                  placeholder="10 digit mobile number"
                  maxlength="10"
                  pattern="[0-9]{10}"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p class="text-xs text-gray-500 mt-1">PIN will be automatically set to the last 4 digits of mobile number</p>
              </div>

              <div v-if="createError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {{ createError }}
              </div>

              <div class="flex items-center gap-3 justify-end">
                <button
                  type="button"
                  @click="closeModal"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="creating || updating"
                  class="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-purple-600 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ updating ? 'Updating...' : creating ? 'Creating...' : editingJudgeId ? 'Update Judge' : 'Create Judge' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showDeleteModal"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          @click.self="showDeleteModal = false"
        >
          <div class="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-900">Delete Judge</h2>
            </div>

            <div class="p-6">
              <p class="text-gray-700">
                Are you sure you want to delete <strong>{{ selectedJudge?.judgeName }}</strong>? 
                This will also delete all their judgments and event assignments. This action cannot be undone.
              </p>
            </div>

            <div class="px-6 py-4 border-t border-gray-200 flex items-center gap-3 justify-end">
              <button
                @click="showDeleteModal = false"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                @click="deleteJudge"
                :disabled="deleting"
                class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ deleting ? 'Deleting...' : 'Delete Judge' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const { admin, checkAuth } = useAdmin()

const loading = ref(true)
const judges = ref<any[]>([])
const metadata = ref<any>(null)
const searchQuery = ref('')
const currentPage = ref(1)
const pageLimit = ref(20)

const showCreateModal = ref(false)
const createForm = ref({
  judgeName: '',
  mobileNumber: '',
})
const creating = ref(false)
const createError = ref('')

const editingJudgeId = ref<string | null>(null)
const updating = ref(false)

const showDeleteModal = ref(false)
const selectedJudge = ref<any>(null)
const deleting = ref(false)

let searchTimeout: NodeJS.Timeout | null = null

const fetchJudges = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      limit: pageLimit.value,
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    const response = await $fetch('/api/judges', { params })
    if (response.success) {
      judges.value = response.data || []
      metadata.value = response.metadata
    }
  } catch (err) {
    console.error('Failed to fetch judges:', err)
  } finally {
    loading.value = false
  }
}

const changePage = (page: number) => {
  currentPage.value = page
  fetchJudges()
}

watch(searchQuery, (newValue) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchJudges()
  }, 300)
})

onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
    searchTimeout = null
  }
})

const openEditModal = (judge: any) => {
  editingJudgeId.value = judge.id
  createForm.value = {
    judgeName: judge.judgeName,
    mobileNumber: judge.mobileNumber,
  }
  showCreateModal.value = true
}

const closeModal = () => {
  showCreateModal.value = false
  editingJudgeId.value = null
  createForm.value = { judgeName: '', mobileNumber: '' }
  createError.value = ''
}

const createJudge = async () => {
  createError.value = ''
  
  // Validate mobile number format
  if (!/^\d{10}$/.test(createForm.value.mobileNumber)) {
    createError.value = 'Mobile number must be 10 digits'
    return
  }
  
  creating.value = true
  try {
    const response = await $fetch('/api/judges', {
      method: 'POST',
      body: createForm.value,
    })
    if (response.success) {
      closeModal()
      await fetchJudges()
    }
  } catch (err: any) {
    createError.value = err.data?.message || 'Failed to create judge'
  } finally {
    creating.value = false
  }
}

const updateJudge = async () => {
  if (!editingJudgeId.value) return

  createError.value = ''
  
  // Validate mobile number format
  if (!/^\d{10}$/.test(createForm.value.mobileNumber)) {
    createError.value = 'Mobile number must be 10 digits'
    return
  }
  
  updating.value = true
  try {
    const response = await $fetch(`/api/judges/${editingJudgeId.value}`, {
      method: 'PUT',
      body: createForm.value,
    })
    if (response.success) {
      closeModal()
      await fetchJudges()
    }
  } catch (err: any) {
    createError.value = err.data?.message || 'Failed to update judge'
  } finally {
    updating.value = false
  }
}


const openDeleteModal = (judge: any) => {
  selectedJudge.value = judge
  showDeleteModal.value = true
}

const deleteJudge = async () => {
  if (!selectedJudge.value) return

  deleting.value = true
  try {
    await $fetch(`/api/judges/${selectedJudge.value.id}`, {
      method: 'DELETE',
    })
    showDeleteModal.value = false
    await fetchJudges()
  } catch (err: any) {
    alert(err.data?.message || 'Failed to delete judge')
  } finally {
    deleting.value = false
  }
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

onMounted(async () => {
  if (!checkAuth()) {
    return
  }
  await fetchJudges()
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .bg-white,
.modal-leave-active .bg-white {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from .bg-white,
.modal-leave-to .bg-white {
  transform: scale(0.95);
  opacity: 0;
}
</style>
