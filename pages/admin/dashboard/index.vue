<script setup lang="ts">
definePageMeta({
  middleware: defineNuxtRouteMiddleware(() => {
    return navigateTo('/admin/dashboard/analytics', { redirectCode: 301 })
  })
})
</script>
