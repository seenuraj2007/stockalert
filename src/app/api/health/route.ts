import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {} as Record<string, any>
    }

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`
      health.checks.database = { status: 'healthy' }
    } catch (dbError: any) {
      health.checks.database = { status: 'error', message: dbError.message }
      health.status = 'degraded'
    }

    const response = NextResponse.json(health, {
      status: health.status === 'healthy' ? 200 : 503
    })

    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('X-Health-Check', 'true')

    return response
  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 503 })
  }
}
