import { ref } from "vue"

export const useVolunteer = () => {
  const router = useRouter()
  const volunteer = ref<any>(null)

  const checkAuth = () => {
    if (import.meta.client) {
      const storedVolunteer = localStorage.getItem("volunteer")
      if (!storedVolunteer) {
        router.push("/volunteer/login")
        return false
      }
      volunteer.value = JSON.parse(storedVolunteer)
      return true
    }
    return false
  }

  const logout = () => {
    if (import.meta.client) {
      localStorage.removeItem("volunteer")
      router.push("/volunteer/login")
    }
  }

  return {
    volunteer,
    checkAuth,
    logout,
  }
}
