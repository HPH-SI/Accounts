import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canRecordPayment } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const documentId = searchParams.get('documentId')
    const customerId = searchParams.get('customerId')

    const where: any = {}
    if (documentId) {
      where.documentId = documentId
    }
    if (customerId) {
      where.customerId = customerId
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        document: {
          select: {
            id: true,
            documentNumber: true,
            type: true,
            totalAmount: true,
          },
        },
        customer: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { dateReceived: 'desc' },
    })

    return NextResponse.json(payments)
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

    if (!canRecordPayment(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      documentId,
      customerId,
      amount,
      paymentMethod,
      dateReceived,
      reference,
      notes,
    } = body

    const payment = await prisma.payment.create({
      data: {
        documentId,
        customerId,
        userId: session.user.id,
        amount: parseFloat(amount),
        paymentMethod,
        dateReceived: new Date(dateReceived),
        reference,
        notes,
      },
      include: {
        document: true,
        customer: true,
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

