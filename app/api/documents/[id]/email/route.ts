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

    // Send email
    const emailResult = await sendEmail({
      from,
      to: Array.isArray(to) ? to : [to],
      cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
      subject: subject || `${document.type} ${document.documentNumber}`,
      body: emailBody || `Please find attached ${document.type} ${document.documentNumber}.`,
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
        body: emailBody || `Please find attached ${document.type} ${document.documentNumber}.`,
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

