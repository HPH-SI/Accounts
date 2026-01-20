import nodemailer from 'nodemailer'
import { prisma } from './prisma'
import { DEFAULT_SENDER_EMAIL, SENDER_EMAIL_ADDRESSES } from './email-config'

type SmtpAuth = {
  user?: string
  pass?: string
}

type SenderAuthConfig = {
  address: string
  user?: string
  pass?: string
  label: string
}

type AuthSelection = {
  auth: SmtpAuth
  source: 'sender' | 'fallback'
  senderConfig?: SenderAuthConfig
  error?: string
}

function getFallbackAuth(): SmtpAuth {
  return {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  }
}

function getSenderAuthConfig(fromAddress?: string): SenderAuthConfig | null {
  const normalizedFrom = (fromAddress || '').toLowerCase()
  const configs: SenderAuthConfig[] = [
    {
      address: SENDER_EMAIL_ADDRESSES[0],
      user: process.env.SMTP_USER_INFO,
      pass: process.env.SMTP_PASSWORD_INFO,
      label: 'SMTP_USER_INFO/SMTP_PASSWORD_INFO',
    },
    {
      address: SENDER_EMAIL_ADDRESSES[1],
      user: process.env.SMTP_USER_RDM,
      pass: process.env.SMTP_PASSWORD_RDM,
      label: 'SMTP_USER_RDM/SMTP_PASSWORD_RDM',
    },
    {
      address: SENDER_EMAIL_ADDRESSES[2],
      user: process.env.SMTP_USER_RESERVATIONS,
      pass: process.env.SMTP_PASSWORD_RESERVATIONS,
      label: 'SMTP_USER_RESERVATIONS/SMTP_PASSWORD_RESERVATIONS',
    },
  ]

  return configs.find((config) => config.address === normalizedFrom) || null
}

function getAuthForSender(fromAddress?: string): AuthSelection {
  const fallbackAuth = getFallbackAuth()
  const forceFallback = parseBoolean(process.env.SMTP_FORCE_FALLBACK) === true
  const senderConfig = getSenderAuthConfig(fromAddress)

  if (forceFallback) {
    return { auth: fallbackAuth, source: 'fallback', senderConfig }
  }

  if (senderConfig) {
    const hasSenderUser = Boolean(senderConfig.user)
    const hasSenderPass = Boolean(senderConfig.pass)

    if (hasSenderUser || hasSenderPass) {
      if (!hasSenderUser || !hasSenderPass) {
        return {
          auth: fallbackAuth,
          source: 'fallback',
          senderConfig,
          error: `Both ${senderConfig.label} must be set for ${senderConfig.address}.`,
        }
      }

      return {
        auth: {
          user: senderConfig.user,
          pass: senderConfig.pass,
        },
        source: 'sender',
        senderConfig,
      }
    }
  }

  return { auth: fallbackAuth, source: 'fallback', senderConfig }
}

// Validate email configuration
function validateEmailConfig(fromAddress?: string): { valid: boolean; error?: string } {
  if (!process.env.SMTP_HOST) {
    return { valid: false, error: 'SMTP_HOST is not configured' }
  }

  const authResult = getAuthForSender(fromAddress)
  if (authResult.error) {
    return { valid: false, error: authResult.error }
  }

  if (!authResult.auth.user) {
    return { valid: false, error: 'SMTP_USER is not configured' }
  }
  if (!authResult.auth.pass) {
    return { valid: false, error: 'SMTP_PASSWORD is not configured' }
  }
  return { valid: true }
}

// Create transporter with configuration
function parseBoolean(value?: string): boolean | undefined {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false
  return undefined
}

function createTransporter(auth: SmtpAuth) {
  const port = parseInt(process.env.SMTP_PORT || '587')
  const secureOverride = parseBoolean(process.env.SMTP_SECURE)
  const isSecure = secureOverride ?? port === 465
  const authMethod = process.env.SMTP_AUTH_METHOD
  const requireTls = parseBoolean(process.env.SMTP_REQUIRE_TLS)
  const ignoreTls = parseBoolean(process.env.SMTP_IGNORE_TLS)
  const rejectUnauthorized =
    parseBoolean(process.env.SMTP_TLS_REJECT_UNAUTHORIZED) ?? false

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: port,
    secure: isSecure, // true for 465, false for other ports
    auth: {
      user: auth.user,
      pass: auth.pass,
      ...(authMethod ? { method: authMethod } : {}),
    },
    ...(requireTls !== undefined ? { requireTLS: requireTls } : {}),
    ...(ignoreTls !== undefined ? { ignoreTLS: ignoreTls } : {}),
    tls: {
      // Do not fail on invalid certs (useful for self-signed certificates)
      rejectUnauthorized,
    },
  })
}

export interface EmailOptions {
  from?: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const fromAddress = options.from || process.env.SMTP_FROM || DEFAULT_SENDER_EMAIL

    // Validate email configuration
    const configCheck = validateEmailConfig(fromAddress)
    if (!configCheck.valid) {
      return {
        success: false,
        error: configCheck.error || 'Email configuration is missing. Please configure SMTP settings in environment variables.',
      }
    }

    const authResult = getAuthForSender(fromAddress)
    const primaryAuth = authResult.auth
    const fallbackAuth = getFallbackAuth()
    const shouldTryFallback =
      Boolean(fallbackAuth.user && fallbackAuth.pass) &&
      authResult.source === 'sender' &&
      (fallbackAuth.user !== primaryAuth.user || fallbackAuth.pass !== primaryAuth.pass)

    // Validate required fields
    if (!options.to || options.to.length === 0) {
      return {
        success: false,
        error: 'Recipient email address is required',
      }
    }

    if (!options.subject) {
      return {
        success: false,
        error: 'Email subject is required',
      }
    }

    // Get transporter
    const emailTransporter = createTransporter(primaryAuth)

    // Verify connection before sending (optional, but helps catch config errors early)
    try {
      await emailTransporter.verify()
    } catch (verifyError: any) {
      // If verification fails, still try to send (some servers don't support verify)
      // But log the warning
      console.warn('SMTP verification failed:', verifyError.message)
    }

    // Prepare attachments
    const attachments = options.attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType,
    }))

    // Send email
    // Ensure body is provided - it's required by the interface
    // Check if body exists and has content (not just whitespace)
    // If body is empty or only whitespace, provide a sensible default that includes the subject
    let emailBody: string
    if (options.body && options.body.trim().length > 0) {
      emailBody = options.body
    } else {
      // Provide a default HTML body if body is missing or empty
      // This prevents using the subject as the body (which was the bug)
      emailBody = `<p>Please find the attached document.</p>`
      if (options.subject) {
        emailBody += `<p><strong>Subject:</strong> ${options.subject}</p>`
      }
    }
    
    const mailOptions = {
      from: fromAddress,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: options.cc && options.cc.length > 0 ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
      bcc: options.bcc && options.bcc.length > 0 ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
      subject: options.subject,
      html: emailBody,
      attachments,
    }

    try {
      await emailTransporter.sendMail(mailOptions)
    } catch (error: any) {
      if (error?.code === 'EAUTH' && shouldTryFallback) {
        const fallbackTransporter = createTransporter(fallbackAuth)
        await fallbackTransporter.sendMail(mailOptions)
      } else {
        throw error
      }
    }

    return { success: true }
  } catch (error: any) {
    // Provide more helpful error messages
    let errorMessage = 'Failed to send email'
    
    if (error.code === 'EAUTH') {
      const authResult = getAuthForSender(options.from || process.env.SMTP_FROM || DEFAULT_SENDER_EMAIL)
      const authUser = authResult.auth.user || 'unknown'
      const sourceHint = authResult.source === 'sender' && authResult.senderConfig
        ? ` (${authResult.senderConfig.label})`
        : ''
      errorMessage = `Authentication failed for ${authUser}${sourceHint}. Please check SMTP_USER and SMTP_PASSWORD.`
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection failed. Please check SMTP_HOST and SMTP_PORT.'
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Connection timeout. Please check your network and SMTP settings.'
    } else if (error.message) {
      errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

// Function to test email configuration
export async function testEmailConfiguration(testEmail: string): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: [testEmail],
    subject: 'Test Email from Heritage Park Hotel Accounts',
    body: '<p>This is a test email from Heritage Park Hotel Accounts.</p><p>If you received this email, your email configuration is working correctly.</p>',
  })
}

export async function logEmail(
  documentId: string,
  userId: string,
  options: EmailOptions,
  status: 'SENT' | 'FAILED',
  errorMessage?: string
) {
  await prisma.emailLog.create({
    data: {
      documentId,
      userId,
      to: JSON.stringify(options.to),
      cc: options.cc ? JSON.stringify(options.cc) : null,
      bcc: options.bcc ? JSON.stringify(options.bcc) : null,
      subject: options.subject,
      body: options.body,
      status,
      errorMessage: errorMessage || null,
    },
  })
}

