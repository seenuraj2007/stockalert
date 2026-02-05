import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { getOrganizationSubscription } from '@/lib/subscription'
import { LocationRepository } from '@/lib/repositories'
import { prisma } from '@/lib/prisma'

interface LocationResponse {
  id: string
  tenant_id: string
  user_id: string
  name: string
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  country?: string | null
  is_primary?: boolean | null
  type?: string | null
  is_active?: boolean | null
  deleted_at?: Date | null
  created_at?: string
  total_products?: number
  product_stock?: Array<{ count: number }>
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)

    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repo = new LocationRepository(user.tenantId, user.id)
    const locations = await repo.findAll()

    const locationsWithStock: LocationResponse[] = await Promise.all(
      locations.map(async (loc: any) => {
        const productCount = await prisma.stockLevel.count({
          where: {
            tenantId: user.tenantId!,
            locationId: loc.id
          }
        })

        return {
          id: loc.id,
          tenant_id: loc.tenantId,
          user_id: user.id,
          name: loc.name,
          address: loc.address,
          city: loc.city,
          state: loc.state,
          zip: loc.zip,
          country: loc.country,
          type: loc.type,
          is_primary: loc.isPrimary,
          is_active: loc.isActive,
          deleted_at: loc.deletedAt,
          created_at: loc.createdAt?.toISOString(),
          total_products: productCount,
          product_stock: [{ count: productCount }]
        }
      })
    )

    const sortedLocations = locationsWithStock.sort((a, b) => {
      if (a.is_primary !== b.is_primary) {
        return b.is_primary ? 1 : -1
      }
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({ locations: sortedLocations }, {
      headers: {
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=60'
      }
    })
  } catch (error) {
    console.error('Get locations error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)

    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, address, city, state, zip, country, is_primary } = body

    if (!name) {
      return NextResponse.json({ error: 'Location name is required' }, { status: 400 })
    }

    let location: LocationResponse | null = null

    const subscription = await getOrganizationSubscription(user.tenantId)
    const maxLocations = subscription?.plan?.max_locations || 1

    if (subscription && (subscription.status === 'expired' || subscription.status === 'cancelled')) {
      return NextResponse.json({ error: 'Subscription is not active' }, { status: 403 })
    }

    const count = await prisma.location.count({
      where: {
        tenantId: user.tenantId,
        isActive: true,
        deletedAt: null
      }
    })

    console.log('Location limit check:', {
      count, maxLimit: maxLocations,
      subscriptionStatus: subscription?.status,
      planName: subscription?.plan?.display_name || 'Free',
      planType: subscription?.plan?.name || 'free',
      hasTenant: !!user.tenantId
    })

    if (maxLocations !== -1 && count >= maxLocations) {
      console.log('Blocking location creation - limit reached')
      return NextResponse.json({
        error: 'Location limit reached',
        limit: maxLocations,
        current: count,
        upgradeUrl: '/subscription'
      }, { status: 403 })
    }

    const repo = new LocationRepository(user.tenantId, user.id)

    try {
      const newLocation = await repo.create({
        name,
        address,
        city,
        state,
        zip,
        country,
        type: 'WAREHOUSE',
        isPrimary: is_primary || false
      })

      location = {
        id: newLocation.id,
        tenant_id: newLocation.tenantId,
        user_id: user.id,
        name: newLocation.name,
        address: newLocation.address,
        city: newLocation.city,
        state: newLocation.state,
        zip: newLocation.zip,
        country: newLocation.country,
        type: newLocation.type,
        is_primary: newLocation.isPrimary,
        is_active: newLocation.isActive,
        deleted_at: newLocation.deletedAt,
        created_at: newLocation.createdAt?.toISOString(),
        total_products: 0,
        product_stock: []
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Duplicate location name')) {
        return NextResponse.json({ error: 'Location name already exists' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ location }, { status: 201 })
  } catch (error) {
    console.error('POST locations error:', error)
    return NextResponse.json({ error: 'Failed to save location', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
