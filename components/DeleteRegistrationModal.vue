<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        @click.self="handleClose"
        @keydown.esc="handleClose"
      >
        <div
          class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          @click.stop
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold text-red-600">Delete Registration</h2>
              <p class="text-sm text-gray-500 mt-1">Please review the details before confirming deletion</p>
            </div>
            <button
              @click="handleClose"
              :disabled="deleting"
              class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded disabled:opacity-50"
              aria-label="Close"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="p-5 overflow-y-auto flex-1">
            <div v-if="registration" class="space-y-3">
              <!-- Event and Team in same row -->
              <div class="grid grid-cols-2 gap-4">
                <!-- Event Details -->
                <div>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Event</p>
                  <p class="text-sm font-semibold text-gray-900 mb-1.5">{{ registration.event?.name }}</p>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span
                      class="px-2 py-0.5 text-xs font-medium rounded"
                      :class="{
                        'bg-blue-100 text-blue-700': registration.event?.eventType === 'Individual',
                        'bg-purple-100 text-purple-700': registration.event?.eventType === 'Group',
                        'bg-green-100 text-green-700': registration.event?.eventType === 'Combined',
                      }"
                    >
                      {{ registration.event?.eventType }}
                    </span>
                    <span class="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                      {{ registration.event?.ageCategory }}
                    </span>
                    <span v-if="registration.event?.gender" class="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                      {{ registration.event?.gender }}
                    </span>
                  </div>
                </div>

                <!-- Team Name -->
                <div>
                  <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Team</p>
                  <p class="text-sm font-semibold text-gray-900">
                    {{ registration.teamName || 'Individual' }}
                  </p>
                </div>
              </div>

              <!-- Participants -->
              <div>
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Participants ({{ (registration.participants?.length || 0) + (registration.facultyParticipants?.length || 0) }})
                </p>
                <div class="bg-gray-50 rounded-md p-3 space-y-2">
                  <!-- Student Participants -->
                  <div
                    v-for="participant in registration.participants"
                    :key="participant.id"
                    class="flex items-start justify-between text-sm"
                  >
                    <div class="flex-1">
                      <span class="font-medium text-gray-900">{{ participant.studentName }}</span>
                      <span class="text-gray-500 text-xs ml-2">
                        ID: {{ participant.studentId }}
                      </span>
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ participant.ageCategory }} • {{ participant.gender }}
                    </div>
                  </div>
                  
                  <!-- Faculty Participants -->
                  <div
                    v-for="facultyParticipant in registration.facultyParticipants"
                    :key="facultyParticipant.id"
                    class="flex items-center justify-between text-sm"
                  >
                    <div class="flex-1">
                      <span class="font-medium text-gray-900">{{ facultyParticipant.facultyName }}</span>
                      <span class="text-gray-500 text-xs ml-2">
                        (Faculty)
                      </span>
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ facultyParticipant.schoolEmail }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Warning Message -->
              <div class="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                <div class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p class="text-xs font-semibold text-red-800">This action cannot be undone</p>
                    <p class="text-xs text-red-600 mt-0.5">All registration and participant data will be permanently deleted.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              @click="handleClose"
              :disabled="deleting"
              class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              @click="handleConfirm"
              :disabled="deleting"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span v-if="deleting">Deleting...</span>
              <span v-else>Confirm Delete</span>
              <svg v-if="deleting" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  registration: any | null
  deleting?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', registrationId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  deleting: false,
})

const emit = defineEmits<Emits>()

const handleClose = () => {
  if (!props.deleting) {
    emit('update:modelValue', false)
  }
}

const handleConfirm = () => {
  if (!props.registration || props.deleting) return
  emit('confirm', props.registration.id)
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

