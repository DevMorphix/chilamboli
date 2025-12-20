<template>
  <footer class="bg-white border-t border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
      <div class="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 sm:gap-4 text-center sm:text-left">
        <p class="text-xs text-muted-foreground/90">
          © {{ new Date().getFullYear() }} Chilamboli. All rights reserved.
        </p>
        <p class="text-xs text-muted-foreground/90">
          Powered by 
          <a 
            href="https://devmorphix.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="font-medium text-primary hover:underline"
          >Devmorphix</a>
        </p>
      </div>
    </div>
  </footer>
</template>

