<template>
  <div class="h-screen w-screen overflow-hidden bg-background relative">
    <!-- Animated Background Pattern -->
    <div class="absolute inset-0 bg-grid-pattern opacity-[0.03] animate-grid" />
    
    <!-- Enhanced Gradient Orbs with Animation -->
    <div class="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl animate-pulse-slow" />
    <div class="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl animate-pulse-slow" style="animation-delay: 1s;" />
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl animate-pulse-slow" style="animation-delay: 2s;" />

    <!-- Main Content -->
    <div class="relative h-full flex flex-col">
      <!-- Modern Header -->
      <header class="px-6 sm:px-8 py-4 flex items-center justify-between backdrop-blur-sm bg-background/80 border-b border-border/50">
        <div class="flex items-center gap-3">
          <div class="relative">
            <img 
              src="/NewLogo.png" 
              alt="Chilamboli Logo" 
              class="h-11 w-auto transition-transform hover:scale-105"
            />
          </div>
          <span class="font-bold text-xl text-foreground tracking-tight malayalam-text leading-none">ചിലമ്പൊലി</span>
        </div>
        
        <nav class="flex items-center gap-2">
          <NuxtLink 
            to="/faculty/login" 
            class="px-5 py-2.5 text-sm font-medium text-foreground transition-all rounded-lg bg-muted hover:border hover:border-border"
          >
            Faculty Login
          </NuxtLink>
        </nav>
      </header>

      <!-- Hero Section -->
      <main class="flex-1 flex items-center justify-center px-6 sm:px-8 py-8">
        <div class="max-w-5xl mx-auto text-center w-full">
          <!-- Status Badge -->
          <div class="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-8 animate-fade-in">
            <span class="relative flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-500 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-gray-800"></span>
            </span>
            <span>Registrations opend</span>
          </div>

          <!-- Logo with Animation -->
          <div class="flex justify-center mb-10 animate-fade-in-up" style="animation-delay: 0.1s;">
            <div class="relative">
              <div class="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-150 opacity-50"></div>
              <img 
                src="/NewLogo.png" 
                alt="Chilamboli Logo" 
                class="h-36 sm:h-40 w-auto relative z-10 drop-shadow-lg"
              />
            </div>
          </div>

          <!-- Malayalam Tagline -->
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-6 malayalam-text leading-tight animate-fade-in-up" style="animation-delay: 0.2s;">
            6-മത് സംസ്ഥാന സ്പെഷ്യൽ സ്കൂൾ കലാമേള
          </h2>

          <!-- Description -->
          <p class="flex flex-col gap-2 lg:gap-1 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 animate-fade-in-up" style="animation-delay: 0.3s;">
            <span>Official portal for inter-school competitions, cultural events, and academic programs.</span>
            <span class="text-lg text-foreground/80 font-medium">Faculty members can register students from their schools.</span>
          </p>

          <!-- CTA Buttons -->
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 animate-fade-in-up" style="animation-delay: 0.4s;">
            <NuxtLink 
              to="/faculty/login" 
              class="group inline-flex items-center justify-center gap-3 px-10 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 active:translate-y-0"
            >
              <svg class="h-5 w-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Access Faculty Portal</span>
              <svg class="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </NuxtLink>
          </div>

          <!-- Info Text -->
          <!-- <p class="text-sm gap-3 flex justify-center text-muted-foreground animate-fade-in-up" style="animation-delay: 0.5s;">
            New faculty member? 
            <NuxtLink 
              to="/faculty/register" 
              class="text-primary font-medium hover:underline underline-offset-4 transition-colors"
            >
              Register here
            </NuxtLink>
          </p> -->
        </div>
      </main>

      <!-- Modern Footer -->
      <footer class="px-6 sm:px-8 py-5 text-center backdrop-blur-sm bg-background/80 border-t border-border/50">
        <div class="text-xs text-muted-foreground/90 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <span>© {{ new Date().getFullYear() }} Chilamboli</span>
          <span class="hidden sm:inline">•</span>
          <span>All rights reserved</span>
          <span class="hidden sm:inline">•</span>
          <span class="w-full sm:w-auto flex items-center justify-center gap-1.5">
            <span>Powered by</span>
            <a 
              href="https://devmorphix.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="font-semibold text-primary hover:underline underline-offset-2 transition-colors"
            >
              Devmorphix
            </a>
          </span>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
// Single frame landing page - no scroll needed
</script>

<style scoped>
.malayalam-text {
  font-family: 'Chilanka', cursive;
}

.bg-grid-pattern {
  background-image: 
    linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
    linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px);
  background-size: 50px 50px;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-slow {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

@keyframes grid {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(50px, 50px);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out forwards;
}

.animate-fade-in-up {
  animation: fade-in-up 0.8s ease-out forwards;
  opacity: 0;
}

.animate-pulse-slow {
  animation: pulse-slow 8s ease-in-out infinite;
}

.animate-grid {
  animation: grid 20s linear infinite;
}
</style>
