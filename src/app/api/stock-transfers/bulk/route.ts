import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { PermissionsService } from '@/lib/permissions'

// POST - Bulk create stock transfers from CSV
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
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await req.json()
    const { transfers, mode = 'create' } = body

    if (!transfers || !Array.isArray(transfers) || transfers.length === 0) {
      return NextResponse.json({ error: 'No transfers provided' }, { status: 400 })
    }

    const results = {
      success: [] as string[],
      failed: [] as { index: number; error: string }[]
    }

    // Process each transfer
    for (let i = 0; i < transfers.length; i++) {
      const transfer = transfers[i]
      
      try {
        const fromLocationId = transfer.from_location_id || transfer.fromLocationId
        const toLocationId = transfer.to_location_id || transfer.toLocationId
        const items = transfer.items
        const notes = transfer.notes
        const priority = transfer.priority || 'NORMAL'

        // Validation
        if (!fromLocationId || !toLocationId) {
          results.failed.push({ index: i, error: 'Missing source or destination location' })
          continue
        }

        if (fromLocationId === toLocationId) {
          results.failed.push({ index: i, error: 'Source and destination cannot be the same' })
          continue
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
          results.failed.push({ index: i, error: 'No items in transfer' })
          continue
        }

        // Verify locations exist
        const [fromLocation, toLocation] = await Promise.all([
          prisma.location.findFirst({ where: { id: fromLocationId, tenantId: user.tenantId } }),
          prisma.location.findFirst({ where: { id: toLocationId, tenantId: user.tenantId } })
        ])

        if (!fromLocation) {
          results.failed.push({ index: i, error: 'Source location not found' })
          continue
        }
        if (!toLocation) {
          results.failed.push({ index: i, error: 'Destination location not found' })
          continue
        }

        // Validate items and check stock
        const transferItems: { productId: string; quantity: number }[] = []
        
        for (const item of items) {
          const productId = item.product_id || item.productId
          const quantity = Number(item.quantity)

          if (!productId || isNaN(quantity) || quantity <= 0) {
            results.failed.push({ index: i, error: `Invalid item: productId and positive quantity required` })
            continue
          }

          const product = await prisma.product.findFirst({
            where: { id: productId, tenantId: user.tenantId }
          })

          if (!product) {
            results.failed.push({ index: i, error: `Product not found: ${productId}` })
            continue
          }

          const sourceStock = await prisma.stockLevel.findUnique({
            where: {
              tenantId_productId_locationId: {
                tenantId: user.tenantId,
                productId,
                locationId: fromLocationId
              }
            }
          })

          if (!sourceStock || sourceStock.quantity < quantity) {
            results.failed.push({ 
              index: i, 
              error: `Insufficient stock for "${product.name}". Available: ${sourceStock?.quantity || 0}` 
            })
            continue
          }

          transferItems.push({ productId, quantity })
        }

        if (transferItems.length === 0) {
          results.failed.push({ index: i, error: 'No valid items after validation' })
          continue
        }

        // Create transfer
        const newTransfer = await prisma.stockTransfer.create({
          data: {
            tenantId: user.tenantId,
            fromLocationId,
            toLocationId,
            requestedBy: user.id,
            notes: notes || null,
            priority,
            status: 'PENDING',
            items: {
              create: transferItems
            }
          }
        })

        results.success.push(newTransfer.id)
      } catch (error) {
        results.failed.push({ 
          index: i, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    return NextResponse.json({
      message: `Processed ${transfers.length} transfers`,
      results,
      summary: {
        total: transfers.length,
        succeeded: results.success.length,
        failed: results.failed.length
      }
    })
  } catch (error) {
    console.error('Bulk create transfers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Export transfers to CSV format
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
    const format = searchParams.get('format') || 'csv'

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

    const transfers = await prisma.stockTransfer.findMany({
      where,
      include: {
        fromLocation: { select: { name: true } },
        toLocation: { select: { name: true } },
        items: true
      },
      orderBy: { createdAt: 'desc' },
      take: 1000
    })

    // Cast to any to access properties
    const t = transfers as any[]

    if (format === 'json') {
      return NextResponse.json({ transfers: t })
    }

    // Generate CSV
    const headers = ['Transfer ID', 'From Location', 'To Location', 'Status', 'Priority', 'Items', 'Total Quantity', 'Created At', 'Notes']
    const rows = t.map(tr => [
      tr.id,
      tr.fromLocation?.name || '',
      tr.toLocation?.name || '',
      tr.status,
      tr.priority,
      tr.items?.length || 0,
      tr.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
      tr.createdAt?.toISOString() || '',
      tr.notes || ''
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="stock-transfers-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Export transfers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
