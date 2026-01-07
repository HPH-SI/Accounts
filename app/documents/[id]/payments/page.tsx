'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Payment {
  id: string
  amount: number
  paymentMethod: string
  dateReceived: string
  reference?: string
  notes?: string
}

interface Document {
  id: string
  documentNumber: string
  customerId: string
  totalAmount: number
  payments: Payment[]
  paymentSummary: {
    totalPaid: number
    outstanding: number
    variance: number
  }
}

export default function DocumentPaymentsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    dateReceived: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
  })

  useEffect(() => {
    fetchDocument()
  }, [params.id])

  async function fetchDocument() {
    try {
      const res = await fetch(`/api/documents/${params.id}`)
      const data = await res.json()
      setDocument(data)
    } catch (error) {
      console.error('Failed to fetch document:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddPayment() {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: params.id,
          customerId: document?.customerId,
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      })

      if (res.ok) {
        setShowAddModal(false)
        fetchDocument()
        setFormData({
          amount: '',
          paymentMethod: 'BANK_TRANSFER',
          dateReceived: new Date().toISOString().split('T')[0],
          reference: '',
          notes: '',
        })
      } else {
        alert('Failed to record payment')
      }
    } catch (error) {
      alert('An error occurred')
    }
  }

  if (loading || !document) {
    return (
      <ProtectedRoute>
        <div className="text-center py-12">Loading...</div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Payments - {document.documentNumber}
            </h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Record Payment
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold">${document.totalAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">
                ${document.paymentSummary.totalPaid.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Outstanding</p>
              <p
                className={`text-2xl font-bold ${
                  document.paymentSummary.outstanding > 0
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}
              >
                ${document.paymentSummary.outstanding.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">Variance</p>
            <p
              className={`text-xl font-semibold ${
                document.paymentSummary.variance >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              ${Math.abs(document.paymentSummary.variance).toFixed(2)}
              {document.paymentSummary.variance > 0 && ' (Excess Payment)'}
              {document.paymentSummary.variance < 0 && ' (Outstanding)'}
            </p>
          </div>

          <h3 className="text-lg font-medium mb-4">Payment History</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Method
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reference
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {document.payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(payment.dateReceived).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    ${payment.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {payment.paymentMethod.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {payment.reference || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {payment.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {document.payments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No payments recorded yet
            </div>
          )}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-bold mb-4">Record Payment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Amount *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Payment Method *
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentMethod: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date Received *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dateReceived}
                    onChange={(e) =>
                      setFormData({ ...formData, dateReceived: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Reference
                  </label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) =>
                      setFormData({ ...formData, reference: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={2}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPayment}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

