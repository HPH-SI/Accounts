'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Document {
  id: string
  documentNumber: string
  type: string
  customer: {
    name: string
  }
  totalAmount: number
  payments: Array<{ amount: number }>
  createdAt: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    fetchDocuments()
  }, [filter])

  async function fetchDocuments() {
    try {
      setLoading(true)
      const url =
        filter !== 'ALL'
          ? `/api/documents?type=${filter}`
          : '/api/documents'
      const res = await fetch(url)
      const data = await res.json()
      setDocuments(data)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  function getPaymentStatus(doc: Document) {
    const totalPaid = doc.payments?.reduce((sum, p) => sum + p.amount, 0) || 0
    const outstanding = doc.totalAmount - totalPaid

    if (outstanding <= 0) {
      return outstanding < 0 ? 'EXCESS' : 'PAID'
    }
    return totalPaid > 0 ? 'PARTIAL' : 'UNPAID'
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'PARTIAL':
        return 'bg-yellow-100 text-yellow-800'
      case 'EXCESS':
        return 'bg-green-600 text-white'
      default:
        return 'bg-red-100 text-red-800'
    }
  }

  return (
    <ProtectedRoute>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <Link
            href="/documents/new"
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            New Document
          </Link>
        </div>

        <div className="mb-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="ALL">All Documents</option>
            <option value="QUOTATION">Quotations</option>
            <option value="PROFORMA">Proforma Invoices</option>
            <option value="INVOICE">Invoices</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => {
                  const status = getPaymentStatus(doc)
                  const totalPaid = doc.payments?.reduce((sum, p) => sum + p.amount, 0) || 0
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="text-sm font-medium text-primary-600 hover:text-primary-900"
                        >
                          {doc.documentNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.customer.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${doc.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {documents.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No documents found
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

