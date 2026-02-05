import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const productId = req.url.split('/').slice(-2, -1)[0]

    const stockLevels = await prisma.stockLevel.findMany({
      where: { productId, tenantId: user.tenantId }
    })

    return NextResponse.json({ stockLevels })
  } catch (error) {
    console.error('Get stock error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const productId = req.url.split('/').slice(-2, -1)[0]

    const stockLevel = await prisma.stockLevel.upsert({
      where: {
        tenantId_productId_locationId: {
          tenantId: user.tenantId,
          productId,
          locationId: body.locationId
        }
      },
      create: {
        tenantId: user.tenantId,
        productId,
        locationId: body.locationId,
        quantity: body.quantity || 0
      },
      update: {
        quantity: body.quantity
      }
    })

    return NextResponse.json({ stockLevel }, { status: 201 })
  } catch (error) {
    console.error('Update stock error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
