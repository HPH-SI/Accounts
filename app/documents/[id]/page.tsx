'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { SENDER_EMAIL_ADDRESSES, DEFAULT_SENDER_EMAIL } from '@/lib/email-config'
import { canEditDocument } from '@/lib/permissions'

interface Document {
  id: string
  documentNumber: string
  type: string
  customer: {
    name: string
    address?: string
    phone?: string
    emails?: string
  }
  lineItems: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  terms?: string
  notes?: string
  issueDate?: string | Date | null
  payments: Array<{
    id: string
    amount: number
    paymentMethod: string
    dateReceived: string
  }>
  paymentSummary: {
    totalAmount: number
    totalPaid: number
    outstanding: number
    variance: number
    status: string
  }
}

export default function DocumentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [emailData, setEmailData] = useState({
    from: DEFAULT_SENDER_EMAIL,
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
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

  async function handleConvert(targetType: string) {
    try {
      const res = await fetch(`/api/documents/${params.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType }),
      })

      if (res.ok) {
        const newDoc = await res.json()
        router.push(`/documents/${newDoc.id}`)
      } else {
        alert('Failed to convert document')
      }
    } catch (error) {
      alert('An error occurred')
    }
  }

  async function handleSendEmail() {
    try {
      const to = emailData.to.split(',').map((e) => e.trim()).filter(Boolean)
      const cc = emailData.cc ? emailData.cc.split(',').map((e) => e.trim()).filter(Boolean) : undefined
      const bcc = emailData.bcc ? emailData.bcc.split(',').map((e) => e.trim()).filter(Boolean) : undefined

      const res = await fetch(`/api/documents/${params.id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: emailData.from,
          to,
          cc,
          bcc,
          subject: emailData.subject,
          body: emailData.body,
        }),
      })

      if (res.ok) {
        alert('Email sent successfully')
        setEmailModalOpen(false)
      } else {
        alert('Failed to send email')
      }
    } catch (error) {
      alert('An error occurred')
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }

    try {
      const res = await fetch(`/api/documents/${params.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/documents')
      } else {
        alert('Failed to delete document')
        setDeleteConfirm(false)
      }
    } catch (error) {
      alert('An error occurred')
      setDeleteConfirm(false)
    }
  }

  const canEdit = session?.user?.role && canEditDocument(session.user.role as any)
  const canDelete = session?.user?.role === 'ADMIN'

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="text-center py-12">Loading...</div>
      </ProtectedRoute>
    )
  }

  if (!document) {
    return (
      <ProtectedRoute>
        <div className="text-center py-12">Document not found</div>
      </ProtectedRoute>
    )
  }

  const lineItems = JSON.parse(document.lineItems)
  const canConvert = document.type === 'QUOTATION' || document.type === 'PROFORMA'

  return (
    <ProtectedRoute>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {document.documentNumber}
            </h1>
            <p className="text-sm text-gray-500">{document.type}</p>
          </div>
          <div className="space-x-2">
            {canConvert && (
              <>
                {document.type === 'QUOTATION' && (
                  <>
                    <button
                      onClick={() => handleConvert('PROFORMA')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Convert to Proforma
                    </button>
                    <button
                      onClick={() => handleConvert('INVOICE')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Convert to Invoice
                    </button>
                  </>
                )}
                {document.type === 'PROFORMA' && (
                  <button
                    onClick={() => handleConvert('INVOICE')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Convert to Invoice
                  </button>
                )}
              </>
            )}
            {canEdit && (
              <button
                onClick={() => router.push(`/documents/${params.id}/edit`)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                {deleteConfirm ? 'Confirm Delete' : 'Delete'}
              </button>
            )}
            <button
              onClick={() => setEmailModalOpen(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Send Email
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="mb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {document.type === 'PROFORMA' ? 'PROFORMA INVOICE' : document.type}
                </h1>
                <p className="text-sm text-gray-500">
                  Date: {document.issueDate 
                    ? new Date(document.issueDate).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })
                    : new Date().toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                </p>
              </div>
              <div className="text-right">
                <div className="w-32 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                  LOGO
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-2">From:</h3>
                <p className="text-sm text-gray-900">Heritage Park Hotel,</p>
                <p className="text-sm text-gray-900">P.O Box 1598,</p>
                <p className="text-sm text-gray-900">Mendana Avenue,</p>
                <p className="text-sm text-gray-900">Honiara, Solomon Islands</p>
                <p className="text-sm text-gray-600 mt-2">Ph: +677 45500</p>
                <p className="text-sm text-gray-600">Email: reservations@heritageparkhotel.com.sb</p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-2">To:</h3>
                <p className="text-sm text-gray-900">{document.customer.name}</p>
                {document.customer.address && (
                  <p className="text-sm text-gray-600">{document.customer.address}</p>
                )}
                {document.customer.phone ? (
                  <p className="text-sm text-gray-600">Ph: {document.customer.phone}</p>
                ) : (
                  <p className="text-sm text-gray-400">Ph:</p>
                )}
                {(() => {
                  try {
                    const emails = JSON.parse(document.customer.emails || '[]')
                    const emailStr = Array.isArray(emails) ? emails.join(', ') : document.customer.emails
                    return emailStr ? (
                      <p className="text-sm text-gray-600">Email: {emailStr}</p>
                    ) : (
                      <p className="text-sm text-gray-400">Email:</p>
                    )
                  } catch {
                    return document.customer.emails ? (
                      <p className="text-sm text-gray-600">Email: {document.customer.emails}</p>
                    ) : (
                      <p className="text-sm text-gray-400">Email:</p>
                    )
                  }
                })()}
              </div>
            </div>
          </div>

          <table className="min-w-full divide-y divide-gray-200 mb-6">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Qty
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Day
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lineItems.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.quantity || 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.days || 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    ${item.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-6">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-medium">${document.subtotal.toFixed(2)}</span>
              </div>
              {document.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Tax:</span>
                  <span className="font-medium">${document.taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>${document.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {document.type === 'INVOICE' && document.paymentSummary && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Payment Summary</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-lg font-semibold">
                    ${document.paymentSummary.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Paid</p>
                  <p className="text-lg font-semibold text-green-600">
                    ${document.paymentSummary.totalPaid.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Outstanding</p>
                  <p
                    className={`text-lg font-semibold ${
                      document.paymentSummary.outstanding > 0
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    ${document.paymentSummary.outstanding.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Variance</p>
                  <p
                    className={`text-lg font-semibold ${
                      document.paymentSummary.variance >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    ${Math.abs(document.paymentSummary.variance).toFixed(2)}
                    {document.paymentSummary.variance > 0 && ' (Excess)'}
                    {document.paymentSummary.variance < 0 && ' (Deficit)'}
                  </p>
                </div>
              </div>
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    document.paymentSummary.status === 'PAID'
                      ? 'bg-green-100 text-green-800'
                      : document.paymentSummary.status === 'PARTIAL'
                      ? 'bg-yellow-100 text-yellow-800'
                      : document.paymentSummary.status === 'EXCESS'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {document.paymentSummary.status}
                </span>
              </div>
            </div>
          )}

          {document.terms && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Terms & Conditions
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {document.terms}
              </p>
            </div>
          )}

          {document.notes && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {document.notes}
              </p>
            </div>
          )}
        </div>

        {emailModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-bold mb-4">Send Email</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    From *
                  </label>
                  <select
                    value={emailData.from}
                    onChange={(e) =>
                      setEmailData({ ...emailData, from: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {SENDER_EMAIL_ADDRESSES.map((email) => (
                      <option key={email} value={email}>
                        {email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    To (comma-separated) *
                  </label>
                  <input
                    type="text"
                    required
                    value={emailData.to}
                    onChange={(e) =>
                      setEmailData({ ...emailData, to: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    CC (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={emailData.cc}
                    onChange={(e) =>
                      setEmailData({ ...emailData, cc: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    BCC (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={emailData.bcc}
                    onChange={(e) =>
                      setEmailData({ ...emailData, bcc: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={emailData.subject || `${document.type} ${document.documentNumber}`}
                    onChange={(e) =>
                      setEmailData({ ...emailData, subject: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Body
                  </label>
                  <textarea
                    value={emailData.body}
                    onChange={(e) =>
                      setEmailData({ ...emailData, body: e.target.value })
                    }
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEmailModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

