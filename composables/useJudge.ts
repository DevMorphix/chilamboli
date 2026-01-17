import { ref } from "vue"

export const useJudge = () => {
  const router = useRouter()
  const judge = ref<any>(null)

  const checkAuth = () => {
    if (import.meta.client) {
      const storedJudge = localStorage.getItem("judge")
      if (!storedJudge) {
        router.push("/judge/login")
        return false
      }
      judge.value = JSON.parse(storedJudge)
      return true
    }
    return false
  }

  const logout = () => {
    if (import.meta.client) {
      localStorage.removeItem("judge")
      router.push("/judge/login")
    }
  }

  return {
    judge,
    checkAuth,
    logout,
  }
}
