<template>
  <div>
    <!-- Control Center Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <NuxtLink
        to="/admin/event-registration"
        class="bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow p-4 sm:p-6 transition-colors flex items-center justify-between group"
      >
        <div class="flex-1 min-w-0">
          <h3 class="text-base sm:text-lg font-semibold">Manage Event Registration</h3>
          <p class="text-amber-100 text-xs sm:text-sm mt-1">Close or reopen registration per event</p>
        </div>
        <svg class="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </NuxtLink>

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

      <NuxtLink
        to="/admin/spot-registration"
        class="bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow p-4 sm:p-6 transition-colors flex items-center justify-between group"
      >
        <div class="flex-1 min-w-0">
          <h3 class="text-base sm:text-lg font-semibold">Spot Registration</h3>
          <p class="text-teal-100 text-xs sm:text-sm mt-1">Add students and create registrations on the spot</p>
        </div>
        <svg class="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </NuxtLink>

      <NuxtLink
        to="/admin/presentation"
        target="_blank"
        class="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg shadow-lg p-4 sm:p-6 transition-all flex items-center justify-between group border-2 border-amber-400/50"
      >
        <div class="flex-1 min-w-0">
          <h3 class="text-base sm:text-lg font-semibold">Live Presentation</h3>
          <p class="text-amber-100 text-xs sm:text-sm mt-1">Fullscreen leaderboard presentation mode</p>
        </div>
        <svg class="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
