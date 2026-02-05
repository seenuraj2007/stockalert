import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // If user has no tenant, return info that tenant setup is needed
    if (!user.tenantId) {
      return NextResponse.json({
        subscription: null,
        plans: [],
        usage: {
          teamMembers: 1,
          products: 0,
          locations: 0
        },
        trial: {
          isActive: false,
          daysRemaining: 0
        },
        needsOrganization: true
      })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId }
    })

    const teamCount = await prisma.member.count({
      where: { tenantId: user.tenantId }
    })

    const productCount = await prisma.product.count({
      where: { tenantId: user.tenantId }
    })

    const locationCount = await prisma.location.count({
      where: { tenantId: user.tenantId }
    })

    return NextResponse.json({
      subscription: null, // Subscriptions schema not yet implemented
      plans: [],
      usage: {
        teamMembers: teamCount || 0,
        products: productCount || 0,
        locations: locationCount || 0
      },
      trial: {
        isActive: false,
        daysRemaining: 0
      }
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ error: 'Subscription management requires full implementation' }, { status: 501 })
}
