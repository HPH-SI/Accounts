import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canRecordPayment } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canRecordPayment(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { amount, paymentMethod, dateReceived, reference, notes } = body

    const data: {
      amount?: number
      paymentMethod?: string
      dateReceived?: Date
      reference?: string | null
      notes?: string | null
    } = {}

    if (typeof amount === 'number' && !Number.isNaN(amount)) {
      data.amount = amount
    }
    if (typeof paymentMethod === 'string' && paymentMethod) {
      data.paymentMethod = paymentMethod
    }
    if (typeof dateReceived === 'string' && dateReceived) {
      data.dateReceived = new Date(dateReceived)
    }
    if (typeof reference === 'string') {
      data.reference = reference
    }
    if (typeof notes === 'string') {
      data.notes = notes
    }

    const payment = await prisma.payment.update({
      where: { id: params.id },
      data,
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
      },
    })

    return NextResponse.json(payment)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
