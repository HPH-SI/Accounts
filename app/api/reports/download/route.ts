import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'excel' // excel, csv
    const type = searchParams.get('type') // 'monthly', 'customer', 'outstanding'
    const month = searchParams.get('month')
    const customerId = searchParams.get('customerId')

    let data: any[] = []

    if (type === 'monthly') {
      const where: any = {}
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

      data = documents.map((doc) => {
        const totalPaid = doc.payments.reduce((sum, p) => sum + p.amount, 0)
        return {
          'Document Number': doc.documentNumber,
          'Type': doc.type,
          'Customer': doc.customer.name,
          'Date': new Date(doc.createdAt).toLocaleDateString(),
          'Total Amount': doc.totalAmount,
          'Amount Received': totalPaid,
          'Outstanding': doc.totalAmount - totalPaid,
        }
      })
    } else if (type === 'customer' && customerId) {
      const documents = await prisma.document.findMany({
        where: { customerId },
        include: {
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      data = documents.map((doc) => {
        const totalPaid = doc.payments.reduce((sum, p) => sum + p.amount, 0)
        return {
          'Document Number': doc.documentNumber,
          'Type': doc.type,
          'Date': new Date(doc.createdAt).toLocaleDateString(),
          'Total Amount': doc.totalAmount,
          'Amount Received': totalPaid,
          'Outstanding': doc.totalAmount - totalPaid,
        }
      })
    } else if (type === 'outstanding') {
      const invoices = await prisma.document.findMany({
        where: { type: 'INVOICE' },
        include: {
          customer: true,
          payments: true,
        },
      })

      data = invoices
        .map((invoice) => {
          const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
          const outstanding = invoice.totalAmount - totalPaid
          return {
            'Invoice Number': invoice.documentNumber,
            'Customer': invoice.customer.name,
            'Date': new Date(invoice.createdAt).toLocaleDateString(),
            'Total Amount': invoice.totalAmount,
            'Amount Received': totalPaid,
            'Outstanding': outstanding,
          }
        })
        .filter((item) => item.Outstanding > 0)
    }

    if (format === 'csv') {
      if (data.length === 0) {
        return new NextResponse('No data', { status: 404 })
      }

      const headers = Object.keys(data[0])
      const csvRows = [
        headers.join(','),
        ...data.map((row) => headers.map((header) => row[header]).join(',')),
      ]

      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report-${type}-${Date.now()}.csv"`,
        },
      })
    } else {
      // Excel format
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Report')

      if (data.length === 0) {
        worksheet.addRow(['No data available'])
      } else {
        const headers = Object.keys(data[0])
        worksheet.addRow(headers)

        data.forEach((row) => {
          worksheet.addRow(headers.map((header) => row[header]))
        })

        // Style header row
        worksheet.getRow(1).font = { bold: true }
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' },
        }
      }

      const buffer = await workbook.xlsx.writeBuffer()

      return new NextResponse(buffer, {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="report-${type}-${Date.now()}.xlsx"`,
        },
      })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

