'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useState } from 'react'

export default function ReportsPage() {
  const [reportType, setReportType] = useState('monthly')
  const [filters, setFilters] = useState({
    month: new Date().toISOString().substring(0, 7),
    customerId: '',
  })

  function downloadReport(format: 'excel' | 'csv') {
    const params = new URLSearchParams()
    params.append('type', reportType)
    params.append('format', format)
    if (reportType === 'monthly' && filters.month) {
      params.append('month', filters.month)
    }
    if (reportType === 'customer' && filters.customerId) {
      params.append('customerId', filters.customerId)
    }

    window.open(`/api/reports/download?${params.toString()}`, '_blank')
  }

  return (
    <ProtectedRoute>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Reports</h1>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full max-w-md border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="monthly">Monthly Summary</option>
              <option value="customer">Customer Report</option>
              <option value="outstanding">Outstanding Balances</option>
            </select>
          </div>

          {reportType === 'monthly' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month
              </label>
              <input
                type="month"
                value={filters.month}
                onChange={(e) =>
                  setFilters({ ...filters, month: e.target.value })
                }
                className="w-full max-w-md border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          )}

          {reportType === 'customer' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer ID
              </label>
              <input
                type="text"
                value={filters.customerId}
                onChange={(e) =>
                  setFilters({ ...filters, customerId: e.target.value })
                }
                placeholder="Enter customer ID"
                className="w-full max-w-md border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={() => downloadReport('excel')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Download Excel
            </button>
            <button
              onClick={() => downloadReport('csv')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Download CSV
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

