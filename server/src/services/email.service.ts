import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  rateLimit: 5,
  auth: {
    user: process.env.SMTP_USER || 'fittrack.app.help@gmail.com',
    pass: process.env.SMTP_PASS, // 16-character Google App Password
  },
})

interface CodeEmailOptions {
  toEmail: string
  code: string
  firstName?: string
  subject: string
  intro: string
  footerNote: string
  plainText: string
}

/**
 * Shared sender for 6-digit code emails.
 * If SMTP_PASS is not configured in .env, falls back to console logging so local dev is unblocked.
 */
async function sendCodeEmail(opts: CodeEmailOptions): Promise<{ success: boolean; delivered: boolean }> {
  const { toEmail, code, firstName, subject, intro, footerNote, plainText } = opts
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
        ${intro}
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
        ⏱️ This code will expire in <strong>15 minutes</strong>. ${footerNote}
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0 20px 0;" />

      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0; line-height: 1.4;">
        Need assistance? Contact our support team directly at<br/>
        <a href="mailto:fittrack.app.help@gmail.com" style="color: #2563eb; text-decoration: none; font-weight: 600;">fittrack.app.help@gmail.com</a>
      </p>
    </div>
  `

  if (!process.env.SMTP_PASS) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[EMAIL SERVICE] SMTP credentials are not configured on the production server.')
      return { success: false, delivered: false }
    }
    console.log('\n======================================================')
    console.log('[EMAIL SERVICE - DEV SIMULATED DELIVERY]')
    console.log(`To:       ${toEmail}`)
    console.log(`Subject:  ${subject}`)
    console.log(`Code:     ${code}`)
    console.log('NOTE: In production, SMTP_PASS must be configured.')
    console.log('======================================================\n')
    return { success: true, delivered: false }
  }

  try {
    await transporter.sendMail({
      from: `"FitTrack Support" <${process.env.SMTP_USER || 'fittrack.app.help@gmail.com'}>`,
      to: toEmail,
      subject,
      html: htmlContent,
      text: plainText,
    })
    return { success: true, delivered: true }
  } catch (error: any) {
    console.error(`[EMAIL ERROR] Failed sending to ${toEmail}:`, error.message || 'Unknown SMTP error')
    return { success: false, delivered: false }
  }
}

/**
 * Sends a 6-digit password reset verification code via email.
 */
export function sendPasswordResetEmail(
  toEmail: string,
  code: string,
  firstName?: string
): Promise<{ success: boolean; delivered: boolean }> {
  return sendCodeEmail({
    toEmail,
    code,
    firstName,
    subject: 'FitTrack - Your Password Reset Code',
    intro:
      'We received a request to reset the password for your FitTrack account. Use the 6-digit verification code below to proceed:',
    footerNote:
      'If you did not request a password reset, you can safely ignore this email — your account remains protected.',
    plainText: `Your FitTrack password reset code is: ${code}. It expires in 15 minutes.`,
  })
}

/**
 * Sends a 6-digit email verification code used to confirm ownership of an email during sign-up.
 */
export function sendEmailVerificationEmail(
  toEmail: string,
  code: string,
  firstName?: string
): Promise<{ success: boolean; delivered: boolean }> {
  return sendCodeEmail({
    toEmail,
    code,
    firstName,
    subject: 'FitTrack - Verify Your Email',
    intro:
      'Welcome to FitTrack! Enter the 6-digit code below in the app to verify your email address and continue setting up your account:',
    footerNote: 'If you did not try to create a FitTrack account, you can safely ignore this email.',
    plainText: `Your FitTrack email verification code is: ${code}. It expires in 15 minutes.`,
  })
}

/**
 * Sends an email update to a user when their support ticket status changes or is resolved.
 */
export async function sendTicketResolutionEmail(opts: {
  toEmail: string
  userName?: string
  ticketId: string
  subject: string
  status: string
  adminNotes?: string
}): Promise<boolean> {
  const { toEmail, userName, ticketId, subject, status, adminNotes } = opts
  const isResolved = status === 'RESOLVED'
  const statusLabel = isResolved ? 'Resolved' : 'In Progress'
  const statusColor = isResolved ? '#10B981' : '#F59E0B'

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; color: #1f2937;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #10B981; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">FitTrack Support</h1>
        <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Support Request Update</p>
      </div>

      <p style="font-size: 16px; line-height: 1.5; color: #111827; font-weight: 500;">
        Hello${userName ? ` ${userName}` : ''},
      </p>

      <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
        Your inquiry regarding <strong>"${subject}"</strong> has been updated by our team.
      </p>

      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; margin: 20px 0;">
        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #6b7280; margin-bottom: 6px;">
          Ticket Status
        </div>
        <div style="font-size: 16px; font-weight: 700; color: ${statusColor}; margin-bottom: 12px;">
          ● ${statusLabel}
        </div>
        ${adminNotes ? `
        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #6b7280; margin-bottom: 4px;">
          Admin Response / Notes:
        </div>
        <div style="font-size: 14px; color: #374151; line-height: 1.5; white-space: pre-line;">
          ${adminNotes}
        </div>` : ''}
      </div>

      <p style="font-size: 13px; line-height: 1.5; color: #6b7280;">
        If you have any further questions, feel free to reply directly to this email.
      </p>
    </div>
  `

  if (!process.env.SMTP_PASS) {
    console.log(`[DEV MODE] Simulated Support Ticket Resolution Email to ${toEmail} for Ticket #${ticketId}`)
    return true
  }

  try {
    await transporter.sendMail({
      from: '"FitTrack Support" <fittrack.app.help@gmail.com>',
      to: toEmail,
      subject: `[FitTrack Support] Ticket #${ticketId.slice(0, 8)}: ${statusLabel}`,
      html: htmlContent,
    })
    return true
  } catch (err) {
    console.error('Failed to send ticket status email:', err)
    return false
  }
}
