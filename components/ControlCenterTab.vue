<template>
  <div class="space-y-6">
    <!-- Manage Judges Section -->
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">Manage Judges</h2>
          <p class="text-sm text-gray-500 mt-1">Create, assign, and manage judges</p>
        </div>
        <button
          @click="showCreateJudgeModal = true"
          class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          Add Judge
        </button>
      </div>

      <!-- Judges Table -->
      <div v-if="loadingJudges" class="text-center py-8 text-gray-500">
        <svg class="animate-spin h-8 w-8 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading judges...
      </div>

      <div v-else-if="judges.length === 0" class="text-center py-8 text-gray-500">
        No judges found. Create your first judge.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-gray-700">Name</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700">Mobile Number</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700">Assigned Events</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="judge in judges" :key="judge.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 font-medium text-gray-900">{{ judge.judgeName }}</td>
              <td class="px-4 py-3 text-gray-900">{{ judge.mobileNumber }}</td>
              <td class="px-4 py-3 text-gray-500">{{ judge.assignedEventsCount || 0 }} events</td>
              <td class="px-4 py-3 space-x-4 whitespace-nowrap">
                <button
                  @click="openEditJudgeModal(judge)"
                  class="text-blue-600 hover:text-blue-900 font-medium text-sm"
                >
                  Edit
                </button>
                <button
                  @click="openDeleteJudgeModal(judge)"
                  class="text-red-600 hover:text-red-900 font-medium text-sm"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination for Judges -->
        <div v-if="judgesMetadata && judgesMetadata.totalPages > 1" class="px-6 py-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <button
                @click="changeJudgesPage(judgesMetadata.page - 1)"
                :disabled="judgesMetadata.page === 1"
                class="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span class="text-sm text-gray-700">
                Page {{ judgesMetadata.page }} of {{ judgesMetadata.totalPages }}
              </span>
              <button
                @click="changeJudgesPage(judgesMetadata.page + 1)"
                :disabled="judgesMetadata.page === judgesMetadata.totalPages"
                class="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div class="text-sm text-gray-500">
              Showing {{ ((judgesMetadata.page - 1) * judgesMetadata.limit) + 1 }} - {{ Math.min(judgesMetadata.page * judgesMetadata.limit, judgesMetadata.total) }} of {{ judgesMetadata.total }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Manage Events Section -->
    <div class="bg-white rounded-lg shadow p-6">
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-gray-900">Manage Events</h2>
        <p class="text-sm text-gray-500 mt-1">Assign judges to events and manage their assignments</p>
      </div>

      <!-- Events Table -->
      <div v-if="loadingEvents" class="text-center py-8 text-gray-500">
        <svg class="animate-spin h-8 w-8 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading events...
      </div>

      <div v-else-if="events.length === 0" class="text-center py-8 text-gray-500">
        No events found.
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="event in events"
          :key="event.id"
          class="border border-gray-200 rounded-lg p-4"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900">{{ event.name }}</h3>
              <div class="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span>{{ event.eventType }}</span>
                <span>•</span>
                <span>{{ event.ageCategory }}</span>
                <span>•</span>
                <span>{{ event.assignedJudgesCount || 0 }} judge{{ (event.assignedJudgesCount || 0) !== 1 ? 's' : '' }} assigned</span>
              </div>
            </div>
            <button
              @click="openAssignJudgeModal(event)"
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              Assign Judges
            </button>
          </div>

          <!-- Assigned Judges List -->
          <div v-if="event.assignments && event.assignments.length > 0" class="mt-4">
            <h4 class="text-sm font-medium text-gray-700 mb-2">Judge Assignments:</h4>
            <div class="space-y-2">
              <div
                v-for="assignment in event.assignments"
                :key="assignment.assignmentId"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex-1">
                  <div class="font-medium text-gray-900">{{ assignment.judgeName }}</div>
                  <div class="text-xs text-gray-500">{{ assignment.judgeMobileNumber }}</div>
                </div>
                <div class="flex items-center gap-3">
                  <span
                    :class="[
                      assignment.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800',
                      'px-2 py-1 rounded-full text-xs font-medium'
                    ]"
                  >
                    {{ assignment.enabled ? 'Enabled' : 'Disabled' }}
                  </span>
                  <button
                    @click="toggleAssignmentStatus(assignment)"
                    :disabled="togglingAssignmentId === assignment.assignmentId"
                    :class="[
                      assignment.enabled
                        ? 'text-orange-600 hover:text-orange-900'
                        : 'text-green-600 hover:text-green-900',
                      'font-medium text-sm disabled:opacity-50'
                    ]"
                  >
                    {{ togglingAssignmentId === assignment.assignmentId ? '...' : assignment.enabled ? 'Disable' : 'Enable' }}
                  </button>
                  <button
                    @click="removeJudgeFromEvent(assignment)"
                    :disabled="removingAssignmentId === assignment.assignmentId"
                    class="text-red-600 hover:text-red-900 font-medium text-sm disabled:opacity-50"
                  >
                    {{ removingAssignmentId === assignment.assignmentId ? 'Removing...' : 'Remove' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="mt-4 text-sm text-gray-500">
            No judges assigned to this event yet.
          </div>
        </div>

        <!-- Pagination for Events -->
        <div v-if="eventsMetadata && eventsMetadata.totalPages > 1" class="mt-6 py-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <button
                @click="changeEventsPage(eventsMetadata.page - 1)"
                :disabled="eventsMetadata.page === 1"
                class="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span class="text-sm text-gray-700">
                Page {{ eventsMetadata.page }} of {{ eventsMetadata.totalPages }}
              </span>
              <button
                @click="changeEventsPage(eventsMetadata.page + 1)"
                :disabled="eventsMetadata.page === eventsMetadata.totalPages"
                class="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div class="text-sm text-gray-500">
              Showing {{ ((eventsMetadata.page - 1) * eventsMetadata.limit) + 1 }} - {{ Math.min(eventsMetadata.page * eventsMetadata.limit, eventsMetadata.total) }} of {{ eventsMetadata.total }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Manage Notifications Section -->
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">Manage Notifications</h2>
          <p class="text-sm text-gray-500 mt-1">Create and manage notifications for schools</p>
        </div>
        <button
          @click="showCreateNotificationModal = true"
          class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          Create Notification
        </button>
      </div>

      <!-- Notifications Table -->
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

    <!-- Create/Edit Judge Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showCreateJudgeModal"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          @click.self="closeJudgeModal"
        >
          <div class="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">{{ editingJudgeId ? 'Edit Judge' : 'Create Judge' }}</h2>
              <button
                @click="closeJudgeModal"
                class="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  v-model="createJudgeForm.judgeName"
                  type="text"
                  placeholder="Enter judge name"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                <input
                  v-model="createJudgeForm.mobileNumber"
                  type="tel"
                  placeholder="10 digit mobile number"
                  maxlength="10"
                  pattern="[0-9]{10}"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p class="text-xs text-gray-500 mt-1">{{ editingJudgeId ? 'Changing mobile number will update PIN to the last 4 digits' : 'PIN will be automatically set to the last 4 digits of mobile number' }}</p>
              </div>
              <p v-if="createJudgeError" class="text-sm text-red-600">{{ createJudgeError }}</p>
              <div class="flex items-center gap-3 justify-end pt-2">
                <button
                  @click="closeJudgeModal"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  :disabled="creatingJudge || updatingJudge"
                >
                  Cancel
                </button>
                <button
                  @click="editingJudgeId ? updateJudge() : createJudge()"
                  class="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  :disabled="creatingJudge || updatingJudge"
                >
                  {{ creatingJudge ? 'Creating...' : updatingJudge ? 'Updating...' : editingJudgeId ? 'Update' : 'Create' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Assign Judges to Event Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showAssignJudgesModal && selectedEvent"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          @click.self="showAssignJudgesModal = false"
        >
          <div class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">
                Assign Judges to {{ selectedEvent.name }}
              </h2>
              <button
                @click="showAssignJudgesModal = false"
                class="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="p-6 overflow-y-auto flex-1">
              <div v-if="loadingJudgesForAssign" class="text-center py-8 text-gray-500">
                Loading judges...
              </div>
              <div v-else class="space-y-2">
                <label
                  v-for="judge in allJudges"
                  :key="judge.id"
                  class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :value="judge.id"
                    v-model="selectedJudgeIds"
                    class="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <div class="flex-1">
                    <div class="font-medium text-gray-900">{{ judge.judgeName }}</div>
                    <div class="text-sm text-gray-500">{{ judge.mobileNumber }}</div>
                  </div>
                </label>
              </div>
              <div v-if="allJudges.length === 0" class="text-center py-8 text-gray-500">
                No judges available
              </div>
            </div>
            <div class="px-6 py-4 border-t border-gray-200 flex items-center gap-3 justify-end">
              <button
                @click="showAssignJudgesModal = false"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                :disabled="assigningJudges"
              >
                Cancel
              </button>
              <button
                @click="assignJudgesToEvent"
                class="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                :disabled="assigningJudges || selectedJudgeIds.length === 0"
              >
                {{ assigningJudges ? 'Assigning...' : 'Assign Judges' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Delete Judge Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showDeleteJudgeModal && selectedJudge"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          @click.self="showDeleteJudgeModal = false"
        >
          <div class="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-900">Delete Judge</h2>
            </div>
            <div class="p-6">
              <p class="text-gray-700 mb-6">
                Are you sure you want to delete <strong>{{ selectedJudge.judgeName }}</strong>? This action cannot be undone.
              </p>
              <div class="flex items-center gap-3 justify-end">
                <button
                  @click="showDeleteJudgeModal = false"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  :disabled="deletingJudge"
                >
                  Cancel
                </button>
                <button
                  @click="deleteJudge"
                  class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  :disabled="deletingJudge"
                >
                  {{ deletingJudge ? 'Deleting...' : 'Delete' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

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
const judges = ref<any[]>([])
const events = ref<any[]>([])
const notifications = ref<any[]>([])
const schools = ref<any[]>([])
const loadingJudges = ref(false)
const loadingEvents = ref(false)
const loadingNotifications = ref(false)

// Pagination for Judges
const judgesMetadata = ref<any>(null)
const judgesPage = ref(1)
const judgesLimit = ref(10)

// Pagination for Events
const eventsMetadata = ref<any>(null)
const eventsPage = ref(1)
const eventsLimit = ref(10)

// Pagination for Notifications
const notificationsMetadata = ref<any>(null)
const notificationsPage = ref(1)
const notificationsLimit = ref(10)

// Create Judge
const showCreateJudgeModal = ref(false)
const editingJudgeId = ref<string | null>(null)
const createJudgeForm = ref<{ judgeName: string; mobileNumber: string }>({
  judgeName: '',
  mobileNumber: '',
})
const creatingJudge = ref(false)
const updatingJudge = ref(false)
const createJudgeError = ref('')

// Assign Judges
const showAssignJudgesModal = ref(false)
const selectedEvent = ref<any>(null)
const allJudges = ref<any[]>([])
const selectedJudgeIds = ref<string[]>([])
const loadingJudgesForAssign = ref(false)
const assigningJudges = ref(false)

// Delete Judge
const showDeleteJudgeModal = ref(false)
const selectedJudge = ref<any>(null)
const deletingJudge = ref(false)

// Toggle Assignment Status
const togglingAssignmentId = ref<string | null>(null)
const removingAssignmentId = ref<string | null>(null)

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

const fetchJudges = async () => {
  loadingJudges.value = true
  try {
    const response = await $fetch('/api/judges', {
      params: {
        page: judgesPage.value,
        limit: judgesLimit.value,
      },
    })
    if (response.success) {
      judges.value = response.data || []
      judgesMetadata.value = response.metadata
    }
  } catch (err) {
    console.error('Failed to fetch judges:', err)
  } finally {
    loadingJudges.value = false
  }
}

const changeJudgesPage = (page: number) => {
  judgesPage.value = page
  fetchJudges()
}

const fetchEvents = async () => {
  loadingEvents.value = true
  try {
    // Fetch paginated events with judges in a single call
    const response = await $fetch('/api/events/with-judges', {
      params: {
        page: eventsPage.value,
        limit: eventsLimit.value,
      },
    })
    if (response.success) {
      events.value = response.data || []
      eventsMetadata.value = response.metadata
    }
  } catch (err) {
    console.error('Failed to fetch events:', err)
  } finally {
    loadingEvents.value = false
  }
}

const changeEventsPage = (page: number) => {
  eventsPage.value = page
  fetchEvents()
}

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
    // Paginated response format: { data: T[], metadata: {...} }
    schools.value = response.data || []
  } catch (err) {
    console.error('Failed to fetch schools:', err)
  }
}

const createJudge = async () => {
  createJudgeError.value = ''
  if (!createJudgeForm.value.judgeName || !createJudgeForm.value.mobileNumber) {
    createJudgeError.value = 'Judge name and mobile number are required'
    return
  }
  
  // Validate mobile number format
  if (!/^\d{10}$/.test(createJudgeForm.value.mobileNumber)) {
    createJudgeError.value = 'Mobile number must be 10 digits'
    return
  }

  creatingJudge.value = true
  try {
    const response = await $fetch('/api/judges', {
      method: 'POST',
      body: createJudgeForm.value,
    })
    if (response.success) {
      closeJudgeModal()
      await fetchJudges()
    }
  } catch (err: any) {
    createJudgeError.value = err.data?.message || 'Failed to create judge'
  } finally {
    creatingJudge.value = false
  }
}


const openAssignJudgeModal = async (event: any) => {
  selectedEvent.value = event
  selectedJudgeIds.value = []
  showAssignJudgesModal.value = true

  loadingJudgesForAssign.value = true
  try {
    // Fetch all judges (we need all for the selection modal)
    const response = await $fetch('/api/judges', { params: { limit: 1000 } })
    if (response.success) {
      allJudges.value = response.data || []
    }

    // Get already assigned judges for this event
    if (event.assignments && event.assignments.length > 0) {
      selectedJudgeIds.value = event.assignments.map((a: any) => a.judgeId)
    }
  } catch (err) {
    console.error('Failed to fetch judges:', err)
  } finally {
    loadingJudgesForAssign.value = false
  }
}

const assignJudgesToEvent = async () => {
  if (!selectedEvent.value || selectedJudgeIds.value.length === 0) return

  assigningJudges.value = true
  try {
    // Assign each judge to the event
    await Promise.all(
      selectedJudgeIds.value.map((judgeId) =>
        $fetch(`/api/judges/${judgeId}/assign`, {
          method: 'POST',
          body: {
            eventIds: [selectedEvent.value.id],
          },
        })
      )
    )
    showAssignJudgesModal.value = false
    await fetchEvents()
    await fetchJudges()
  } catch (err: any) {
    alert(err.data?.message || 'Failed to assign judges')
  } finally {
    assigningJudges.value = false
  }
}

const toggleAssignmentStatus = async (assignment: any) => {
  togglingAssignmentId.value = assignment.assignmentId
  try {
    await $fetch(`/api/event-judges/${assignment.assignmentId}/toggle`, {
      method: 'POST',
      body: {
        enabled: !assignment.enabled,
      },
    })
    assignment.enabled = !assignment.enabled
    await fetchEvents()
  } catch (err: any) {
    alert(err.data?.message || 'Failed to toggle assignment status')
  } finally {
    togglingAssignmentId.value = null
  }
}

const removeJudgeFromEvent = async (assignment: any) => {
  if (!confirm(`Are you sure you want to remove ${assignment.judgeName} from this event?`)) {
    return
  }

  removingAssignmentId.value = assignment.assignmentId
  try {
    await $fetch(`/api/event-judges/${assignment.assignmentId}`, {
      method: 'DELETE',
    })
    await fetchEvents()
  } catch (err: any) {
    alert(err.data?.message || 'Failed to remove judge from event')
  } finally {
    removingAssignmentId.value = null
  }
}

const openEditJudgeModal = (judge: any) => {
  editingJudgeId.value = judge.id
  createJudgeForm.value = {
    judgeName: judge.judgeName,
    mobileNumber: judge.mobileNumber,
  }
  showCreateJudgeModal.value = true
}

const closeJudgeModal = () => {
  showCreateJudgeModal.value = false
  editingJudgeId.value = null
  createJudgeForm.value = {
    judgeName: '',
    mobileNumber: '',
  }
  createJudgeError.value = ''
}

const updateJudge = async () => {
  if (!editingJudgeId.value) return

  createJudgeError.value = ''
  if (!createJudgeForm.value.judgeName || !createJudgeForm.value.mobileNumber) {
    createJudgeError.value = 'Judge name and mobile number are required'
    return
  }
  
  // Validate mobile number format
  if (!/^\d{10}$/.test(createJudgeForm.value.mobileNumber)) {
    createJudgeError.value = 'Mobile number must be 10 digits'
    return
  }

  updatingJudge.value = true
  try {
    const response = await $fetch(`/api/judges/${editingJudgeId.value}`, {
      method: 'PUT',
      body: createJudgeForm.value,
    })
    if (response.success) {
      closeJudgeModal()
      await fetchJudges()
    }
  } catch (err: any) {
    createJudgeError.value = err.data?.message || 'Failed to update judge'
  } finally {
    updatingJudge.value = false
  }
}

const openDeleteJudgeModal = (judge: any) => {
  selectedJudge.value = judge
  showDeleteJudgeModal.value = true
}

const deleteJudge = async () => {
  if (!selectedJudge.value) return

  deletingJudge.value = true
  try {
    await $fetch(`/api/judges/${selectedJudge.value.id}`, {
      method: 'DELETE',
    })
    showDeleteJudgeModal.value = false
    await fetchJudges()
  } catch (err: any) {
    alert(err.data?.message || 'Failed to delete judge')
  } finally {
    deletingJudge.value = false
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

const formatDate = (date: Date | string | number) => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Props
const props = defineProps<{
  isActive?: boolean
}>()

// Track if data has been loaded to avoid reloading unnecessarily
const dataLoaded = ref(false)

// Watch for tab activation and load data when tab becomes active
watch(() => props.isActive, async (isActive) => {
  if (isActive && !dataLoaded.value) {
    await Promise.all([fetchJudges(), fetchEvents(), fetchNotifications(), fetchSchools()])
    dataLoaded.value = true
  }
}, { immediate: true })
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
