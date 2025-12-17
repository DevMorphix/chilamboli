import { ref } from "vue"

export const useFaculty = () => {
  const router = useRouter()
  const faculty = ref<any>(null)

  const checkAuth = () => {
    if (import.meta.client) {
      const storedFaculty = localStorage.getItem("faculty")
      if (!storedFaculty) {
        router.push("/faculty/login")
        return false
      }
      faculty.value = JSON.parse(storedFaculty)
      return true
    }
    return false
  }

  const logout = () => {
    if (import.meta.client) {
      localStorage.removeItem("faculty")
      router.push("/faculty/login")
    }
  }

  return {
    faculty,
    checkAuth,
    logout,
  }
}
