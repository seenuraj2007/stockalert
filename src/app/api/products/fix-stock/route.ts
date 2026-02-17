import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getCurrentTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req as any)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = await getCurrentTenantId(req as any)
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create a location
    let location = await prisma.location.findFirst({
      where: {
        tenantId,
        isActive: true,
        deletedAt: null
      }
    })

    if (!location) {
      location = await prisma.location.create({
        data: {
          tenantId,
          name: 'Main Warehouse',
          type: 'WAREHOUSE',
          isPrimary: true,
          isActive: true
        }
      })
    }

    // Get all products for this tenant
    const products = await prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
        deletedAt: null
      },
      select: { id: true, name: true }
    })

    // Get existing stock levels
    const existingStockLevels = await prisma.stockLevel.findMany({
      where: {
        tenantId,
        locationId: location.id
      },
      select: { productId: true }
    })

    const existingProductIds = new Set(existingStockLevels.map(sl => sl.productId))

    // Find products without stock levels
    const productsWithoutStock = products.filter(p => !existingProductIds.has(p.id))

    if (productsWithoutStock.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All products already have stock levels',
        fixed: 0
      })
    }

    // Create stock levels for missing products
    let fixed = 0
    for (const product of productsWithoutStock) {
      try {
        await prisma.stockLevel.create({
          data: {
            tenantId,
            productId: product.id,
            locationId: location.id,
            quantity: 0,
            reorderPoint: 0,
            reservedQuantity: 0,
            version: 0
          }
        })
        fixed++
      } catch (error) {
        console.error(`Failed to create stock level for product ${product.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created stock levels for ${fixed} products`,
      fixed,
      location: location.name
    })

  } catch (error) {
    console.error('Fix stock levels error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
