<script setup lang="ts">
definePageMeta({
  middleware: defineNuxtRouteMiddleware(() => {
    return navigateTo('/judge/login', { redirectCode: 301 })
  })
})
</script>
