<template>
  <div>
    <!-- Control Center Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <NuxtLink
        to="/admin/judges"
        class="bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow p-4 sm:p-6 transition-colors flex items-center justify-between group"
      >
        <div class="flex-1 min-w-0">
          <h3 class="text-base sm:text-lg font-semibold">Manage Judges</h3>
          <p class="text-purple-100 text-xs sm:text-sm mt-1">Create, assign, and manage judges</p>
        </div>
        <svg class="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </NuxtLink>

      <NuxtLink
        to="/admin/event-judges"
        class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow p-4 sm:p-6 transition-colors flex items-center justify-between group"
      >
        <div class="flex-1 min-w-0">
          <h3 class="text-base sm:text-lg font-semibold">Event-Judge Assignments</h3>
          <p class="text-indigo-100 text-xs sm:text-sm mt-1">Assign judges to events and manage their assignments</p>
        </div>
        <svg class="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </NuxtLink>

      <NuxtLink
        to="/admin/notifications"
        class="bg-green-600 hover:bg-green-700 text-white rounded-lg shadow p-4 sm:p-6 transition-colors flex items-center justify-between group"
      >
        <div class="flex-1 min-w-0">
          <h3 class="text-base sm:text-lg font-semibold">Manage Notifications</h3>
          <p class="text-green-100 text-xs sm:text-sm mt-1">Create and manage notifications for schools</p>
        </div>
        <svg class="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})
</script>
