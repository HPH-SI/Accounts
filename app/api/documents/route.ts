import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateDocumentNumber } from '@/lib/document-numbering'
import { canCreateDocument } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const customerId = searchParams.get('customerId')

    const where: any = {}
    if (type) {
      where.type = type
    }
    if (customerId) {
      where.customerId = customerId
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        customer: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(documents)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canCreateDocument(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      type,
      customerId,
      lineItems,
      subtotal,
      taxAmount,
      totalAmount,
      terms,
      notes,
      convertedFromId,
    } = body

    const documentNumber = await generateDocumentNumber(type)

    const document = await prisma.document.create({
      data: {
        documentNumber,
        type,
        customerId,
        userId: session.user.id,
        lineItems: JSON.stringify(lineItems),
        subtotal,
        taxAmount: taxAmount || 0,
        totalAmount,
        terms,
        notes,
        convertedFromId,
        issueDate: new Date(),
        status: 'DRAFT',
      },
      include: {
        customer: true,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

