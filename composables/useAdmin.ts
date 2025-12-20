import { ref } from "vue"

export const useAdmin = () => {
  const router = useRouter()
  const admin = ref<any>(null)

  const checkAuth = () => {
    if (import.meta.client) {
      const storedAdmin = localStorage.getItem("admin")
      if (!storedAdmin) {
        router.push("/admin/login")
        return false
      }
      admin.value = JSON.parse(storedAdmin)
      return true
    }
    return false
  }

  const logout = () => {
    if (import.meta.client) {
      localStorage.removeItem("admin")
      router.push("/admin/login")
    }
  }

  return {
    admin,
    checkAuth,
    logout,
  }
}

