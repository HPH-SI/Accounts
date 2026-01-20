'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { downloadElementAsPdf, downloadElementAsPng } from '@/lib/download-pdf'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

interface ChartData {
  label: string
  invoiced: number
  received: number
  variance: number
}

export default function AnalyticsPage() {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar')
  const [filters, setFilters] = useState({
    customerId: '',
    month: new Date().toISOString().substring(0, 7),
    documentType: 'ALL',
  })
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    fetch('/api/customers')
      .then((res) => res.json())
      .then((data) => setCustomers(data))
  }, [])

  useEffect(() => {
    fetchData()
  }, [filters])

  async function fetchData() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.customerId) params.append('customerId', filters.customerId)
      if (filters.month) params.append('month', filters.month)
      if (filters.documentType) params.append('documentType', filters.documentType)

      const res = await fetch(`/api/analytics/monthly?${params}`)
      const data = await res.json()
      setChartData(data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  async function downloadChart(format: 'png' | 'pdf' | 'csv') {
    if (format === 'csv') {
      const csv = [
        ['Period', 'Invoiced', 'Received', 'Variance'],
        ...chartData.map((d) => [
          d.label,
          d.invoiced.toFixed(2),
          d.received.toFixed(2),
          d.variance.toFixed(2),
        ]),
      ]
        .map((row) => row.join(','))
        .join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${Date.now()}.csv`
      a.click()
    } else {
      try {
        const filename = `analytics-${Date.now()}`
        if (format === 'png') {
          await downloadElementAsPng('pdf-analytics', filename)
        } else {
          await downloadElementAsPdf('pdf-analytics', filename)
        }
      } catch (error: any) {
        console.error('Analytics download failed:', error)
        alert(error?.message || 'Failed to download')
      }
    }
  }

  const data = {
    labels: chartData.map((d) => d.label),
    datasets: [
      {
        label: 'Invoiced',
        data: chartData.map((d) => d.invoiced),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Received',
        data: chartData.map((d) => d.received),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Contribution',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  return (
    <ProtectedRoute>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics</h1>

        <div id="pdf-analytics" className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer
              </label>
              <select
                value={filters.customerId}
                onChange={(e) =>
                  setFilters({ ...filters, customerId: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Customers</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <input
                type="month"
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Type
              </label>
              <select
                value={filters.documentType}
                onChange={(e) =>
                  setFilters({ ...filters, documentType: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="ALL">All</option>
                <option value="INVOICE">Invoice</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chart Type
              </label>
              <select
                value={chartType}
                onChange={(e) =>
                  setChartType(e.target.value as 'bar' | 'line')
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mb-4">
            <button
              onClick={() => downloadChart('csv')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
            >
              Download CSV
            </button>
            <button
              onClick={() => downloadChart('png')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
            >
              Download PNG
            </button>
            <button
              onClick={() => downloadChart('pdf')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
            >
              Download PDF
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : chartData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No data available for selected filters
            </div>
          ) : (
            <div className="h-96">
              {chartType === 'bar' ? (
                <Bar data={data} options={options} />
              ) : (
                <Line data={data} options={options} />
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

