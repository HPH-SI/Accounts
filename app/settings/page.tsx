'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { canEditDocument, canSendEmail } from '@/lib/permissions'
import { SENDER_EMAIL_ADDRESSES } from '@/lib/email-config'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [emailTestAddress, setEmailTestAddress] = useState('')
  const [testingEmail, setTestingEmail] = useState(false)
  const [emailMessage, setEmailMessage] = useState('')

  const canEdit = session?.user?.role && canEditDocument(session.user.role as any)
  const canTestEmail = session?.user?.role && canSendEmail(session.user.role as any)

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

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailTestAddress) {
      setEmailMessage('Please enter an email address')
      return
    }

    setTestingEmail(true)
    setEmailMessage('')

    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailTestAddress }),
      })

      const data = await res.json()

      if (res.ok) {
        setEmailMessage('Test email sent successfully! Please check the recipient inbox (and spam folder).')
        setEmailTestAddress('')
      } else {
        setEmailMessage(data.error || 'Failed to send test email')
      }
    } catch (error) {
      setEmailMessage('An error occurred while testing email')
    } finally {
      setTestingEmail(false)
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

        {canTestEmail && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Email Configuration</h2>
            <p className="text-sm text-gray-600 mb-4">
              Test your email configuration by sending a test email. Make sure SMTP settings are configured in your <code className="bg-gray-100 px-2 py-1 rounded">.env</code> file.
            </p>

            <div className="mb-4 p-4 bg-blue-50 rounded">
              <p className="text-sm font-semibold text-blue-900 mb-2">Available Sender Addresses:</p>
              <ul className="text-sm text-blue-800 list-disc list-inside">
                {SENDER_EMAIL_ADDRESSES.map((email) => (
                  <li key={email}>{email}</li>
                ))}
              </ul>
            </div>

            <div className="mb-4 p-4 bg-yellow-50 rounded">
              <p className="text-sm font-semibold text-yellow-900 mb-2">Required Environment Variables:</p>
              <ul className="text-sm text-yellow-800 font-mono space-y-1">
                <li>SMTP_HOST</li>
                <li>SMTP_PORT</li>
                <li>SMTP_USER</li>
                <li>SMTP_PASSWORD</li>
                <li>SMTP_FROM</li>
              </ul>
              <p className="text-xs text-yellow-700 mt-2">
                See <code className="bg-white px-1 rounded">EMAIL_SETUP.md</code> for detailed configuration instructions.
              </p>
            </div>

            <form onSubmit={handleTestEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Email Address
                </label>
                <input
                  type="email"
                  required
                  value={emailTestAddress}
                  onChange={(e) => setEmailTestAddress(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter an email address to send a test email to
                </p>
              </div>

              {emailMessage && (
                <div
                  className={`p-3 rounded ${
                    emailMessage.includes('success')
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {emailMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={testingEmail || !emailTestAddress}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {testingEmail ? 'Sending Test Email...' : 'Send Test Email'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> If the test email fails, check:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside mt-2 space-y-1">
                <li>SMTP credentials in <code className="bg-white px-1 rounded">.env</code> file are correct</li>
                <li>SMTP server allows connections from your IP address</li>
                <li>Firewall settings allow SMTP port (587 or 465)</li>
                <li>For Gmail, ensure you're using an App Password, not your regular password</li>
                <li>Check spam/junk folder if email doesn't arrive</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}







