'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { canEditDocument } from '@/lib/permissions'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  const canEdit = session?.user?.role && canEditDocument(session.user.role as any)

  const handleLogoUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!logoFile) {
      setMessage('Please select a file')
      return
    }

    setUploading(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('logo', logoFile)

      const res = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('Logo uploaded successfully!')
        setLogoFile(null)
      } else {
        setMessage(data.error || 'Failed to upload logo')
      }
    } catch (error) {
      setMessage('An error occurred while uploading')
    } finally {
      setUploading(false)
    }
  }

  if (!canEdit) {
    return (
      <ProtectedRoute>
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            You do not have permission to access this page.
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Company Logo</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload a logo image to be displayed on all documents. Supported formats: PNG, JPG, JPEG, GIF. Max size: 5MB.
          </p>

          <form onSubmit={handleLogoUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Logo Image
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>

            {message && (
              <div
                className={`p-3 rounded ${
                  message.includes('success')
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !logoFile}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Logo'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> The logo will be displayed on the top right of all PDF documents. 
              Place the logo file as <code className="bg-white px-2 py-1 rounded">logo.png</code>, 
              <code className="bg-white px-2 py-1 rounded">logo.jpg</code>, or similar in the public folder.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}







