// KV Store utilities for OTP management

const OTP_PREFIX = "otp:"
const OTP_TTL = 10 * 60 // 10 minutes in seconds

interface OtpData {
  otp: string
  createdAt: number
}

export async function storeOtp(facultyId: string, otp: string): Promise<void> {
  const storage = useStorage("kv")
  const key = `${OTP_PREFIX}${facultyId}`
  const data: OtpData = {
    otp,
    createdAt: Date.now(),
  }
  await storage.setItem(key, data, { ttl: OTP_TTL })
}

export async function getOtp(facultyId: string): Promise<OtpData | null> {
  const storage = useStorage("kv")
  const key = `${OTP_PREFIX}${facultyId}`
  const data = await storage.getItem<OtpData>(key)
  return data || null
}

export async function deleteOtp(facultyId: string): Promise<void> {
  const storage = useStorage("kv")
  const key = `${OTP_PREFIX}${facultyId}`
  await storage.removeItem(key)
}

export async function verifyOtp(facultyId: string, inputOtp: string): Promise<{ valid: boolean; message: string }> {
  const otpData = await getOtp(facultyId)

  if (!otpData) {
    return { valid: false, message: "No OTP found. Please request a new one." }
  }

  // Check if OTP has expired (10 minutes)
  const isExpired = Date.now() - otpData.createdAt > OTP_TTL * 1000
  if (isExpired) {
    await deleteOtp(facultyId)
    return { valid: false, message: "OTP has expired. Please request a new one." }
  }

  if (otpData.otp !== inputOtp) {
    return { valid: false, message: "Invalid OTP" }
  }

  return { valid: true, message: "OTP verified successfully" }
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
