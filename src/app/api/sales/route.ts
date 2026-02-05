import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get sales from inventory events (type = STOCK_SOLD)
    const sales = await prisma.inventoryEvent.findMany({
      where: { 
        tenantId: user.tenantId,
        type: 'STOCK_SOLD'
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ sales })
  } catch (error) {
    console.error('Get sales error:', error)
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
    const { customerId, items, paymentMethod, paymentStatus, notes } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 })
    }

    const saleNumber = `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    let total = 0

    // Process each item
    for (const item of items) {
      const { productId, quantity, unitPrice, discount } = item
      const itemTotal = (unitPrice * quantity) - (discount || 0)
      total += itemTotal

      // Create inventory event for the sale
      await prisma.inventoryEvent.create({
        data: {
          tenantId: user.tenantId,
          type: 'STOCK_SOLD',
          productId,
          quantityDelta: -quantity,
          runningBalance: 0,
          referenceType: 'SALE',
          referenceId: saleNumber,
          userId: user.userId,
          notes: notes || `Sale: ${saleNumber}`,
          metadata: {
            paymentMethod,
            paymentStatus,
            customerId,
            unitPrice,
            discount
          }
        }
      })

      // Update stock levels
      const stockLevels = await prisma.stockLevel.findMany({
        where: { productId }
      })

      if (stockLevels.length > 0) {
        const primaryLocation = stockLevels.find(sl => sl.quantity > 0) || stockLevels[0]
        if (primaryLocation) {
          await prisma.stockLevel.update({
            where: { id: primaryLocation.id },
            data: {
              quantity: primaryLocation.quantity - quantity
            }
          })
        }
      }
    }

    return NextResponse.json({ 
      sale: {
        id: saleNumber,
        sale_number: saleNumber,
        total
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Create sale error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
