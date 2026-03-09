import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

// GET - Get all stock levels
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const locationId = searchParams.get('locationId')
    const productId = searchParams.get('productId')

    const where: any = { tenantId: user.tenantId }
    
    if (locationId) {
      where.locationId = locationId
    }
    if (productId) {
      where.productId = productId
    }

    const stockLevels = await prisma.stockLevel.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, sku: true }
        },
        location: {
          select: { id: true, name: true }
        }
      },
      orderBy: { quantity: 'desc' }
    })

    // Transform to simpler format
    const transformedLevels = stockLevels.map(sl => ({
      id: sl.id,
      productId: sl.productId,
      locationId: sl.locationId,
      quantity: sl.quantity,
      product_name: sl.product?.name,
      product_sku: sl.product?.sku,
      location_name: sl.location?.name
    }))

    return NextResponse.json({ stockLevels: transformedLevels })
  } catch (error) {
    console.error('Get stock levels error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
