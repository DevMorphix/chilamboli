<template>
  <Teleport to="body">
    <Transition name="panel">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-40"
        @click.self="handleClose"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/20" @click="handleClose"></div>
        
        <!-- Panel -->
        <div
          class="absolute top-16 right-4 sm:right-8 bg-white rounded-lg shadow-xl w-full max-w-md max-h-[calc(100vh-5rem)] overflow-hidden flex flex-col border border-gray-200"
          @click.stop
        >
          <!-- Header -->
          <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <h2 class="text-lg font-semibold text-gray-900">Notifications</h2>
            <button
              @click="handleClose"
              class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
              aria-label="Close"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="p-6 text-center text-gray-500">
            Loading notifications...
          </div>

          <!-- Empty State -->
          <div v-else-if="notifications.length === 0" class="p-6 text-center text-gray-500">
            <svg
              class="w-12 h-12 mx-auto mb-3 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <p>No notifications</p>
          </div>

          <!-- Notifications List -->
          <div v-else class="overflow-y-auto flex-1">
            <button
              v-for="notification in notifications"
              :key="notification.id"
              @click="handleNotificationClick(notification)"
              class="w-full p-3 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors"
              :class="{ 
                'bg-blue-50': !notification.isRead, 
                'bg-amber-50/50': notification.isImportant
              }"
            >
              <div class="flex items-start gap-3">
                <div class="flex-1 min-w-0 p-3 rounded-lg border border-gray-200">
                  <div class="flex items-center gap-2 mb-2 justify-between">
                    <h3
                      class="font-medium text-gray-900 truncate"
                      :class="{ 'font-semibold': !notification.isRead || notification.isImportant }"
                    >
                      {{ notification.title }}
                    </h3>
                    <span
                      v-if="!notification.isRead"
                      class="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"
                      aria-label="Unread"
                    ></span>
                    <span
                      v-if="notification.isImportant"
                      class="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded-full flex-shrink-0"
                    >
                      Important
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 line-clamp-2">
                    {{ notification.message }}
                  </p>
                  <p class="text-xs text-gray-400 mt-1">
                    {{ formatDate(notification.createdAt) }}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Notification Detail Modal -->
    <NotificationDetailModal
      v-model="showDetailModal"
      :notification="selectedNotification"
      @read="handleNotificationRead"
    />
  </Teleport>
</template>

<script setup lang="ts">
interface Notification {
  id: string
  schoolId: string | null
  title: string
  message: string
  isRead: boolean
  isImportant: boolean
  createdAt: Date | string
}

interface Props {
  modelValue: boolean
  facultyId: string | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const notifications = ref<Notification[]>([])
const loading = ref(false)
const showDetailModal = ref(false)
const selectedNotification = ref<Notification | null>(null)

const handleClose = () => {
  emit('update:modelValue', false)
}

const fetchNotifications = async () => {
  if (!props.facultyId) return

  loading.value = true
  try {
    const response = await $fetch<{ success: boolean; data: Notification[] }>(
      `/api/notifications?facultyId=${props.facultyId}`
    )
    notifications.value = response.data || []
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    notifications.value = []
  } finally {
    loading.value = false
  }
}

const handleNotificationClick = (notification: Notification) => {
  selectedNotification.value = notification
  showDetailModal.value = true
}

const handleNotificationRead = () => {
  // Refetch notifications when an important notification is marked as read
  if (props.facultyId) {
    fetchNotifications()
  }
}

// Watch for detail modal close to refetch notifications
watch(showDetailModal, (isOpen) => {
  if (!isOpen && props.facultyId) {
    // Refetch notifications to get updated read status
    fetchNotifications()
  }
})

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && props.facultyId) {
      fetchNotifications()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.2s ease;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

