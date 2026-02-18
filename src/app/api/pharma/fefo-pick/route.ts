import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// FEFO - First Expiry First Out
// For pharmaceuticals, we must sell batches that expire first
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { productId, quantity, locationId } = body

    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json({ 
        error: 'Product ID and valid quantity required' 
      }, { status: 400 })
    }

    // Get product details
    const product = await prisma.product.findFirst({
      where: { 
        id: productId,
        tenantId: user.tenantId 
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Build where clause for batches
    const where: any = {
      tenantId: user.tenantId,
      productId: productId,
      status: 'ACTIVE',
      quantity: { gt: 0 }
    }

    if (locationId) {
      where.stockLevel = {
        locationId: locationId
      }
    }

    // Get batches sorted by expiry date (FEFO)
    // Batches expiring soonest come first
    const batches = await prisma.batch.findMany({
      where,
      include: {
        stockLevel: {
          include: {
            location: true
          }
        }
      },
      orderBy: [
        { expiryDate: 'asc' },  // First Expiry First Out
        { createdAt: 'asc' }    // Then by creation date
      ]
    })

    if (batches.length === 0) {
      return NextResponse.json({ 
        error: 'No active batches found for this product',
        available: 0
      }, { status: 404 })
    }

    // Calculate total available quantity
    const totalAvailable = batches.reduce((sum, b) => sum + b.quantity, 0)
    
    if (totalAvailable < quantity) {
      return NextResponse.json({
        error: `Insufficient stock. Available: ${totalAvailable}, Requested: ${quantity}`,
        available: totalAvailable,
        batches: batches.map(b => ({
          id: b.id,
          batchNumber: b.batchNumber,
          expiryDate: b.expiryDate,
          quantity: b.quantity,
          location: b.stockLevel?.location?.name
        }))
      }, { status: 400 })
    }

    // Select batches using FEFO algorithm
    let remainingQty = quantity
    const selectedBatches = []
    const warnings = []

    for (const batch of batches) {
      if (remainingQty <= 0) break

      const takeQty = Math.min(batch.quantity, remainingQty)
      remainingQty -= takeQty

      // Check if batch is expiring soon (within 3 months)
      const threeMonthsFromNow = new Date()
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)
      
      if (batch.expiryDate && batch.expiryDate < threeMonthsFromNow) {
        const daysUntilExpiry = Math.ceil((batch.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        warnings.push({
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          message: `Batch expires in ${daysUntilExpiry} days`,
          severity: daysUntilExpiry < 30 ? 'critical' : 'warning'
        })
      }

      selectedBatches.push({
        id: batch.id,
        batchNumber: batch.batchNumber,
        quantity: takeQty,
        expiryDate: batch.expiryDate,
        manufacturingDate: batch.manufacturingDate,
        unitCost: batch.unitCost,
        location: batch.stockLevel?.location?.name,
        locationId: batch.stockLevel?.location?.id
      })
    }

    // Check if product requires prescription
    let prescriptionWarning = null
    if (product.requiresPrescription) {
      prescriptionWarning = {
        message: 'This medicine requires a valid prescription',
        drugSchedule: product.drugSchedule,
        severity: 'info'
      }
    }

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        requiresPrescription: product.requiresPrescription,
        drugSchedule: product.drugSchedule,
        storageTemp: product.storageTemp,
        composition: product.composition,
        manufacturer: product.manufacturer,
        maxRetailPrice: product.maxRetailPrice ? Number(product.maxRetailPrice) : null
      },
      batches: selectedBatches,
      totalQuantity: quantity,
      warnings,
      prescriptionWarning,
      algorithm: 'FEFO (First Expiry First Out)',
      message: `Allocated ${quantity} units from ${selectedBatches.length} batch(es) using FEFO`
    })

  } catch (error) {
    console.error('FEFO picking error:', error)
    return NextResponse.json({ 
      error: 'Failed to pick batches using FEFO'
    }, { status: 500 })
  }
}

// GET - Get expiring batches for a product (for pharmaceutical alerts)
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')
    const daysThreshold = parseInt(searchParams.get('days') || '90')

    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold)

    const where: any = {
      tenantId: user.tenantId,
      status: 'ACTIVE',
      quantity: { gt: 0 },
      expiryDate: {
        lte: thresholdDate,
        gte: new Date()
      }
    }

    if (productId) {
      where.productId = productId
    }

    const batches = await prisma.batch.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            drugSchedule: true,
            requiresPrescription: true
          }
        },
        stockLevel: {
          include: {
            location: true
          }
        }
      },
      orderBy: { expiryDate: 'asc' }
    })

    const formattedBatches = batches.map(batch => {
      const daysUntilExpiry = Math.ceil(
        (batch.expiryDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      return {
        id: batch.id,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        daysUntilExpiry,
        quantity: batch.quantity,
        product: batch.product,
        location: batch.stockLevel?.location?.name,
        priority: daysUntilExpiry < 30 ? 'high' : daysUntilExpiry < 60 ? 'medium' : 'low'
      }
    })

    return NextResponse.json({
      batches: formattedBatches,
      totalCount: formattedBatches.length,
      highPriority: formattedBatches.filter(b => b.priority === 'high').length,
      mediumPriority: formattedBatches.filter(b => b.priority === 'medium').length,
      message: `Found ${formattedBatches.length} batches expiring within ${daysThreshold} days`
    })

  } catch (error) {
    console.error('Get expiring batches error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch expiring batches'
    }, { status: 500 })
  }
}
