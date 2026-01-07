import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateDocumentNumber } from '@/lib/document-numbering'
import { canCreateDocument } from '@/lib/permissions'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canCreateDocument(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { targetType } = body

    const sourceDocument = await prisma.document.findUnique({
      where: { id: params.id },
      include: { customer: true },
    })

    if (!sourceDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Validate conversion rules
    const validConversions: Record<string, string[]> = {
      QUOTATION: ['PROFORMA', 'INVOICE'],
      PROFORMA: ['INVOICE'],
      INVOICE: [],
    }

    if (!validConversions[sourceDocument.type]?.includes(targetType)) {
      return NextResponse.json(
        { error: `Cannot convert ${sourceDocument.type} to ${targetType}` },
        { status: 400 }
      )
    }

    const documentNumber = await generateDocumentNumber(targetType)

    const newDocument = await prisma.document.create({
      data: {
        documentNumber,
        type: targetType,
        customerId: sourceDocument.customerId,
        userId: session.user.id,
        lineItems: sourceDocument.lineItems,
        subtotal: sourceDocument.subtotal,
        taxAmount: sourceDocument.taxAmount,
        totalAmount: sourceDocument.totalAmount,
        terms: sourceDocument.terms,
        notes: sourceDocument.notes,
        convertedFromId: sourceDocument.id,
        issueDate: new Date(),
        status: 'DRAFT',
      },
      include: {
        customer: true,
      },
    })

    return NextResponse.json(newDocument, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

