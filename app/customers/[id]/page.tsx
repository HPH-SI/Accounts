'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Customer {
  id: string
  name: string
  type: string
  address?: string
  phone?: string
  taxNumber?: string
  notes?: string
  outstandingBalance: number
  documents: Array<{
    id: string
    documentNumber: string
    type: string
    totalAmount: number
    createdAt: string
  }>
}

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomer()
  }, [params.id])

  async function fetchCustomer() {
    try {
      const res = await fetch(`/api/customers/${params.id}`)
      const data = await res.json()
      setCustomer(data)
    } catch (error) {
      console.error('Failed to fetch customer:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="text-center py-12">Loading...</div>
      </ProtectedRoute>
    )
  }

  if (!customer) {
    return (
      <ProtectedRoute>
        <div className="text-center py-12">Customer not found</div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
          <Link
            href="/customers"
            className="text-primary-600 hover:text-primary-800"
          >
            ← Back to Customers
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Customer Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="text-sm font-medium">{customer.type}</p>
            </div>
            {customer.phone && (
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-sm font-medium">{customer.phone}</p>
              </div>
            )}
            {customer.taxNumber && (
              <div>
                <p className="text-sm text-gray-500">Tax/VAT Number</p>
                <p className="text-sm font-medium">{customer.taxNumber}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Outstanding Balance</p>
              <p
                className={`text-lg font-bold ${
                  customer.outstandingBalance > 0
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}
              >
                ${customer.outstandingBalance.toFixed(2)}
              </p>
            </div>
            {customer.address && (
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-sm font-medium">{customer.address}</p>
              </div>
            )}
            {customer.notes && (
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-sm font-medium">{customer.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Documents</h2>
          {customer.documents.length === 0 ? (
            <p className="text-gray-500">No documents found</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Document #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customer.documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-900"
                      >
                        {doc.documentNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{doc.type}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      ${doc.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

