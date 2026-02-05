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

    const history = await prisma.inventoryEvent.findMany({
      where: { productId, tenantId: user.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Get history error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
