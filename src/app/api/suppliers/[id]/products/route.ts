import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // In the new schema, suppliers are stored as fields on products
    // Find products by supplier email or name
    const products = await prisma.product.findMany({
      where: {
        tenantId: user.tenantId,
        OR: [
          { supplierEmail: id },
          { supplierName: id }
        ]
      },
      orderBy: { name: 'asc' }
    })

    if (products.length === 0) {
      return NextResponse.json({ error: 'Supplier not found or no products found' }, { status: 404 })
    }

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Get supplier products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
