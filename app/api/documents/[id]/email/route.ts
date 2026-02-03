import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, logEmail } from '@/lib/email'
import { generateDocumentPDF } from '@/lib/pdf-generator'
import { canSendEmail } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canSendEmail(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { from, to, cc, bcc, subject, body: emailBody } = body

    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        payments: true,
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Generate PDF
    let lineItems: unknown = []
    try {
      lineItems = JSON.parse(document.lineItems || '[]')
    } catch {
      return NextResponse.json(
        { error: 'Invalid line items data for this document' },
        { status: 400 }
      )
    }
    const safeLineItems = Array.isArray(lineItems) ? lineItems : []
    const pdfBuffer = await generateDocumentPDF(document, safeLineItems)

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

    const normalizedBody =
      emailBody && emailBody.trim().length > 0
        ? emailBody
        : `Please find attached ${document.type} ${document.documentNumber}.`

    const bodyHtml = `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #111827; line-height: 1.5;">
${escapeHtml(normalizedBody).replace(/\n/g, '<br />')}
<div style="margin-top: 18px; padding-top: 12px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
  <div style="font-weight: 600; color: #374151;">Heritage Park Hotel</div>
  <div>P.O. Box 1598, Mendana Avenue, Honiara, Solomon Islands</div>
  <div>Phone: +677 45500 · WhatsApp: 7585008</div>
  <div>Website: www.heritageparkhotel.com.sb</div>
</div>
</div>`

    // Send email
    const emailResult = await sendEmail({
      from,
      to: Array.isArray(to) ? to : [to],
      cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
      subject: subject || `${document.type} ${document.documentNumber}`,
      body: bodyHtml,
      attachments: [
        {
          filename: `${document.documentNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    })

    // Log email
    await logEmail(
      document.id,
      session.user.id,
      {
        to: Array.isArray(to) ? to : [to],
        cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
        bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
        subject: subject || `${document.type} ${document.documentNumber}`,
        body: bodyHtml,
      },
      emailResult.success ? 'SENT' : 'FAILED',
      emailResult.error
    )

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

