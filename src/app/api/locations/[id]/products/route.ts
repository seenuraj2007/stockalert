import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const location = await prisma.location.findFirst({
      where: { id, tenantId: user.tenantId }
    })

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    const stockLevels = await prisma.stockLevel.findMany({
      where: { locationId: id },
      include: {
        product: true
      }
    })

    const formattedProducts = stockLevels.map(sl => ({
      ...sl.product,
      location_quantity: sl.quantity
    }))

    return NextResponse.json({ products: formattedProducts })
  } catch (error) {
    console.error('Get location products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
