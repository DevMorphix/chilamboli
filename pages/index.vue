<template>
  <div class="h-screen w-screen overflow-hidden bg-background relative">
    <!-- Background Pattern -->
    <div class="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
    
    <!-- Gradient Orbs -->
    <div class="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
    <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

    <!-- Main Content -->
    <div class="relative h-full flex flex-col">
      <!-- Header -->
      <header class="px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <svg class="h-5 w-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span class="font-semibold text-lg text-foreground">Chilamboli</span>
        </div>
        
        <nav class="flex items-center gap-3">
          <NuxtLink 
            to="/faculty/login" 
            class="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Faculty Login
          </NuxtLink>
        </nav>
      </header>

      <!-- Hero Section -->
      <main class="flex-1 flex items-center justify-center px-6">
        <div class="max-w-3xl mx-auto text-center">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Registrations Open
          </div>

          <!-- Title -->
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6">
            School Event
            <span class="block text-primary">Registration Portal</span>
          </h1>

          <!-- Description -->
          <p class="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Official portal for inter-school competitions, cultural events, and academic programs. Faculty members can register students from their schools.
          </p>

          <!-- CTA Button -->
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <NuxtLink 
              to="/faculty/login" 
              class="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Faculty Portal
            </NuxtLink>
          </div>

          <!-- Info Text -->
          <p class="mt-6 text-sm text-muted-foreground">
            Are you a faculty member? <NuxtLink to="/faculty/register" class="text-primary hover:underline">Register here</NuxtLink>
          </p>

          <!-- Stats -->
          <div class="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div class="text-center">
              <div class="text-2xl sm:text-3xl font-bold text-foreground">50+</div>
              <div class="text-sm text-muted-foreground">Events</div>
            </div>
            <div class="text-center">
              <div class="text-2xl sm:text-3xl font-bold text-foreground">100+</div>
              <div class="text-sm text-muted-foreground">Schools</div>
            </div>
            <div class="text-center">
              <div class="text-2xl sm:text-3xl font-bold text-foreground">5000+</div>
              <div class="text-sm text-muted-foreground">Students</div>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="px-6 py-4 text-center">
        <p class="text-sm text-muted-foreground">
          © {{ new Date().getFullYear() }} Chilamboli. All rights reserved.
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
// Single frame landing page - no scroll needed
</script>

<style scoped>
.bg-grid-pattern {
  background-image: 
    linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
    linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px);
  background-size: 40px 40px;
}
</style>
