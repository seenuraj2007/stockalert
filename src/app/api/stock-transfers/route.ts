import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { PermissionsService } from '@/lib/permissions'

// GET - List all stock transfers with enhanced filtering and suggestions
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const fromLocationId = searchParams.get('fromLocationId')
    const toLocationId = searchParams.get('toLocationId')
    const productId = searchParams.get('productId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: any = { tenantId: user.tenantId }
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }
    if (fromLocationId) {
      where.fromLocationId = fromLocationId
    }
    if (toLocationId) {
      where.toLocationId = toLocationId
    }
    if (productId) {
      where.items = {
        some: { productId }
      }
    }

    // Build orderBy
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    const [transfers, total] = await Promise.all([
      prisma.stockTransfer.findMany({
        where,
        include: {
          fromLocation: {
            select: { id: true, name: true }
          },
          toLocation: {
            select: { id: true, name: true }
          },
          items: true
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.stockTransfer.count({ where })
    ])

    // Transform transfers to match frontend expectations
    const transformedTransfers = transfers.map((t) => ({
      id: t.id,
      from_location_id: t.fromLocationId,
      to_location_id: t.toLocationId,
      from_location_name: t.fromLocation?.name,
      to_location_name: t.toLocation?.name,
      status: t.status.toLowerCase(),
      priority: t.priority,
      notes: t.notes,
      requested_by: t.requestedBy,
      approved_by: t.approvedBy,
      approved_at: t.approvedAt,
      completed_by: t.completedBy,
      completed_at: t.completedAt,
      created_at: t.createdAt,
      updated_at: t.updatedAt,
      items_count: t.items.length,
      total_quantity: t.items.reduce((sum, item) => sum + item.quantity, 0),
      items: t.items.map((item) => ({
        id: item.id,
        product_id: item.productId,
        quantity: item.quantity,
        received_qty: item.receivedQty
      }))
    }))

    // Get smart suggestions for locations based on historical data
    const suggestions = await getSmartSuggestions(user.tenantId)

    return NextResponse.json({
      transfers: transformedTransfers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      suggestions
    })
  } catch (error) {
    console.error('Get stock transfers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new stock transfer with validation
export async function POST(req: NextRequest) {
  try {
    let user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load role permissions from database
    user = await PermissionsService.loadUserPermissions(user)

    // Check permission
    const hasPermission = await PermissionsService.canCreate(user, 'stock_transfers')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied. You do not have permission to create stock transfers.' }, { status: 403 })
    }

    const body = await req.json()
    
    // Support both snake_case (from form) and camelCase formats
    const fromLocationId = body.from_location_id || body.fromLocationId
    const toLocationId = body.to_location_id || body.toLocationId
    const notes = body.notes
    const priority = body.priority || 'NORMAL'
    const items = body.items

    // Validation
    if (!fromLocationId || !toLocationId) {
      return NextResponse.json({
        error: 'Missing required fields: fromLocationId, toLocationId'
      }, { status: 400 })
    }

    if (fromLocationId === toLocationId) {
      return NextResponse.json({
        error: 'Source and destination locations cannot be the same'
      }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        error: 'At least one item is required'
      }, { status: 400 })
    }

    // Verify locations exist and belong to tenant
    const [fromLocation, toLocation] = await Promise.all([
      prisma.location.findFirst({
        where: { id: fromLocationId, tenantId: user.tenantId }
      }),
      prisma.location.findFirst({
        where: { id: toLocationId, tenantId: user.tenantId }
      })
    ])

    if (!fromLocation) {
      return NextResponse.json({ error: 'Source location not found' }, { status: 404 })
    }
    if (!toLocation) {
      return NextResponse.json({ error: 'Destination location not found' }, { status: 404 })
    }

    // Validate all items and check stock availability
    const transferItems: { productId: string; quantity: number }[] = []
    for (const item of items) {
      const productId = item.product_id || item.productId
      const quantity = Number(item.quantity)

      if (!productId || isNaN(quantity) || quantity <= 0) {
        return NextResponse.json({
          error: `Invalid item: productId and positive quantity required`
        }, { status: 400 })
      }

      // Verify product exists
      const product = await prisma.product.findFirst({
        where: { id: productId, tenantId: user.tenantId }
      })

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${productId}` }, { status: 404 })
      }

      // Check stock availability at source location
      const sourceStock = await prisma.stockLevel.findUnique({
        where: {
          tenantId_productId_locationId: {
            tenantId: user.tenantId,
            productId: productId,
            locationId: fromLocationId
          }
        }
      })

      if (!sourceStock || sourceStock.quantity < quantity) {
        return NextResponse.json({ 
          error: `Insufficient stock for "${product.name}". Available: ${sourceStock?.quantity || 0}, Requested: ${quantity}` 
        }, { status: 400 })
      }

      transferItems.push({
        productId,
        quantity
      })
    }

    // Create transfer with items in a transaction
    const transfer = await prisma.$transaction(async (tx) => {
      const newTransfer = await tx.stockTransfer.create({
        data: {
          tenantId: user.tenantId!,
          fromLocationId,
          toLocationId,
          requestedBy: user.id,
          notes: notes || null,
          priority,
          status: 'PENDING',
          items: {
            create: transferItems
          }
        },
        include: {
          fromLocation: { select: { id: true, name: true } },
          toLocation: { select: { id: true, name: true } },
          items: true
        }
      })
      return newTransfer
    })

    return NextResponse.json({ 
      transfer: {
        id: transfer.id,
        from_location_id: transfer.fromLocationId,
        to_location_id: transfer.toLocationId,
        from_location_name: transfer.fromLocation?.name,
        to_location_name: transfer.toLocation?.name,
        status: transfer.status.toLowerCase(),
        priority: transfer.priority,
        notes: transfer.notes,
        items: transfer.items.map((item) => ({
          id: item.id,
          product_id: item.productId,
          quantity: item.quantity
        }))
      },
      message: 'Stock transfer created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Create stock transfer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get smart suggestions for locations
async function getSmartSuggestions(tenantId: string) {
  try {
    // Get most frequent source locations (based on historical transfers)
    const frequentSources = await prisma.stockTransfer.groupBy({
      by: ['fromLocationId'],
      where: { tenantId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 3
    })

    // Get most frequent destination locations
    const frequentDestinations = await prisma.stockTransfer.groupBy({
      by: ['toLocationId'],
      where: { tenantId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 3
    })

    // Get locations with most stock
    const locationsWithStock = await prisma.stockLevel.findMany({
      where: { tenantId, quantity: { gt: 0 } },
      orderBy: { quantity: 'desc' }
    })

    // Group stock by location
    const stockByLocation: Record<string, { locationId: string; totalStock: number }> = {}
    for (const stock of locationsWithStock) {
      if (!stockByLocation[stock.locationId]) {
        stockByLocation[stock.locationId] = {
          locationId: stock.locationId,
          totalStock: 0
        }
      }
      stockByLocation[stock.locationId].totalStock += Number(stock.quantity)
    }

    // Get locations that frequently receive transfers (likely warehouses/stores)
    const receivingLocations = await prisma.stockTransfer.groupBy({
      by: ['toLocationId'],
      where: { tenantId, status: 'COMPLETED' },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 3
    })

    return {
      recommendedSources: frequentSources.map(s => ({
        locationId: s.fromLocationId,
        transferCount: s._count.id
      })),
      recommendedDestinations: frequentDestinations.map(d => ({
        locationId: d.toLocationId,
        transferCount: d._count.id
      })),
      highStockLocations: Object.values(stockByLocation)
        .sort((a, b) => b.totalStock - a.totalStock)
        .slice(0, 5),
      receivingLocations: receivingLocations.map(r => ({
        locationId: r.toLocationId,
        completedCount: r._count.id
      }))
    }
  } catch (error) {
    console.error('Error getting suggestions:', error)
    return {
      recommendedSources: [],
      recommendedDestinations: [],
      highStockLocations: [],
      receivingLocations: []
    }
  }
}
