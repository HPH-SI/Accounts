'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { canRecordPayment } from '@/lib/permissions'

interface Payment {
  id: string
  amount: number
  paymentMethod: string
  dateReceived: string
  reference?: string
  notes?: string
  document: {
    id: string
    documentNumber: string
    type: string
    totalAmount: number
  }
  customer: {
    id: string
    name: string
  }
}

interface Invoice {
  id: string
  documentNumber: string
  totalAmount: number
  customer: {
    id: string
    name: string
  }
  payments?: Payment[]
}

export default function PaymentsPage() {
  const { data: session } = useSession()
  const [payments, setPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showReconciliation, setShowReconciliation] = useState(false)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [submitting, setSubmitting] = useState(false)
  const [invoiceTotal, setInvoiceTotal] = useState(0)
  const [totalPaid, setTotalPaid] = useState(0)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [editFormData, setEditFormData] = useState({
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    dateReceived: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
  })

  const canRecord = session?.user?.role && canRecordPayment(session.user.role as any)

  useEffect(() => {
    fetchPayments()
    fetchInvoices()
  }, [])

  useEffect(() => {
    if (selectedInvoiceId) {
      const invoice = invoices.find((inv) => inv.id === selectedInvoiceId)
      if (invoice) {
        setInvoiceTotal(invoice.totalAmount)
        const paid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0
        setTotalPaid(paid)
      }
    } else {
      setInvoiceTotal(0)
      setTotalPaid(0)
    }
  }, [selectedInvoiceId, invoices])

  async function fetchPayments() {
    try {
      const res = await fetch('/api/payments')
      const data = await res.json()
      setPayments(data)
    } catch (error) {
      console.error('Failed to fetch payments:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchInvoices() {
    try {
      const res = await fetch('/api/documents?type=INVOICE')
      const data = await res.json()
      // Fetch payments for each invoice to calculate totals
      const invoicesWithPayments = await Promise.all(
        data.map(async (invoice: Invoice) => {
          const paymentsRes = await fetch(`/api/payments?documentId=${invoice.id}`)
          const payments = await paymentsRes.json()
          return { ...invoice, payments }
        })
      )
      setInvoices(invoicesWithPayments)
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    }
  }

  async function handleSubmitReconciliation(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedInvoiceId || !paymentAmount) {
      alert('Please select an invoice and enter payment amount')
      return
    }

    setSubmitting(true)
    try {
      const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId)
      if (!selectedInvoice) {
        alert('Invoice not found')
        return
      }

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedInvoiceId,
          customerId: selectedInvoice.customer.id,
          amount: parseFloat(paymentAmount),
          paymentMethod: 'BANK_TRANSFER',
          dateReceived: paymentDate,
          reference: '',
          notes: paymentNotes,
        }),
      })

      if (res.ok) {
        // Reset form
        setSelectedInvoiceId('')
        setPaymentAmount('')
        setPaymentNotes('')
        setPaymentDate(new Date().toISOString().split('T')[0])
        setShowReconciliation(false)
        // Refresh data
        fetchPayments()
        fetchInvoices()
        alert('Payment recorded successfully')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to record payment')
      }
    } catch (error) {
      console.error('Failed to record payment:', error)
      alert('An error occurred while recording payment')
    } finally {
      setSubmitting(false)
    }
  }

  function openEditPayment(payment: Payment) {
    setEditingPayment(payment)
    setEditFormData({
      amount: payment.amount.toFixed(2),
      paymentMethod: payment.paymentMethod,
      dateReceived: new Date(payment.dateReceived).toISOString().split('T')[0],
      reference: payment.reference || '',
      notes: payment.notes || '',
    })
  }

  async function handleUpdatePayment(e: React.FormEvent) {
    e.preventDefault()
    if (!editingPayment) {
      return
    }

    if (!editFormData.amount) {
      alert('Payment amount is required')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/payments/${editingPayment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(editFormData.amount),
          paymentMethod: editFormData.paymentMethod,
          dateReceived: editFormData.dateReceived,
          reference: editFormData.reference,
          notes: editFormData.notes,
        }),
      })

      if (res.ok) {
        setEditingPayment(null)
        fetchPayments()
        fetchInvoices()
        alert('Payment updated successfully')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update payment')
      }
    } catch (error) {
      console.error('Failed to update payment:', error)
      alert('An error occurred while updating payment')
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate excess/deficit for each payment based on cumulative payments vs invoice total
  // We need to group payments by invoice and calculate cumulative totals
  const paymentsWithReconciliation = payments.map((payment) => {
    // Find all payments for this invoice
    const invoicePayments = payments.filter((p) => p.document.id === payment.document.id)
    const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount, 0)
    const invoiceTotal = payment.document.totalAmount || 0
    const excessDeficit = totalPaid - invoiceTotal
    return { ...payment, excessDeficit }
  })

  // Calculate excess/deficit for the form (what will be after adding this payment)
  const excessDeficit = selectedInvoiceId && paymentAmount
    ? parseFloat(paymentAmount) + totalPaid - invoiceTotal
    : 0

  return (
    <ProtectedRoute>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          {canRecord && (
            <button
              onClick={() => setShowReconciliation(!showReconciliation)}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              {showReconciliation ? 'Hide Reconciliation' : 'Reconcile Payment'}
            </button>
          )}
        </div>

        {/* Payment Reconciliation Section */}
        {showReconciliation && canRecord && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Payment Reconciliation</h2>
            <form onSubmit={handleSubmitReconciliation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invoice Number *
                  </label>
                  <select
                    required
                    value={selectedInvoiceId}
                    onChange={(e) => setSelectedInvoiceId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Invoice</option>
                    {invoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.documentNumber} - {invoice.customer.name} (${invoice.totalAmount.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount Received *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {selectedInvoiceId && (
                    <div className="mt-1 text-xs text-gray-500">
                      Invoice Total: ${invoiceTotal.toFixed(2)} | 
                      Already Paid: ${totalPaid.toFixed(2)} | 
                      Outstanding: ${(invoiceTotal - totalPaid).toFixed(2)}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Payment notes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Excess / Deficit
                  </label>
                  <div
                    className={`px-3 py-2 rounded-md font-semibold ${
                      excessDeficit > 0
                        ? 'bg-green-100 text-green-800'
                        : excessDeficit < 0
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {excessDeficit > 0
                      ? `Excess: $${excessDeficit.toFixed(2)}`
                      : excessDeficit < 0
                      ? `Deficit: $${Math.abs(excessDeficit).toFixed(2)}`
                      : 'Balanced: $0.00'}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {excessDeficit > 0
                      ? 'Payment exceeds invoice amount (Green)'
                      : excessDeficit < 0
                      ? 'Payment is less than invoice amount (Red)'
                      : 'Payment matches invoice amount'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowReconciliation(false)
                    setSelectedInvoiceId('')
                    setPaymentAmount('')
                    setPaymentNotes('')
                  }}
                  className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedInvoiceId || !paymentAmount}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Payment Modal */}
        {editingPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
              <h3 className="text-lg font-semibold mb-4">Edit Payment</h3>
              <form onSubmit={handleUpdatePayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editFormData.amount}
                    onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={editFormData.paymentMethod}
                    onChange={(e) => setEditFormData({ ...editFormData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Received
                  </label>
                  <input
                    type="date"
                    value={editFormData.dateReceived}
                    onChange={(e) => setEditFormData({ ...editFormData, dateReceived: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference
                  </label>
                  <input
                    type="text"
                    value={editFormData.reference}
                    onChange={(e) => setEditFormData({ ...editFormData, reference: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingPayment(null)}
                    className="mr-3 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Updating...' : 'Update Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payments List */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Excess / Deficit
                  </th>
                  {canRecord && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentsWithReconciliation.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.dateReceived).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/documents/${payment.document.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-900"
                      >
                        {payment.document.documentNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${payment.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      <span
                        className={`px-2 py-1 rounded ${
                          payment.excessDeficit > 0
                            ? 'bg-green-100 text-green-800'
                            : payment.excessDeficit < 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {payment.excessDeficit > 0
                          ? `+$${payment.excessDeficit.toFixed(2)}`
                          : payment.excessDeficit < 0
                          ? `-$${Math.abs(payment.excessDeficit).toFixed(2)}`
                          : '$0.00'}
                      </span>
                    </td>
                    {canRecord && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => openEditPayment(payment)}
                          className="text-primary-600 hover:text-primary-900 font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {payments.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No payments found
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

