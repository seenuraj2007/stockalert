import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest, requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transfers = await prisma.stockTransfer.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ transfers }, {
      headers: {
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=30'
      }
    })
  } catch (error) {
    console.error('Get stock transfers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)

    const body = await req.json()
    const { fromLocationId, toLocationId, productId, quantity, notes } = body

    if (!fromLocationId || !toLocationId || !productId || !quantity) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const transfer = await prisma.stockTransfer.create({
      data: {
        tenantId: user.tenantId,
        fromLocationId,
        toLocationId,
        productId,
        quantity: Number(quantity),
        requestedBy: user.userId,
        notes: notes || null,
        status: 'PENDING'
      }
    })

    return NextResponse.json({ transfer }, { status: 201 })
  } catch (error) {
    console.error('Create stock transfer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
