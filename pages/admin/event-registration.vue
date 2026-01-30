<template>
  <div class="min-h-screen bg-gray-50 grid grid-rows-[auto_1fr_auto]">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <NuxtLink to="/admin/dashboard/control-center" class="text-amber-600 hover:text-amber-700 text-sm mb-2 inline-block">
              ← Back to Control Center
            </NuxtLink>
            <h1 class="text-2xl font-bold text-gray-900">Event registration</h1>
            <p class="text-sm text-gray-500 mt-1">Close or reopen registration per event.</p>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by event name..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Age category</label>
            <select
              v-model="ageCategory"
              @change="fetchEvents"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All</option>
              <option value="Sub Junior">Sub Junior</option>
              <option value="Junior">Junior</option>
              <option value="Senior">Senior</option>
              <option value="Combined">Combined</option>
              <option value="Special">Special</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select
              v-model="eventType"
              @change="fetchEvents"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="Individual">Individual</option>
              <option value="Group">Group</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Events List -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">
            Events ({{ filteredEvents.length }})
          </h2>
        </div>

        <div v-if="loading" class="text-center py-12 text-gray-500">
          Loading events...
        </div>

        <div v-else-if="events.length === 0" class="text-center py-12 text-gray-500">
          <p>No events found.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                <th class="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                <th class="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th class="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Registration</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="ev in filteredEvents" :key="ev.id" class="hover:bg-gray-50">
                <td class="px-6 py-2">
                  <p class="text-sm font-semibold text-gray-900">{{ ev.name }}</p>
                </td>
                <td class="px-6 py-2">
                  <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">{{ ev.ageCategory }}</span>
                </td>
                <td class="px-6 py-2">
                  <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{{ ev.eventType }}</span>
                </td>
                <td class="px-6 py-2 text-right">
                  <span v-if="ev.registrationClosed" class="mr-2 text-xs font-medium text-amber-700">Closed</span>
                  <button
                    @click="toggleRegistrationClosed(ev)"
                    :disabled="togglingId === ev.id"
                    :class="[ev.registrationClosed ? 'bg-teal-600 hover:bg-teal-700' : 'bg-amber-600 hover:bg-amber-700', 'text-white px-3 py-1.5 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors']"
                  >
                    {{ togglingId === ev.id ? '...' : (ev.registrationClosed ? 'Reopen' : 'Close') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const searchQuery = ref('')
const ageCategory = ref('')
const eventType = ref<'Individual' | 'Group'>('Individual')
const events = ref<any[]>([])
const loading = ref(false)
const togglingId = ref<string | null>(null)

const filteredEvents = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return events.value
  return events.value.filter((ev) => ev.name?.toLowerCase().includes(q))
})

const fetchEvents = async () => {
  loading.value = true
  try {
    const params: Record<string, string | number> = { eventType: eventType.value, limit: 200 }
    if (ageCategory.value) params.ageCategory = ageCategory.value
    const res = await $fetch<{ data?: any[] }>('/api/events/by-category', { params })
    events.value = res.data || []
  } catch (err) {
    console.error('Failed to fetch events:', err)
    events.value = []
  } finally {
    loading.value = false
  }
}

const toggleRegistrationClosed = async (ev: any) => {
  const newValue = !ev.registrationClosed
  const message = newValue
    ? `Close registration for "${ev.name}"? This event will be hidden from spot registration.`
    : `Reopen registration for "${ev.name}"? This event will appear in spot registration again.`
  if (!confirm(message)) return

  togglingId.value = ev.id
  try {
    await $fetch(`/api/events/${ev.id}/registration-closed`, {
      method: 'POST',
      body: { registrationClosed: newValue },
    })
    ev.registrationClosed = newValue
  } catch (err: any) {
    alert(err.data?.message || 'Failed to update registration status')
  } finally {
    togglingId.value = null
  }
}

onMounted(fetchEvents)
</script>
