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
  const [doc, setDoc] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [logoError, setLogoError] = useState(false)
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
      setDoc(data)
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
    } catch (error: any) {
      console.error('PDF download failed:', error)
      alert(error?.message || 'An error occurred')
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
        const errorPayload = await res.json().catch(() => null)
        alert(errorPayload?.error || 'Failed to send email')
      }
    } catch (error: any) {
      alert(error?.message || 'An error occurred')
    }
  }

  async function handleDownloadPdf() {
    try {
      const res = await fetch(`/api/documents/${params.id}/pdf`)
      if (!res.ok) {
        const errorPayload = await res.json().catch(() => null)
        throw new Error(errorPayload?.error || 'Failed to download PDF')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${doc?.documentNumber || 'document'}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('PDF download failed:', error)
      alert(error?.message || 'An error occurred')
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

  if (!doc) {
    return (
      <ProtectedRoute>
        <div className="text-center py-12">Document not found</div>
      </ProtectedRoute>
    )
  }

  let lineItems: any[] = []
  try {
    lineItems = JSON.parse(doc.lineItems || '[]')
    if (!Array.isArray(lineItems)) {
      lineItems = []
    }
  } catch {
    lineItems = []
  }
  const canConvert = doc.type === 'QUOTATION' || doc.type === 'PROFORMA'

  return (
    <ProtectedRoute>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {doc.documentNumber}
            </h1>
            <p className="text-sm text-gray-500">{doc.type}</p>
          </div>
          <div className="space-x-2">
            {canConvert && (
              <>
                {doc.type === 'QUOTATION' && (
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
                {doc.type === 'PROFORMA' && (
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
            {['INVOICE', 'PROFORMA', 'QUOTATION'].includes(doc.type) && (
              <button
                onClick={handleDownloadPdf}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800"
              >
                Download PDF
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

        <div id="pdf-document" className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="mb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-red-600 mb-2">
                  {doc.type === 'PROFORMA' ? 'PROFORMA INVOICE' : doc.type} -{' '}
                  {doc.documentNumber}
                </h1>
                <p className="text-sm text-gray-500">
                  Date: {doc.issueDate 
                    ? new Date(doc.issueDate).toLocaleDateString('en-GB', { 
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
                {!logoError ? (
                  <img
                    src="/logo.png"
                    alt="Logo"
                    className="w-32 h-[100px] object-contain inline-block"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <span className="text-sm font-semibold text-gray-700 inline-block">
                    Heritage Park Hotel
                  </span>
                )}
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
                <p className="text-sm text-gray-900">{doc.customer.name}</p>
                {doc.customer.address && (
                  <p className="text-sm text-gray-600">{doc.customer.address}</p>
                )}
                {doc.customer.phone ? (
                  <p className="text-sm text-gray-600">Ph: {doc.customer.phone}</p>
                ) : (
                  <p className="text-sm text-gray-400">Ph:</p>
                )}
                {(() => {
                  try {
                    const emails = JSON.parse(doc.customer.emails || '[]')
                    const emailStr = Array.isArray(emails) ? emails.join(', ') : doc.customer.emails
                    return emailStr ? (
                      <p className="text-sm text-gray-600">Email: {emailStr}</p>
                    ) : (
                      <p className="text-sm text-gray-400">Email:</p>
                    )
                  } catch {
                    return doc.customer.emails ? (
                      <p className="text-sm text-gray-600">Email: {doc.customer.emails}</p>
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
                <span className="font-medium">${doc.subtotal.toFixed(2)}</span>
              </div>
              {doc.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Tax:</span>
                  <span className="font-medium">${doc.taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>${doc.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {doc.type === 'INVOICE' && doc.paymentSummary && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Payment Summary</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-lg font-semibold">
                    ${doc.paymentSummary.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Paid</p>
                  <p className="text-lg font-semibold text-green-600">
                    ${doc.paymentSummary.totalPaid.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Outstanding</p>
                  <p
                    className={`text-lg font-semibold ${
                      doc.paymentSummary.outstanding > 0
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    ${doc.paymentSummary.outstanding.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Variance</p>
                  <p
                    className={`text-lg font-semibold ${
                      doc.paymentSummary.variance >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    ${Math.abs(doc.paymentSummary.variance).toFixed(2)}
                    {doc.paymentSummary.variance > 0 && ' (Excess)'}
                    {doc.paymentSummary.variance < 0 && ' (Deficit)'}
                  </p>
                </div>
              </div>
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    doc.paymentSummary.status === 'PAID'
                      ? 'bg-green-100 text-green-800'
                      : doc.paymentSummary.status === 'PARTIAL'
                      ? 'bg-yellow-100 text-yellow-800'
                      : doc.paymentSummary.status === 'EXCESS'
                      ? 'bg-green-600 text-white'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {doc.paymentSummary.status}
                </span>
              </div>
            </div>
          )}

          {doc.terms && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Terms & Conditions
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {doc.terms}
              </p>
            </div>
          )}

          {doc.notes && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {doc.notes}
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
                    value={emailData.subject || `${doc.type} ${doc.documentNumber}`}
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
                  <div className="mt-4 border-t border-gray-200 pt-3 text-xs text-gray-600">
                    <div className="flex items-start gap-3">
                      <img
                        src="/logo.png"
                        alt="Heritage Park Hotel"
                        className="h-8 w-auto object-contain"
                      />
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-700">
                          Heritage Park Hotel
                        </p>
                        <p>
                          P.O. Box 1598, Mendana Avenue, Honiara, Solomon
                          Islands
                        </p>
                        <p>
                          Phone: +677 45500 · WhatsApp: 7585008
                        </p>
                        <p>Website: www.heritageparkhotel.com.sb</p>
                      </div>
                    </div>
                  </div>
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

