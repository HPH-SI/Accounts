import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateDocumentPDF } from '@/lib/pdf-generator'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    if (document.type !== 'INVOICE') {
      return NextResponse.json(
        { error: 'PDF download is only available for invoices' },
        { status: 400 }
      )
    }

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
    const filename = `${document.documentNumber}.pdf`
    const pdfBytes = pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer)

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
