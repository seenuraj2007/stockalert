import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendEmail, generatePasswordResetEmail } from '@/lib/email'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json(
        { message: 'Password reset email sent' },
        { status: 200 }
      )
    }

    // TODO: Generate reset token and send email
    // For now, just return success
    console.log('Password reset requested for:', email)

    return NextResponse.json(
      { message: 'Password reset email sent' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
