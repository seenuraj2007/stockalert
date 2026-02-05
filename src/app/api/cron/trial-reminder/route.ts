import { NextRequest, NextResponse } from 'next/server'
// import { 
import { sendEmail, generateTrialEndingEmail } from '@/lib/email'
import { isBefore } from 'date-fns'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
    }
    // Allow development without CRON_SECRET
  }

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = {
      checked: 0,
      remindersSent: 0,
      errors: [] as string[]
    }

    // Trial subscription functionality has been migrated to Prisma
    // This cron job requires subscription data which is not yet implemented in the new schema
    // Returning success with no-op for now

    return NextResponse.json({
      success: true,
      message: 'Trial reminder cron job is paused - subscriptions schema migration needed',
      ...results
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
