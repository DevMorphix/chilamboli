<template>
  <div class="min-h-screen bg-gray-50 relative grid grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div class="flex flex-row items-center justify-between gap-3 sm:gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex flex-col items-start">
              <h1 class="text-xl sm:text-2xl font-bold text-gray-900 truncate">Admin Dashboard</h1>
              <p class="hidden lg:inline text-xs text-gray-600 truncate">Comprehensive System Insights & Performance Metrics</p>
            </div>
          </div>
          <div class="flex items-center gap-2 sm:gap-4">
            <div class="text-right flex-1 sm:flex-none min-w-0">
              <p class="text-xs sm:text-sm font-medium text-gray-900 truncate">{{ admin?.email }}</p>
              <p class="text-xs text-gray-500 truncate hidden sm:block">Administrator</p>
            </div>
            <button
              @click="handleLogout"
              class="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors border border-red-500 flex-shrink-0"
              title="Logout"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 w-full">
      <!-- Tabs Navigation -->
      <div class="border-b border-gray-200 mb-6">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          <NuxtLink
            to="/admin/dashboard/analytics"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
            :class="isActive('/admin/dashboard/analytics') 
              ? 'border-purple-500 text-purple-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          >
            Analytics
          </NuxtLink>
          <NuxtLink
            to="/admin/dashboard/control-center"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
            :class="isActive('/admin/dashboard/control-center') 
              ? 'border-purple-500 text-purple-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          >
            Control Center
          </NuxtLink>
          <NuxtLink
            to="/admin/dashboard/leaderboard"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors"
            :class="isActive('/admin/dashboard/leaderboard') 
              ? 'border-purple-500 text-purple-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          >
            Leaderboard
          </NuxtLink>
        </nav>
      </div>

      <slot />
    </main>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { admin, checkAuth, logout } = useAdmin()


const isActive = (path: string) => {
  return route.path === path
}

const handleLogout = () => {
  logout()
}

onMounted(() => {
  checkAuth()
})
</script>
