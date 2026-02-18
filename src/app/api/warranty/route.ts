import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get warranty information and claims
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const serialNumber = searchParams.get('serialNumber')
    const productId = searchParams.get('productId')
    const status = searchParams.get('status') // 'valid', 'expired', 'all'
    const daysThreshold = parseInt(searchParams.get('days') || '30')

    // If specific serial number provided, get detailed info
    if (serialNumber) {
      const sn = await prisma.serialNumber.findFirst({
        where: {
          tenantId: user.tenantId,
          OR: [
            { serialNumber: serialNumber },
            { alternateSerial: serialNumber }
          ]
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              sellingPrice: true,
              warrantyMonths: true
            }
          },
          batch: {
            select: {
              batchNumber: true,
              manufacturingDate: true
            }
          }
        }
      })

      if (!sn) {
        return NextResponse.json({ error: 'Serial number not found' }, { status: 404 })
      }

      const isWarrantyValid = sn.warrantyExpiry && sn.warrantyExpiry > new Date()
      const warrantyDaysLeft = sn.warrantyExpiry 
        ? Math.ceil((sn.warrantyExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null

      return NextResponse.json({
        serialNumber: {
          id: sn.id,
          serialNumber: sn.serialNumber,
          alternateSerial: sn.alternateSerial,
          isIMEI: sn.serialNumber.length === 15 && /^\d{15}$/.test(sn.serialNumber),
          product: sn.product,
          batch: sn.batch,
          status: sn.status,
          warrantyMonths: sn.warrantyMonths,
          warrantyExpiry: sn.warrantyExpiry,
          isWarrantyValid,
          warrantyDaysLeft,
          warrantyStatus: isWarrantyValid ? 'VALID' : warrantyDaysLeft && warrantyDaysLeft < 0 ? 'EXPIRED' : 'NO_WARRANTY',
          customerId: sn.customerId,
          soldAt: sn.soldAt,
          invoiceId: sn.invoiceId,
          notes: sn.notes,
          metadata: sn.metadata
        }
      })
    }

    // Get warranty overview for tenant
    const where: any = {
      tenantId: user.tenantId,
      warrantyExpiry: { not: null }
    }

    if (productId) {
      where.productId = productId
    }

    if (status === 'valid') {
      where.warrantyExpiry = { gt: new Date() }
    } else if (status === 'expired') {
      where.warrantyExpiry = { lt: new Date() }
    } else if (status === 'expiring-soon') {
      const thresholdDate = new Date()
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold)
      where.warrantyExpiry = {
        gt: new Date(),
        lte: thresholdDate
      }
    }

    const serials = await prisma.serialNumber.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        }
      },
      orderBy: { warrantyExpiry: 'asc' }
    })

    const now = new Date()
    const formatted = serials.map(sn => {
      const daysLeft = Math.ceil((sn.warrantyExpiry!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return {
        id: sn.id,
        serialNumber: sn.serialNumber,
        product: sn.product,
        warrantyExpiry: sn.warrantyExpiry,
        daysLeft,
        status: sn.status,
        customerId: sn.customerId,
        isExpiringSoon: daysLeft > 0 && daysLeft <= daysThreshold
      }
    })

    // Calculate statistics
    const stats = {
      total: formatted.length,
      valid: formatted.filter(s => s.daysLeft > 0).length,
      expired: formatted.filter(s => s.daysLeft <= 0).length,
      expiringSoon: formatted.filter(s => s.isExpiringSoon).length
    }

    return NextResponse.json({
      warranties: formatted,
      stats,
      threshold: daysThreshold
    })

  } catch (error) {
    console.error('Get warranty info error:', error)
    return NextResponse.json({ error: 'Failed to fetch warranty information' }, { status: 500 })
  }
}

// POST - Register warranty claim
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { serialNumberId, claimType, issue, customerContact, notes } = body

    if (!serialNumberId || !claimType || !issue) {
      return NextResponse.json({ 
        error: 'Serial number ID, claim type, and issue description required' 
      }, { status: 400 })
    }

    // Get serial number details
    const sn = await prisma.serialNumber.findFirst({
      where: {
        id: serialNumberId,
        tenantId: user.tenantId
      },
      include: {
        product: true
      }
    })

    if (!sn) {
      return NextResponse.json({ error: 'Serial number not found' }, { status: 404 })
    }

    // Check if warranty is valid
    const isWarrantyValid = sn.warrantyExpiry && sn.warrantyExpiry > new Date()
    
    if (!isWarrantyValid) {
      return NextResponse.json({
        error: 'Warranty has expired',
        warrantyExpiry: sn.warrantyExpiry,
        canProceed: false
      }, { status: 400 })
    }

    // Update serial number with warranty claim
    const updated = await prisma.serialNumber.update({
      where: { id: serialNumberId },
      data: {
        status: 'QUARANTINE', // Mark as under service
        metadata: {
          ...((sn.metadata as object) || {}),
          warrantyClaim: {
            claimId: `WC-${Date.now()}`,
            claimDate: new Date(),
            claimType,
            issue,
            customerContact,
            notes,
            status: 'PENDING',
            createdBy: user.id
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Warranty claim registered successfully',
      claimId: `WC-${Date.now()}`,
      serialNumber: {
        id: updated.id,
        serialNumber: updated.serialNumber,
        productName: sn.product.name,
        warrantyExpiry: updated.warrantyExpiry
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Register warranty claim error:', error)
    return NextResponse.json({ error: 'Failed to register warranty claim' }, { status: 500 })
  }
}

// PUT - Update warranty claim status
export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { serialNumberId, claimStatus, resolution, repairCost } = body

    if (!serialNumberId || !claimStatus) {
      return NextResponse.json({ 
        error: 'Serial number ID and claim status required' 
      }, { status: 400 })
    }

    const sn = await prisma.serialNumber.findFirst({
      where: {
        id: serialNumberId,
        tenantId: user.tenantId
      }
    })

    if (!sn) {
      return NextResponse.json({ error: 'Serial number not found' }, { status: 404 })
    }

    const currentMetadata = (sn.metadata as any) || {}
    const currentClaim = currentMetadata.warrantyClaim || {}

    const updated = await prisma.serialNumber.update({
      where: { id: serialNumberId },
      data: {
        status: claimStatus === 'RESOLVED' ? 'IN_STOCK' : sn.status,
        metadata: {
          ...currentMetadata,
          warrantyClaim: {
            ...currentClaim,
            status: claimStatus,
            resolution,
            repairCost: repairCost ? parseFloat(repairCost) : null,
            resolvedAt: claimStatus === 'RESOLVED' ? new Date() : null,
            resolvedBy: claimStatus === 'RESOLVED' ? user.id : null
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Warranty claim ${claimStatus.toLowerCase()}`,
      serialNumber: {
        id: updated.id,
        serialNumber: updated.serialNumber,
        status: updated.status
      }
    })

  } catch (error) {
    console.error('Update warranty claim error:', error)
    return NextResponse.json({ error: 'Failed to update warranty claim' }, { status: 500 })
  }
}
