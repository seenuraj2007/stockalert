import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { barcode } = body

    if (!barcode) {
      return NextResponse.json({ error: 'Barcode is required' }, { status: 400 })
    }

    // First check barcode registry
    const barcodeRegistry = await prisma.barcodeRegistry.findUnique({
      where: {
        tenantId_barcode: {
          tenantId: user.tenantId,
          barcode: barcode
        }
      }
    })

    // Find product by barcode or SKU
    const product = await prisma.product.findFirst({
      where: {
        tenantId: user.tenantId,
        OR: [
          { barcode },
          { sku: barcode }
        ],
        isActive: true
      }
    })

    // If product found, return it with registry info merged
    if (product) {
      // Get stock levels for this product
      const stockLevels = await prisma.stockLevel.findMany({
        where: { productId: product.id },
        include: { location: true }
      })

      // Calculate total quantity
      const current_quantity = stockLevels.reduce((sum: number, sl: any) => sum + sl.quantity, 0)

      const productResponse = {
        id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        category: product.category,
        current_quantity,
        selling_price: product.sellingPrice ? Number(product.sellingPrice) : 0,
        unit_cost: product.unitCost ? Number(product.unitCost) : 0,
        unit: product.unit,
        image_url: product.imageUrl,
        reorder_point: stockLevels[0]?.reorderPoint || 0,
        stock_levels: stockLevels,
        fromRegistry: false
      }

      return NextResponse.json({ product: productResponse })
    }

    // If not found as product but found in registry, return registry info
    if (barcodeRegistry) {
      return NextResponse.json({
        product: null,
        registryOnly: true,
        registry: {
          barcode: barcodeRegistry.barcode,
          name: barcodeRegistry.name,
          category: barcodeRegistry.category,
          brand: barcodeRegistry.brand,
          unit: barcodeRegistry.unit,
          selling_price: barcodeRegistry.sellingPrice ? Number(barcodeRegistry.sellingPrice) : 0,
          unit_cost: barcodeRegistry.unitCost ? Number(barcodeRegistry.unitCost) : 0,
          gst_rate: barcodeRegistry.gstRate ? Number(barcodeRegistry.gstRate) : 0,
          hsn_code: barcodeRegistry.hsnCode,
          weight_per_unit: barcodeRegistry.weightPerUnit ? Number(barcodeRegistry.weightPerUnit) : null,
          min_weight: barcodeRegistry.minWeight ? Number(barcodeRegistry.minWeight) : null,
          image_url: barcodeRegistry.imageUrl,
          is_perishable: barcodeRegistry.isPerishable
        }
      })
    }

    // Not found anywhere
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  } catch (error) {
    console.error('Barcode lookup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
