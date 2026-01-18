<template>
  <div class="min-h-screen bg-gray-50 grid grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <NuxtLink to="/admin/dashboard/control-center" class="text-purple-600 hover:text-purple-700 text-sm mb-2 inline-block">
              ← Back to Dashboard
            </NuxtLink>
            <h1 class="text-2xl font-bold text-gray-900">Notifications Management</h1>
            <p class="text-sm text-gray-500 mt-1">Create and manage notifications for schools</p>
          </div>
          <button
            @click="showCreateNotificationModal = true"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            Create Notification
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <!-- Notifications Table -->
      <div class="bg-white rounded-lg shadow">
        <div v-if="loadingNotifications" class="text-center py-8 text-gray-500">
          <svg class="animate-spin h-8 w-8 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading notifications...
        </div>

        <div v-else-if="notifications.length === 0" class="text-center py-8 text-gray-500">
          No notifications found. Create your first notification.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-gray-700 w-[720px]">Title</th>
                <th class="px-4 py-3 text-left font-medium text-gray-700">Scope</th>
                <th class="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                <th class="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="notification in notifications" :key="notification.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 w-[720px]">
                  <div class="font-medium text-gray-900">{{ notification.title }}</div>
                  <div class="text-xs text-gray-500 mt-0.5 line-clamp-1">{{ notification.message }}</div>
                </td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      notification.scope === 'all'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800',
                      'px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap'
                    ]"
                  >
                    {{ notification.scope === 'all' ? 'All Schools' : (notification.schoolName || 'School-specific') }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      notification.isImportant
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800',
                      'px-2 py-1 rounded-full text-xs font-medium'
                    ]"
                  >
                    {{ notification.isImportant ? 'Important' : 'Normal' }}
                  </span>
                </td>
                <td class="px-4 py-3 space-x-4 whitespace-nowrap">
                  <button
                    @click="openEditNotificationModal(notification)"
                    class="text-blue-600 hover:text-blue-900 font-medium text-sm"
                  >
                    Edit
                  </button>
                  <button
                    @click="openDeleteNotificationModal(notification)"
                    class="text-red-600 hover:text-red-900 font-medium text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination for Notifications -->
          <div v-if="notificationsMetadata && notificationsMetadata.totalPages > 1" class="px-6 py-4 border-t border-gray-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <button
                  @click="changeNotificationsPage(notificationsMetadata.page - 1)"
                  :disabled="notificationsMetadata.page === 1"
                  class="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span class="text-sm text-gray-700">
                  Page {{ notificationsMetadata.page }} of {{ notificationsMetadata.totalPages }}
                </span>
                <button
                  @click="changeNotificationsPage(notificationsMetadata.page + 1)"
                  :disabled="notificationsMetadata.page === notificationsMetadata.totalPages"
                  class="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
              <div class="text-sm text-gray-500">
                Showing {{ ((notificationsMetadata.page - 1) * notificationsMetadata.limit) + 1 }} - {{ Math.min(notificationsMetadata.page * notificationsMetadata.limit, notificationsMetadata.total) }} of {{ notificationsMetadata.total }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <Footer />

    <!-- Create/Edit Notification Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showCreateNotificationModal"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          @click.self="closeNotificationModal"
        >
          <div class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 class="text-xl font-semibold text-gray-900">{{ editingNotificationId ? 'Edit Notification' : 'Create Notification' }}</h2>
              <button
                @click="closeNotificationModal"
                class="text-gray-400 hover:text-gray-600"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="p-6 space-y-4">
              <div v-if="createNotificationError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {{ createNotificationError }}
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Title <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="createNotificationForm.title"
                  type="text"
                  placeholder="Enter notification title"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Message <span class="text-red-500">*</span>
                </label>
                <textarea
                  v-model="createNotificationForm.message"
                  rows="5"
                  placeholder="Enter notification message"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience
                </label>
                <select
                  v-model="createNotificationForm.schoolId"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option :value="null">All Schools</option>
                  <option v-for="school in schools" :key="school.id" :value="school.id">
                    {{ school.name }} ({{ school.schoolCode }})
                  </option>
                </select>
              </div>

              <div>
                <label class="flex items-center">
                  <input
                    v-model="createNotificationForm.isImportant"
                    type="checkbox"
                    class="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span class="text-sm font-medium text-gray-700">Mark as Important</span>
                </label>
              </div>

              <div class="flex items-center gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  @click="closeNotificationModal"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  :disabled="creatingNotification || updatingNotification"
                >
                  Cancel
                </button>
                <button
                  @click="editingNotificationId ? updateNotification() : createNotification()"
                  class="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  :disabled="creatingNotification || updatingNotification"
                >
                  {{ creatingNotification ? 'Creating...' : updatingNotification ? 'Updating...' : editingNotificationId ? 'Update Notification' : 'Create Notification' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Notification Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showDeleteNotificationModal && selectedNotification"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          @click.self="showDeleteNotificationModal = false"
        >
          <div class="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-900">Delete Notification</h2>
            </div>
            <div class="p-6">
              <p class="text-gray-700 mb-6">
                Are you sure you want to delete the notification <strong>"{{ selectedNotification.title }}"</strong>? This action cannot be undone.
              </p>
              <div class="flex items-center gap-3 justify-end">
                <button
                  @click="showDeleteNotificationModal = false"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  :disabled="deletingNotification"
                >
                  Cancel
                </button>
                <button
                  @click="deleteNotification"
                  class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  :disabled="deletingNotification"
                >
                  {{ deletingNotification ? 'Deleting...' : 'Delete' }}
                </button>
              </div>
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

const notifications = ref<any[]>([])
const schools = ref<any[]>([])
const loadingNotifications = ref(false)

// Pagination for Notifications
const notificationsMetadata = ref<any>(null)
const notificationsPage = ref(1)
const notificationsLimit = ref(10)

// Notifications
const showCreateNotificationModal = ref(false)
const showDeleteNotificationModal = ref(false)
const selectedNotification = ref<any>(null)
const editingNotificationId = ref<string | null>(null)
const createNotificationForm = ref({
  title: '',
  message: '',
  schoolId: null as string | null,
  isImportant: false,
})
const creatingNotification = ref(false)
const updatingNotification = ref(false)
const deletingNotification = ref(false)
const createNotificationError = ref('')

const fetchNotifications = async () => {
  loadingNotifications.value = true
  try {
    const response = await $fetch('/api/notifications', {
      params: {
        page: notificationsPage.value,
        limit: notificationsLimit.value,
      },
    })
    if (response.success) {
      notifications.value = response.data || []
      notificationsMetadata.value = response.metadata
    }
  } catch (err) {
    console.error('Failed to fetch notifications:', err)
  } finally {
    loadingNotifications.value = false
  }
}

const changeNotificationsPage = (page: number) => {
  notificationsPage.value = page
  fetchNotifications()
}

const fetchSchools = async () => {
  try {
    const response = await $fetch('/api/schools', { params: { limit: 1000 } })
    schools.value = response.data || []
  } catch (err) {
    console.error('Failed to fetch schools:', err)
  }
}

const openDeleteNotificationModal = (notification: any) => {
  selectedNotification.value = notification
  showDeleteNotificationModal.value = true
}

const openEditNotificationModal = (notification: any) => {
  editingNotificationId.value = notification.id
  createNotificationForm.value = {
    title: notification.title,
    message: notification.message,
    schoolId: notification.schoolId,
    isImportant: notification.isImportant,
  }
  showCreateNotificationModal.value = true
}

const closeNotificationModal = () => {
  showCreateNotificationModal.value = false
  editingNotificationId.value = null
  createNotificationForm.value = {
    title: '',
    message: '',
    schoolId: null,
    isImportant: false,
  }
  createNotificationError.value = ''
}

const createNotification = async () => {
  createNotificationError.value = ''
  if (!createNotificationForm.value.title || !createNotificationForm.value.message) {
    createNotificationError.value = 'Title and message are required'
    return
  }

  creatingNotification.value = true
  try {
    await $fetch('/api/notifications', {
      method: 'POST',
      body: {
        title: createNotificationForm.value.title,
        message: createNotificationForm.value.message,
        schoolId: createNotificationForm.value.schoolId || null,
        isImportant: createNotificationForm.value.isImportant,
      },
    })
    closeNotificationModal()
    await fetchNotifications()
  } catch (err: any) {
    createNotificationError.value = err.data?.message || 'Failed to create notification'
  } finally {
    creatingNotification.value = false
  }
}

const updateNotification = async () => {
  if (!editingNotificationId.value) return

  createNotificationError.value = ''
  if (!createNotificationForm.value.title || !createNotificationForm.value.message) {
    createNotificationError.value = 'Title and message are required'
    return
  }

  updatingNotification.value = true
  try {
    await $fetch(`/api/notifications/${editingNotificationId.value}`, {
      method: 'PUT',
      body: {
        title: createNotificationForm.value.title,
        message: createNotificationForm.value.message,
        schoolId: createNotificationForm.value.schoolId || null,
        isImportant: createNotificationForm.value.isImportant,
      },
    })
    closeNotificationModal()
    await fetchNotifications()
  } catch (err: any) {
    createNotificationError.value = err.data?.message || 'Failed to update notification'
  } finally {
    updatingNotification.value = false
  }
}

const deleteNotification = async () => {
  if (!selectedNotification.value) return

  deletingNotification.value = true
  try {
    await $fetch(`/api/notifications/${selectedNotification.value.id}`, {
      method: 'DELETE',
    })
    showDeleteNotificationModal.value = false
    selectedNotification.value = null
    await fetchNotifications()
  } catch (err: any) {
    alert(err.data?.message || 'Failed to delete notification')
  } finally {
    deletingNotification.value = false
  }
}

onMounted(async () => {
  if (!checkAuth()) {
    return
  }
  await Promise.all([fetchNotifications(), fetchSchools()])
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
</style>
