import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// IMEI validation function
function validateIMEI(imei: string): boolean {
  // Remove any spaces or dashes
  const cleanIMEI = imei.replace(/[-\s]/g, '')
  
  // IMEI must be 15 digits
  if (!/^\d{15}$/.test(cleanIMEI)) {
    return false
  }
  
  // Luhn algorithm check
  let sum = 0
  let isEven = false
  
  for (let i = cleanIMEI.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanIMEI.charAt(i), 10)
    
    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

// GET - Get serial numbers/IMEIs for a product
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const where: any = {
      tenantId: user.tenantId,
      productId: productId
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { alternateSerial: { contains: search, mode: 'insensitive' } }
      ]
    }

    const serialNumbers = await prisma.serialNumber.findMany({
      where,
      include: {
        batch: {
          select: {
            batchNumber: true,
            manufacturingDate: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate warranty status for each
    const formatted = serialNumbers.map(sn => {
      const isWarrantyValid = sn.warrantyExpiry && sn.warrantyExpiry > new Date()
      const warrantyDaysLeft = sn.warrantyExpiry 
        ? Math.ceil((sn.warrantyExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null

      return {
        id: sn.id,
        serialNumber: sn.serialNumber,
        alternateSerial: sn.alternateSerial,
        status: sn.status,
        isIMEI: sn.serialNumber.length === 15 && /^\d{15}$/.test(sn.serialNumber),
        isIMEIValid: sn.serialNumber.length === 15 ? validateIMEI(sn.serialNumber) : null,
        warrantyMonths: sn.warrantyMonths,
        warrantyExpiry: sn.warrantyExpiry,
        isWarrantyValid,
        warrantyDaysLeft,
        unitCost: sn.unitCost ? Number(sn.unitCost) : null,
        customerId: sn.customerId,
        soldAt: sn.soldAt,
        invoiceId: sn.invoiceId,
        batch: sn.batch,
        notes: sn.notes,
        createdAt: sn.createdAt
      }
    })

    return NextResponse.json({ 
      serialNumbers: formatted,
      totalCount: formatted.length,
      inStock: formatted.filter(s => s.status === 'IN_STOCK').length,
      sold: formatted.filter(s => s.status === 'SOLD').length,
      underWarranty: formatted.filter(s => s.isWarrantyValid).length
    })

  } catch (error) {
    console.error('Get serial numbers error:', error)
    return NextResponse.json({ error: 'Failed to fetch serial numbers' }, { status: 500 })
  }
}

// POST - Add new serial numbers/IMEIs
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { productId, serialNumbers, batchId, warrantyMonths } = body

    if (!productId || !serialNumbers || !Array.isArray(serialNumbers) || serialNumbers.length === 0) {
      return NextResponse.json({ 
        error: 'Product ID and serial numbers array required' 
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

    const results = []
    const errors = []

    for (const snData of serialNumbers) {
      try {
        let serialNumber = snData.serialNumber || snData
        let alternateSerial = snData.alternateSerial || null
        let notes = snData.notes || null

        // Validate IMEI if product requires it
        if (product.requiresIMEI && serialNumber.length === 15) {
          if (!validateIMEI(serialNumber)) {
            errors.push({
              serialNumber,
              error: 'Invalid IMEI number (Luhn check failed)'
            })
            continue
          }
        }

        // Calculate warranty expiry
        const months = warrantyMonths || product.warrantyMonths || 12
        const warrantyExpiry = new Date()
        warrantyExpiry.setMonth(warrantyExpiry.getMonth() + months)

        // Check if serial number already exists
        const existing = await prisma.serialNumber.findFirst({
          where: {
            tenantId: user.tenantId,
            productId: productId,
            serialNumber: serialNumber
          }
        })

        if (existing) {
          errors.push({
            serialNumber,
            error: 'Serial number already exists'
          })
          continue
        }

        const created = await prisma.serialNumber.create({
          data: {
            tenantId: user.tenantId,
            productId: productId,
            batchId: batchId || null,
            serialNumber: serialNumber,
            alternateSerial: alternateSerial,
            status: 'IN_STOCK',
            warrantyMonths: months,
            warrantyExpiry: warrantyExpiry,
            unitCost: snData.unitCost ? parseFloat(snData.unitCost) : null,
            notes: notes,
            createdBy: user.id
          }
        })

        results.push({
          id: created.id,
          serialNumber: created.serialNumber,
          warrantyExpiry: created.warrantyExpiry,
          isIMEI: product.requiresIMEI,
          isIMEIValid: product.requiresIMEI ? validateIMEI(serialNumber) : null
        })

      } catch (err: any) {
        errors.push({
          serialNumber: snData.serialNumber || snData,
          error: err.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      added: results.length,
      failed: errors.length,
      serialNumbers: results,
      errors: errors.length > 0 ? errors : undefined
    }, { status: 201 })

  } catch (error) {
    console.error('Add serial numbers error:', error)
    return NextResponse.json({ error: 'Failed to add serial numbers' }, { status: 500 })
  }
}

// PUT - Update serial number (warranty claim, status change)
export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, status, notes, warrantyClaim } = body

    if (!id) {
      return NextResponse.json({ error: 'Serial number ID required' }, { status: 400 })
    }

    const updateData: any = {}
    
    if (status) updateData.status = status
    if (notes) updateData.notes = notes
    
    // Handle warranty claim
    if (warrantyClaim) {
      updateData.metadata = {
        warrantyClaim: {
          date: new Date(),
          reason: warrantyClaim.reason,
          status: warrantyClaim.status || 'PENDING'
        }
      }
    }

    const updated = await prisma.serialNumber.updateMany({
      where: {
        id: id,
        tenantId: user.tenantId
      },
      data: updateData
    })

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Serial number not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Serial number updated successfully'
    })

  } catch (error) {
    console.error('Update serial number error:', error)
    return NextResponse.json({ error: 'Failed to update serial number' }, { status: 500 })
  }
}

// DELETE - Remove serial number
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Serial number ID required' }, { status: 400 })
    }

    const deleted = await prisma.serialNumber.deleteMany({
      where: {
        id: id,
        tenantId: user.tenantId,
        status: 'IN_STOCK' // Only allow deleting unsold items
      }
    })

    if (deleted.count === 0) {
      return NextResponse.json({ 
        error: 'Serial number not found or already sold' 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Serial number deleted successfully'
    })

  } catch (error) {
    console.error('Delete serial number error:', error)
    return NextResponse.json({ error: 'Failed to delete serial number' }, { status: 500 })
  }
}
