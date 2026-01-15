import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { testEmailConfiguration } from '@/lib/email'
import { canSendEmail } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only Admin and Staff can test email
    if (!canSendEmail(session.user.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    // Test email configuration
    const result = await testEmailConfiguration(email)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send test email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully. Please check the recipient inbox.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to test email configuration' },
      { status: 500 }
    )
  }
}
