'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface CustomerFormData {
  name: string
  type: string
  address: string
  emails: string
  phone: string
  taxNumber: string
  notes: string
}

function normalizeEmails(value?: string) {
  if (!value) return ''
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.join(', ') : String(parsed)
  } catch {
    return value
  }
}

export default function EditCustomerPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    type: 'INDIVIDUAL',
    address: '',
    emails: '',
    phone: '',
    taxNumber: '',
    notes: '',
  })

  useEffect(() => {
    fetchCustomer()
  }, [params.id])

  async function fetchCustomer() {
    try {
      const res = await fetch(`/api/customers/${params.id}`)
      const data = await res.json()
      setFormData({
        name: data.name || '',
        type: data.type || 'INDIVIDUAL',
        address: data.address || '',
        emails: normalizeEmails(data.emails),
        phone: data.phone || '',
        taxNumber: data.taxNumber || '',
        notes: data.notes || '',
      })
    } catch (error: any) {
      alert('Failed to load customer')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const emails = formData.emails.split(',').map((e) => e.trim()).filter(Boolean)
      const res = await fetch(`/api/customers/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          emails,
        }),
      })

      if (res.ok) {
        router.push(`/customers/${params.id}`)
      } else {
        alert('Failed to update customer')
      }
    } catch (error) {
      alert('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="text-center py-12">Loading...</div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Customer</h1>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="INDIVIDUAL">Individual</option>
                <option value="COMPANY">Company</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email(s) (comma-separated)
              </label>
              <input
                type="text"
                value={formData.emails}
                onChange={(e) => setFormData({ ...formData, emails: e.target.value })}
                placeholder="email1@example.com, email2@example.com"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tax/VAT Number
              </label>
              <input
                type="text"
                value={formData.taxNumber}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  )
}
