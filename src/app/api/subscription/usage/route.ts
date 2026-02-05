import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teamCount = await prisma.member.count({
      where: { tenantId: user.tenantId }
    })

    const productCount = await prisma.product.count({
      where: { tenantId: user.tenantId }
    })

    const locationCount = await prisma.location.count({
      where: { tenantId: user.tenantId }
    })

    // Return usage info without subscription limits (subscriptions not yet implemented)
    return NextResponse.json({
      subscription: null,
      limits: {
        teamMembers: {
          current: teamCount,
          limit: -1,
          reached: false
        },
        products: {
          current: productCount,
          limit: -1,
          reached: false
        },
        locations: {
          current: locationCount,
          limit: -1,
          reached: false
        }
      }
    })
  } catch (error) {
    console.error('Error checking usage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
