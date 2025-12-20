<template>
  <div class="h-screen w-screen overflow-hidden bg-background relative">
    <!-- Background Pattern -->
    <div class="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
    
    <!-- Gradient Orbs -->
    <div class="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
    <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

    <!-- Main Content -->
    <div class="relative h-full flex flex-col">

      <main class="flex-1 flex items-center justify-center px-6">
        <div class="max-w-2xl mx-auto text-center">

          <!-- Error Code -->
          <div class="mb-6">
            <h1 class="text-8xl sm:text-9xl font-bold text-primary/20 mb-4">
              {{ error.statusCode || 'Error' }}
            </h1>
          </div>

          <!-- Error Message -->
          <h2 class="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {{ getErrorMessage() }}
          </h2>

          <!-- Error Description -->
          <p class="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
            {{ getErrorDescription() }}
          </p>
          
        </div>
      </main>

    </div>
  </div>
</template>

<script setup lang="ts">
interface ErrorProps {
  error: {
    statusCode?: number
    statusMessage?: string
    message?: string
  }
}

const props = defineProps<ErrorProps>()

const getErrorMessage = () => {
  if (props.error.statusMessage) {
    return props.error.statusMessage
  }
  
  switch (props.error.statusCode) {
    case 404:
      return 'Page Not Found'
    case 403:
      return 'Access Forbidden'
    case 500:
      return 'Server Error'
    default:
      return 'Something Went Wrong'
  }
}

const getErrorDescription = () => {
  switch (props.error.statusCode) {
    case 404:
      return 'The page you are looking for does not exist or has been moved.'
    case 403:
      return 'You do not have permission to access this resource.'
    case 500:
      return 'An internal server error occurred. Please try again later.'
    default:
      return props.error.message || 'An unexpected error occurred. Please try again or contact support if the problem persists.'
  }
}
</script>

<style scoped>
.bg-grid-pattern {
  background-image: 
    linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
    linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px);
  background-size: 40px 40px;
}
</style>
