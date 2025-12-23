<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue && notification"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="handleClose"
        @keydown.esc="handleClose"
      >
        <div
          class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
          @click.stop
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div class="flex items-center gap-2">
              <h2 class="text-xl font-semibold text-gray-900">{{ notification.title }}</h2>
              <span
                v-if="notification.isImportant"
                class="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full"
              >
                Important
              </span>
            </div>
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

          <!-- Content -->
          <div class="p-6 overflow-y-auto flex-1">
            <div class="text-gray-900 whitespace-pre-wrap">{{ notification.message }}</div>
            
            <!-- Date -->
            <div class="mt-6 pt-4 border-t border-gray-200">
              <p class="text-sm text-gray-500">
                {{ formatDate(notification.createdAt) }}
              </p>
            </div>
          </div>

          <!-- Footer with Mark as Read button for important notifications -->
          <div v-if="notification.isImportant && !notification.isRead" class="px-6 py-4 border-t border-gray-200 flex-shrink-0">
            <button
              @click="markAsRead"
              :disabled="markingAsRead"
              class="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg 
                v-if="markingAsRead"
                class="w-4 h-4 animate-spin" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {{ markingAsRead ? 'Marking as read...' : 'Mark as Read' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
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
  notification: Notification | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'read'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const markingAsRead = ref(false)

// Mark notification as read when modal opens (only for non-important notifications)
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen && props.notification && !props.notification.isRead && !props.notification.isImportant) {
    try {
      // Get facultyId from localStorage
      const storedFaculty = localStorage.getItem('faculty')
      if (storedFaculty) {
        const faculty = JSON.parse(storedFaculty)
        await $fetch(`/api/notifications/${props.notification.id}?facultyId=${faculty.id}`, {
          method: 'PUT'
        })
        // Parent component should refetch notifications to get updated state
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }
}, { immediate: true })

// Manual mark as read function for important notifications
const markAsRead = async () => {
  if (!props.notification || props.notification.isRead || markingAsRead.value) return

  markingAsRead.value = true
  try {
    // Get facultyId from localStorage
    const storedFaculty = localStorage.getItem('faculty')
    if (storedFaculty) {
      const faculty = JSON.parse(storedFaculty)
      await $fetch(`/api/notifications/${props.notification.id}?facultyId=${faculty.id}`, {
        method: 'PUT'
      })
      // Emit event to parent to refetch notifications
      emit('read')
      // Close the modal after marking as read
      handleClose()
    }
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
  } finally {
    markingAsRead.value = false
  }
}

const handleClose = () => {
  emit('update:modelValue', false)
}

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
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

