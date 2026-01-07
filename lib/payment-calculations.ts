import { prisma } from './prisma'

export interface PaymentSummary {
  totalAmount: number
  totalPaid: number
  outstanding: number
  variance: number
  status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'EXCESS'
}

export async function calculatePaymentSummary(documentId: string): Promise<PaymentSummary> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { payments: true },
  })

  if (!document) {
    throw new Error('Document not found')
  }

  const totalAmount = document.totalAmount
  const totalPaid = document.payments.reduce((sum, payment) => sum + payment.amount, 0)
  const outstanding = totalAmount - totalPaid
  const variance = totalPaid - totalAmount

  let status: PaymentSummary['status'] = 'UNPAID'
  if (totalPaid >= totalAmount) {
    status = totalPaid > totalAmount ? 'EXCESS' : 'PAID'
  } else if (totalPaid > 0) {
    status = 'PARTIAL'
  }

  return {
    totalAmount,
    totalPaid,
    outstanding: Math.abs(outstanding),
    variance,
    status,
  }
}

export async function getCustomerOutstandingBalance(customerId: string): Promise<number> {
  const invoices = await prisma.document.findMany({
    where: {
      customerId,
      type: 'INVOICE',
    },
    include: {
      payments: true,
    },
  })

  let totalOutstanding = 0

  for (const invoice of invoices) {
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
    const outstanding = invoice.totalAmount - totalPaid
    if (outstanding > 0) {
      totalOutstanding += outstanding
    }
  }

  return totalOutstanding
}

