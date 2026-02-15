import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  console.log('[API] Billing products endpoint hit')
  try {
    const user = await getUserFromRequest(req)
    console.log('[API] User:', user?.id, 'Tenant:', user?.tenantId)
    if (!user || !user.tenantId) {
      console.log('[API] Unauthorized - no user or tenant')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch products with current stock levels
    const products = await prisma.product.findMany({
      where: { 
        tenantId: user.tenantId,
        isActive: true
      },
      include: {
        stockLevels: true
      }
    })

    // Transform to POS format
    const posProducts = products.map((product: any) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      category: product.category,
      current_quantity: product.stockLevels.reduce((sum: number, sl: any) => sum + sl.quantity, 0),
      reorder_point: 0,
      selling_price: Number(product.sellingPrice),
      unit_cost: product.unitCost ? Number(product.unitCost) : null,
      unit: product.unit,
      image_url: product.imageUrl,
      hsn_code: product.hsnCode,
      gst_rate: product.gstRate ? Number(product.gstRate) : 0
    }))

    return NextResponse.json({ products: posProducts })
  } catch (error) {
    console.error('Get billing products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
