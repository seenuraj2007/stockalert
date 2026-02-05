import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transfer = await prisma.stockTransfer.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        fromLocation: true,
        toLocation: true
      }
    })

    if (!transfer) {
      return NextResponse.json({ error: 'Stock transfer not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      transfer: { 
        ...transfer, 
        from_location_name: transfer.fromLocation?.name,
        to_location_name: transfer.toLocation?.name
      } 
    })
  } catch (error) {
    console.error('Get stock transfer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { status } = body

    const validStatuses = ['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const transfer = await prisma.stockTransfer.findFirst({
      where: { id, tenantId: user.tenantId }
    })

    if (!transfer) {
      return NextResponse.json({ error: 'Stock transfer not found' }, { status: 404 })
    }

    if (status.toUpperCase() === 'COMPLETED' && transfer.status !== 'IN_TRANSIT') {
      return NextResponse.json({ error: 'Transfer must be in transit before completing' }, { status: 400 })
    }

    const updatedTransfer = await prisma.stockTransfer.update({
      where: { id },
      data: { status: status.toUpperCase() as any },
      include: {
        fromLocation: true,
        toLocation: true
      }
    })

    return NextResponse.json({ transfer: updatedTransfer })
  } catch (error) {
    console.error('Update stock transfer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transfer = await prisma.stockTransfer.findFirst({
      where: { id, tenantId: user.tenantId }
    })

    if (!transfer) {
      return NextResponse.json({ error: 'Stock transfer not found' }, { status: 404 })
    }

    if (transfer.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Cannot delete completed transfer' }, { status: 400 })
    }

    await prisma.stockTransfer.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete stock transfer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
