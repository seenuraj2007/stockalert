import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { PermissionsService } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        tenantId: user.tenantId
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Map to frontend expected format
    const orders = purchaseOrders.map(po => ({
      id: po.id,
      order_number: po.orderNumber,
      status: po.status.toLowerCase(),
      total_cost: Number(po.totalAmount),
      created_at: po.createdAt.toISOString(),
      supplier_name: po.supplierName,
      items_count: po.items.length
    }))

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Purchase orders API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    let user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load role permissions from database
    user = await PermissionsService.loadUserPermissions(user)

    // Check permission
    const hasPermission = await PermissionsService.canCreate(user, 'purchase_orders')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied. You do not have permission to create purchase orders.' }, { status: 403 })
    }

    const body = await req.json()
    const { supplier_id, items, notes } = body

    // Validate required fields
    if (!supplier_id || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields: supplier and items are required' }, { status: 400 })
    }

    // Look up supplier details
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: supplier_id,
        tenantId: user.tenantId
      }
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Generate order number
    const orderNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_cost), 0)

    // Create purchase order with items
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        tenantId: user.tenantId,
        orderNumber: orderNumber,
        supplierId: supplier_id,
        supplierName: supplier.name,
        supplierEmail: supplier.email,
        supplierPhone: supplier.phone,
        totalAmount: totalAmount,
        notes: notes,
        orderedBy: user.id,
        orderedAt: new Date(),
        status: 'ORDERED',
        items: {
          create: items.map((item: any) => ({
            tenantId: user.tenantId,
            productId: item.product_id,
            quantity: item.quantity,
            unitCost: item.unit_cost,
            totalCost: item.quantity * item.unit_cost,
            receivedQty: 0
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    return NextResponse.json({ purchaseOrder: purchaseOrder }, { status: 201 })
  } catch (error) {
    console.error('Purchase order POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
