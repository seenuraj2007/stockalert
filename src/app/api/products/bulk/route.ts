import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { products } = body

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'Products array is required' }, { status: 400 })
    }

    const results = []
    for (const product of products) {
      try {
        const created = await prisma.product.create({
          data: {
            tenantId: user.tenantId,
            sku: product.sku,
            barcode: product.barcode,
            name: product.name,
            description: product.description,
            unitCost: product.unitCost,
            sellingPrice: product.sellingPrice,
            category: product.category,
            unit: product.unit,
            supplierName: product.supplierName,
            supplierEmail: product.supplierEmail,
            supplierPhone: product.supplierPhone
          }
        })
        results.push({ success: true, product: created })
      } catch (err) {
        results.push({ success: false, sku: product.sku, error: String(err) })
      }
    }

    return NextResponse.json({ results }, { status: 201 })
  } catch (error) {
    console.error('Bulk create products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
