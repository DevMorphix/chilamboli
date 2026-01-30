<template>
  <div>
    <!-- Dashboard Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <NuxtLink
        to="/volunteer/spot-registration"
        class="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow p-4 sm:p-6 transition-colors flex items-center justify-between group"
      >
        <div class="flex-1 min-w-0">
          <h3 class="text-base sm:text-lg font-semibold">Spot Registration</h3>
          <p class="text-blue-100 text-xs sm:text-sm mt-1">Add students and create registrations on the spot</p>
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
  layout: 'volunteer'
})

const { volunteer, checkAuth } = useVolunteer()

onMounted(() => {
  checkAuth()
})
</script>
