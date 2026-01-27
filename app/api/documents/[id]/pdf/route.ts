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

    if (!['INVOICE', 'PROFORMA', 'QUOTATION'].includes(document.type)) {
      return NextResponse.json(
        { error: 'PDF download is only available for quotations, proformas, or invoices' },
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e9d4f6ee-6a66-497a-abd5-4a42a26f0961',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1',location:'app/api/documents/[id]/pdf/route.ts:GET:pdfBytes',message:'Constructing PDF response body',data:{isUint8Array:pdfBuffer instanceof Uint8Array,isBuffer:Buffer.isBuffer(pdfBuffer)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log
    const pdfBytes = new Uint8Array(pdfBuffer)

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e9d4f6ee-6a66-497a-abd5-4a42a26f0961',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2',location:'app/api/documents/[id]/pdf/route.ts:GET:response',message:'Returning PDF response',data:{byteLength:pdfBytes.byteLength,isBuffer:Buffer.isBuffer(pdfBytes)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log

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
