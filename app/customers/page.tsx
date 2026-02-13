'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { downloadElementAsPdf } from '@/lib/download-pdf'

interface Customer {
  id: string
  name: string
  type: string
  address?: string
  phone?: string
  outstandingBalance: number
}

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [search])

  async function fetchCustomers() {
    try {
      setLoading(true)
      const url = search
        ? `/api/customers?search=${encodeURIComponent(search)}`
        : '/api/customers'
      const res = await fetch(url)
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        setCustomers([])
        return
      }

      setCustomers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch customers:', error)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadPdf() {
    try {
      await downloadElementAsPdf('pdf-customers', 'customers')
    } catch (error: any) {
      console.error('Customers PDF download failed:', error)
      alert(error?.message || 'Failed to download PDF')
    }
  }

  return (
    <ProtectedRoute>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPdf}
              className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800"
            >
              Download PDF
            </button>
            <Link
              href="/customers/new"
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              Add Customer
            </Link>
          </div>
        </div>

        <div id="pdf-customers">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {customers.map((customer) => (
                  <li key={customer.id}>
                    <Link
                      href={`/customers/${customer.id}`}
                      className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {customer.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {customer.type} {customer.phone && `• ${customer.phone}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-medium ${
                              customer.outstandingBalance > 0
                                ? 'text-red-600'
                                : 'text-green-600'
                            }`}
                          >
                            ${customer.outstandingBalance.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">Outstanding</p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              {customers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No customers found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

