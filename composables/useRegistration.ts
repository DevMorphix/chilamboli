export const useRegistration = () => {
  const config = useRuntimeConfig()
  
  const isRegistrationOpen = computed(() => {
    return config.public.registrationOpen === true
  })
  
  return {
    isRegistrationOpen,
  }
}
