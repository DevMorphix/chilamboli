<script setup lang="ts">
definePageMeta({
  middleware: defineNuxtRouteMiddleware(() => {
    return navigateTo('/volunteer/login', { redirectCode: 301 })
  })
})
</script>
