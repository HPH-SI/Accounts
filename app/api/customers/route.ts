import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCustomerOutstandingBalance } from '@/lib/payment-calculations'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const type = searchParams.get('type')

    const where: any = {}
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }
    if (type) {
      where.type = type
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 100,
    })

    // Calculate outstanding balances
    const customersWithBalance = await Promise.all(
      customers.map(async (customer) => {
        const outstanding = await getCustomerOutstandingBalance(customer.id)
        return {
          ...customer,
          outstandingBalance: outstanding,
        }
      })
    )

    return NextResponse.json(customersWithBalance)
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

    const body = await request.json()
    const { name, type, address, emails, phone, taxNumber, notes } = body

    const customer = await prisma.customer.create({
      data: {
        name,
        type: type || 'INDIVIDUAL',
        address,
        emails: Array.isArray(emails) ? JSON.stringify(emails) : emails,
        phone,
        taxNumber,
        notes,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

