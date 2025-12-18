/**
 * Composable to convert relative URLs to full URLs using R2 public URL
 */
export const useUrl = () => {
  const config = useRuntimeConfig()
  
  /**
   * Converts a relative URL to a full URL
   * If the URL is already absolute, returns it as-is
   */
  const toFullUrl = (url: string | null | undefined): string | null => {
    if (!url) return null
    
    // If already a full URL, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    
    // Remove leading slash if present
    const cleanPath = url.startsWith('/') ? url.slice(1) : url
    const baseUrl = config.public.r2PublicUrl || ''
    
    if (!baseUrl) {
      console.warn('R2_PUBLIC_URL is not configured')
      return url
    }
    
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    
    return `${cleanBase}/${cleanPath}`
  }
  
  return {
    toFullUrl,
  }
}

