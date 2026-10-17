import nodemailer, { Transporter } from 'nodemailer'

/**
 * Creates a fresh Nodemailer transport instance.
 * For Gmail, uses the built-in 'gmail' service without connection pooling (pool: false).
 * Persistent connection pooling is not supported by Gmail SMTP and causes idle connections
 * to be dropped, resulting in ECONNRESET and socket greeting timeouts on subsequent emails.
 */
function createTransporter(): Transporter {
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim()
  const port = parseInt(process.env.SMTP_PORT || '465', 10)
  const user = (process.env.SMTP_USER || 'fittrack.app.help@gmail.com').trim().replace(/['"]/g, '')
  const rawPass = process.env.SMTP_PASS || ''
  const pass = rawPass.replace(/[\s"']/g, '')

  if (host === 'smtp.gmail.com' || host === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  })
}

interface GenericEmailOptions {
  toEmail: string
  subject: string
  html: string
  plainText?: string
}

/**
 * Sends email via Brevo REST API (HTTPS port 443).
 * Render Free tier blocks outbound SMTP ports (25, 465, 587).
 * Brevo sends directly over HTTPS port 443 with NO domain required — you can verify any Gmail address.
 */
async function sendViaBrevo(opts: GenericEmailOptions): Promise<{ success: boolean; delivered: boolean }> {
  const apiKey = process.env.BREVO_API_KEY?.trim()
  if (!apiKey) return { success: false, delivered: false }

  const senderEmail = (process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'fittrack.app.help@gmail.com')
    .trim()
    .replace(/['"]/g, '')
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || 'FitTrack Support'

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: opts.toEmail,
          },
        ],
        subject: opts.subject,
        htmlContent: opts.html,
        textContent: opts.plainText,
      }),
    })

    const data: any = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error('[EMAIL ERROR] Brevo HTTP API rejected request:', {
        status: res.status,
        code: data?.code,
        message: data?.message || res.statusText,
      })
      return { success: false, delivered: false }
    }

    console.log(`[EMAIL SERVICE] Email successfully delivered to ${opts.toEmail} via Brevo (MessageId: ${data?.messageId})`)
    return { success: true, delivered: true }
  } catch (err: any) {
    console.error('[EMAIL ERROR] Brevo network error:', err?.message || err)
    return { success: false, delivered: false }
  }
}

/**
 * Sends email via Resend REST API (HTTPS port 443).
 * Note: Cloud hosting platforms such as Render Free tier block outbound SMTP ports (25, 465, 587).
 * When RESEND_API_KEY is configured, this provides reliable HTTPS-based delivery without port blocks.
 */
async function sendViaResend(opts: GenericEmailOptions): Promise<{ success: boolean; delivered: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { success: false, delivered: false }

  const from = process.env.RESEND_FROM?.trim() || 'FitTrack <onboarding@resend.dev>'

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [opts.toEmail],
        subject: opts.subject,
        html: opts.html,
        text: opts.plainText,
      }),
    })

    const data: any = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error('[EMAIL ERROR] Resend HTTP API rejected request:', data?.message || res.statusText)
      return { success: false, delivered: false }
    }

    console.log(`[EMAIL SERVICE] Email successfully delivered to ${opts.toEmail} via Resend (ID: ${data?.id})`)
    return { success: true, delivered: true }
  } catch (err: any) {
    console.error('[EMAIL ERROR] Resend network error:', err?.message || err)
    return { success: false, delivered: false }
  }
}

/**
 * Sends email via Nodemailer SMTP.
 */
async function sendViaSmtp(opts: GenericEmailOptions): Promise<{ success: boolean; delivered: boolean }> {
  const user = (process.env.SMTP_USER || 'fittrack.app.help@gmail.com').trim().replace(/['"]/g, '')
  const rawPass = process.env.SMTP_PASS || ''
  const pass = rawPass.replace(/[\s"']/g, '')

  if (!pass) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[EMAIL SERVICE] SMTP_PASS credentials are not configured on the production server.')
      return { success: false, delivered: false }
    }
    console.log('\n======================================================')
    console.log('[EMAIL SERVICE - DEV SIMULATED DELIVERY]')
    console.log(`To:       ${opts.toEmail}`)
    console.log(`Subject:  ${opts.subject}`)
    console.log('NOTE: To deliver real emails, set SMTP_PASS in server/.env.')
    console.log('======================================================\n')
    return { success: true, delivered: false }
  }

  try {
    const transporter = createTransporter()
    const info = await transporter.sendMail({
      from: `"FitTrack Support" <${user}>`,
      to: opts.toEmail,
      subject: opts.subject,
      html: opts.html,
      text: opts.plainText,
    })
    console.log(`[EMAIL SERVICE] Email successfully delivered to ${opts.toEmail} (MessageId: ${info.messageId})`)
    return { success: true, delivered: true }
  } catch (error: any) {
    console.error(`[EMAIL ERROR] Failed sending to ${opts.toEmail}:`, {
      message: error?.message,
      code: error?.code,
      command: error?.command,
      response: error?.response,
    })

    if (error?.code === 'ETIMEDOUT' || error?.code === 'ESOCKETTIMEDOUT') {
      console.warn(
        '\n[EMAIL SERVICE NOTICE] SMTP connection timed out.\n' +
        'If your server is hosted on Render Free tier, Render silently blocks all outbound traffic on\n' +
        'SMTP ports 25, 465, and 587. To send emails from Render, provide a BREVO_API_KEY or RESEND_API_KEY\n' +
        'in your Render environment variables to deliver emails via HTTPS (port 443).\n'
      )
    }
    return { success: false, delivered: false }
  }
}

/**
 * Unified email sender: uses Brevo or Resend HTTPS API if configured, otherwise falls back to Nodemailer SMTP.
 */
async function sendEmail(opts: GenericEmailOptions): Promise<{ success: boolean; delivered: boolean }> {
  // 1. Try Brevo HTTPS API (Recommended for Render free tier — no domain required, works with Gmail sender)
  if (process.env.BREVO_API_KEY?.trim()) {
    const brevoResult = await sendViaBrevo(opts)
    if (brevoResult.delivered) return brevoResult
    console.warn('[EMAIL SERVICE] Brevo delivery was unsuccessful, attempting fallback...')
  }

  // 2. Try Resend HTTPS API
  if (process.env.RESEND_API_KEY?.trim()) {
    const resendResult = await sendViaResend(opts)
    if (resendResult.delivered) return resendResult
    console.warn('[EMAIL SERVICE] Resend delivery was unsuccessful, attempting SMTP fallback...')
  }

  // 3. Fallback to Nodemailer SMTP
  return sendViaSmtp(opts)
}

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
 * Shared sender for 6-digit verification code emails.
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

  return sendEmail({
    toEmail,
    subject,
    html: htmlContent,
    plainText,
  })
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

  const result = await sendEmail({
    toEmail,
    subject: `[FitTrack Support] Ticket #${ticketId.slice(0, 8)}: ${statusLabel}`,
    html: htmlContent,
    plainText: `Your support ticket #${ticketId.slice(0, 8)} status has been updated to: ${statusLabel}.`,
  })

  return result.delivered || result.success
}
