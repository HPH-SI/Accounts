import nodemailer from 'nodemailer'
import { prisma } from './prisma'
import { DEFAULT_SENDER_EMAIL } from './email-config'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

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
    const attachments = options.attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType,
    }))

    await transporter.sendMail({
      from: options.from || process.env.SMTP_FROM || DEFAULT_SENDER_EMAIL,
      to: options.to.join(', '),
      cc: options.cc?.join(', '),
      bcc: options.bcc?.join(', '),
      subject: options.subject,
      html: options.body,
      attachments,
    })

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send email',
    }
  }
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

