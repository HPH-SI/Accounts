import nodemailer from 'nodemailer'
import { prisma } from './prisma'
import { DEFAULT_SENDER_EMAIL, SENDER_EMAIL_ADDRESSES } from './email-config'

function getAuthForSender(fromAddress?: string) {
  const normalizedFrom = (fromAddress || '').toLowerCase()
  const fallbackUser = process.env.SMTP_USER
  const fallbackPassword = process.env.SMTP_PASSWORD

  if (normalizedFrom === SENDER_EMAIL_ADDRESSES[0]) {
    return {
      user: process.env.SMTP_USER_INFO || fallbackUser,
      pass: process.env.SMTP_PASSWORD_INFO || fallbackPassword,
    }
  }

  if (normalizedFrom === SENDER_EMAIL_ADDRESSES[1]) {
    return {
      user: process.env.SMTP_USER_RDM || fallbackUser,
      pass: process.env.SMTP_PASSWORD_RDM || fallbackPassword,
    }
  }

  if (normalizedFrom === SENDER_EMAIL_ADDRESSES[2]) {
    return {
      user: process.env.SMTP_USER_RESERVATIONS || fallbackUser,
      pass: process.env.SMTP_PASSWORD_RESERVATIONS || fallbackPassword,
    }
  }

  return { user: fallbackUser, pass: fallbackPassword }
}

// Validate email configuration
function validateEmailConfig(fromAddress?: string): { valid: boolean; error?: string } {
  if (!process.env.SMTP_HOST) {
    return { valid: false, error: 'SMTP_HOST is not configured' }
  }
  const auth = getAuthForSender(fromAddress)
  if (!auth.user) {
    return { valid: false, error: 'SMTP_USER is not configured' }
  }
  if (!auth.pass) {
    return { valid: false, error: 'SMTP_PASSWORD is not configured' }
  }
  return { valid: true }
}

// Create transporter with configuration
function createTransporter(fromAddress?: string) {
  const config = validateEmailConfig(fromAddress)
  if (!config.valid) {
    throw new Error(config.error || 'Email configuration is invalid')
  }

  const port = parseInt(process.env.SMTP_PORT || '587')
  const isSecure = port === 465
  const auth = getAuthForSender(fromAddress)

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: port,
    secure: isSecure, // true for 465, false for other ports
    auth: {
      user: auth.user,
      pass: auth.pass,
    },
    tls: {
      // Do not fail on invalid certs (useful for self-signed certificates)
      rejectUnauthorized: false,
    },
  })
}

function getTransporter(fromAddress?: string): nodemailer.Transporter {
  // Always recreate transporter to pick up any environment variable changes
  // (This is important for development where .env might change)
  try {
    return createTransporter(fromAddress)
  } catch (error) {
    // If transporter creation fails, throw a more helpful error
    throw new Error('Failed to create email transporter. Please check your SMTP configuration.')
  }
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
    const emailTransporter = getTransporter(fromAddress)

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
    
    await emailTransporter.sendMail({
      from: fromAddress,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: options.cc && options.cc.length > 0 ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
      bcc: options.bcc && options.bcc.length > 0 ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
      subject: options.subject,
      html: emailBody,
      attachments,
    })

    return { success: true }
  } catch (error: any) {
    // Provide more helpful error messages
    let errorMessage = 'Failed to send email'
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Please check SMTP_USER and SMTP_PASSWORD.'
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

