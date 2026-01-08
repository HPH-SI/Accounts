import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId')
    const month = searchParams.get('month') // Format: YYYY-MM
    const documentType = searchParams.get('documentType') // 'INVOICE' or 'ALL'

    const where: any = {}
    if (customerId) {
      where.customerId = customerId
    }
    if (documentType && documentType !== 'ALL') {
      where.type = documentType
    }

    // If month is provided, filter by that month
    if (month) {
      const [year, monthNum] = month.split('-')
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59)
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      }
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        customer: true,
        payments: true,
      },
    })

    // Group by customer and month
    const monthlyData: Record<string, { invoiced: number; received: number }> = {}

    documents.forEach((doc) => {
      const docMonth = new Date(doc.createdAt).toISOString().substring(0, 7)
      const key = customerId ? docMonth : `${doc.customer.name}-${docMonth}`

      if (!monthlyData[key]) {
        monthlyData[key] = { invoiced: 0, received: 0 }
      }

      monthlyData[key].invoiced += doc.totalAmount
      const totalPaid = doc.payments.reduce((sum, p) => sum + p.amount, 0)
      monthlyData[key].received += totalPaid
    })

    // Format for chart
    const chartData = Object.entries(monthlyData).map(([label, data]) => ({
      label,
      invoiced: data.invoiced,
      received: data.received,
      variance: data.received - data.invoiced,
    }))

    return NextResponse.json(chartData)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

