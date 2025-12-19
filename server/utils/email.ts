import { Resend } from "resend"

interface EmailConfig {
  resendApiKey: string
}

let resendInstance: Resend | null = null
let currentApiKey: string | null = null

function getResend(apiKey: string): Resend {
  // Recreate client if API key changed
  if (resendInstance && currentApiKey === apiKey) {
    return resendInstance
  }

  currentApiKey = apiKey
  resendInstance = new Resend(apiKey)
  return resendInstance
}

export async function sendOtpEmail(to: string, otp: string, config: EmailConfig): Promise<void> {
  if (!config.resendApiKey || config.resendApiKey.trim() === "") {
    throw new Error("RESEND_API_KEY is not configured. Please ensure the RESEND_API_KEY environment variable is set in your Cloudflare Pages environment variables or .dev.vars file for local development.")
  }

  const resend = getResend(config.resendApiKey)


  const { data, error } = await resend.emails.send({
    from: 'Chilampoli <noreply@resend.devmorphix.com>',
    to: to,
    subject: `Your OTP Verification Code`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
            <p>Hello,</p>
            <p>Thank you for registering. Please use the following OTP code to verify your email address:</p>
            <div style="background-color: #fff; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              Best regards,<br>
              Chilamboli Team
            </p>
          </div>
        </body>
      </html>
    `
  })

  if (error) {
    console.error("Error sending OTP email:", error)
    throw new Error(`Failed to send OTP email: ${error.message}`)
  }
}

