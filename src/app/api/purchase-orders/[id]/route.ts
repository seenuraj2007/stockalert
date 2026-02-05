import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const poId = req.url.split('/').pop()

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: poId, tenantId: user.tenantId }
    })

    if (!purchaseOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    return NextResponse.json({ purchaseOrder })
  } catch (error) {
    console.error('Get purchase order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const poId = req.url.split('/').pop()

    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id: poId, tenantId: user.tenantId },
      data: body
    })

    return NextResponse.json({ purchaseOrder })
  } catch (error) {
    console.error('Update purchase order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const poId = req.url.split('/').pop()

    await prisma.purchaseOrder.delete({
      where: { id: poId, tenantId: user.tenantId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete purchase order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
