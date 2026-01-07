'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalDocuments: 0,
    totalInvoiced: 0,
    totalReceived: 0,
    outstanding: 0,
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        const [customersRes, documentsRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/documents'),
        ])

        const customers = await customersRes.json()
        const documents = await documentsRes.json()

        const invoices = documents.filter((d: any) => d.type === 'INVOICE')
        const totalInvoiced = invoices.reduce(
          (sum: number, inv: any) => sum + inv.totalAmount,
          0
        )
        const totalReceived = invoices.reduce(
          (sum: number, inv: any) => {
            const paid = inv.payments?.reduce(
              (pSum: number, p: any) => pSum + p.amount,
              0
            ) || 0
            return sum + paid
          },
          0
        )

        setStats({
          totalCustomers: customers.length,
          totalDocuments: documents.length,
          totalInvoiced,
          totalReceived,
          outstanding: totalInvoiced - totalReceived,
        })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }

    fetchStats()
  }, [])

  return (
    <ProtectedRoute>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {session?.user?.name}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.totalCustomers}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Customers
                    </dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.totalDocuments}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Documents
                    </dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-gray-900">
                    ${stats.totalInvoiced.toLocaleString()}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Invoiced
                    </dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-green-600">
                    ${stats.totalReceived.toLocaleString()}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Received
                    </dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div
                    className={`text-2xl font-bold ${
                      stats.outstanding > 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    ${Math.abs(stats.outstanding).toLocaleString()}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Outstanding
                    </dt>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

