import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || 'fittrack.app.help@gmail.com',
    pass: process.env.SMTP_PASS, // 16-character Google App Password
  },
})

/**
 * Sends a 6-digit password reset verification code via email.
 * If SMTP_PASS is not configured in .env, falls back to console logging so local dev is unblocked.
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  code: string,
  firstName?: string
): Promise<{ success: boolean; delivered: boolean }> {
  const subject = 'FitTrack - Your Password Reset Code'
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; color: #1f2937;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #2563eb; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">FitTrack</h1>
        <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Smart Fitness & Nutrition Tracking</p>
      </div>

      <p style="font-size: 16px; line-height: 1.5; color: #111827; font-weight: 500;">
        Hello${firstName ? ` ${firstName}` : ''},
      </p>

      <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
        We received a request to reset the password for your FitTrack account. Use the 6-digit verification code below to proceed:
      </p>

      <div style="background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%); border: 1.5px dashed #3b82f6; border-radius: 14px; padding: 22px; text-align: center; margin: 28px 0;">
        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #2563eb; margin-bottom: 6px;">
          Verification Code
        </div>
        <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1e3a8a; font-family: monospace;">
          ${code}
        </div>
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #6b7280;">
        ⏱️ This code will expire in <strong>15 minutes</strong>. If you did not request a password reset, you can safely ignore this email — your account remains protected.
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0 20px 0;" />

      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0; line-height: 1.4;">
        Need assistance? Contact our support team directly at<br/>
        <a href="mailto:fittrack.app.help@gmail.com" style="color: #2563eb; text-decoration: none; font-weight: 600;">fittrack.app.help@gmail.com</a>
      </p>
    </div>
  `

  if (!process.env.SMTP_PASS) {
    console.log('\n======================================================')
    console.log('[EMAIL SERVICE - SIMULATED DELIVERY]')
    console.log(`To:       ${toEmail}`)
    console.log(`Code:     ${code}`)
    console.log(`Subject:  ${subject}`)
    console.log('NOTE: To deliver real emails, set SMTP_PASS in server/.env with a Gmail App Password.')
    console.log('======================================================\n')
    return { success: true, delivered: false }
  }

  try {
    await transporter.sendMail({
      from: `"FitTrack Support" <${process.env.SMTP_USER || 'fittrack.app.help@gmail.com'}>`,
      to: toEmail,
      subject,
      html: htmlContent,
      text: `Your FitTrack password reset code is: ${code}. It expires in 15 minutes.`,
    })
    console.log(`[EMAIL SERVICE] Successfully delivered password reset email to ${toEmail}`)
    return { success: true, delivered: true }
  } catch (error: any) {
    console.error(`[EMAIL ERROR] Failed sending to ${toEmail}:`, error.message || error)
    // Fallback log so testing can still proceed
    console.log(`[FALLBACK CODE FOR ${toEmail}]: ${code}`)
    return { success: true, delivered: false }
  }
}
