import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
import { useRouter } from "next/navigation"
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <NuxtLink to="/faculty/dashboard" class="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
              ← Back to Dashboard
            </NuxtLink>
            <h1 class="text-2xl font-bold text-gray-900">Event Registrations</h1>
          </div>
          <NuxtLink
            to="/faculty/registrations/new"
            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
          >
            + New Registration
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Registrations List -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">
            All Registrations ({{ registrations.length }})
          </h2>
        </div>

        <div v-if="loading" class="text-center py-12 text-gray-500">
          Loading registrations...
        </div>

        <div v-else-if="registrations.length === 0" class="text-center py-12 text-gray-500">
          <p>No registrations yet.</p>
          <NuxtLink to="/faculty/registrations/new" class="text-green-600 hover:text-green-700 font-medium mt-2 inline-block">
            Register students for events
          </NuxtLink>
        </div>

        <div v-else class="divide-y divide-gray-200">
          <div
            v-for="registration in registrations"
            :key="registration.id"
            class="p-6 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-lg font-semibold text-gray-900">
                    {{ registration.event?.name }}
                  </h3>
                  <span
                    class="px-2 py-1 text-xs font-medium rounded-full"
                    :class="{
                      'bg-blue-100 text-blue-800': registration.event?.eventType === 'Individual',
                      'bg-purple-100 text-purple-800': registration.event?.eventType === 'Group',
                      'bg-green-100 text-green-800': registration.event?.eventType === 'Combined',
                    }"
                  >
                    {{ registration.event?.eventType }}
                  </span>
                  <span
                    class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800"
                  >
                    {{ registration.event?.ageCategory }}
                  </span>
                </div>

                <p v-if="registration.teamName" class="text-sm text-gray-600 mb-2">
                  Team: <span class="font-medium">{{ registration.teamName }}</span>
                </p>

                <div class="flex flex-wrap gap-2 mt-3">
                  <div
                    v-for="participant in registration.participants"
                    :key="participant.id"
                    class="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full"
                  >
                    <div class="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs text-blue-700 font-semibold">
                      {{ participant.studentName.charAt(0).toUpperCase() }}
                    </div>
                    <span class="text-sm text-gray-700">{{ participant.studentName }}</span>
                  </div>
                </div>
              </div>

              <div class="text-right text-sm text-gray-500">
                {{ formatDate(registration.createdAt) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

const faculty = ref<any>(null)
const registrations = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  const storedFaculty = localStorage.getItem('faculty')
  if (!storedFaculty) {
    router.push('/faculty/login')
    return
  }

  faculty.value = JSON.parse(storedFaculty)

  try {
    const response = await $fetch(`/api/registrations/by-school?schoolId=${faculty.value.schoolId}`)
    registrations.value = response.registrations
  } catch (err) {
    console.error('Failed to fetch registrations:', err)
  } finally {
    loading.value = false
  }
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
</script>
