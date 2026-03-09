import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get single stock transfer with details
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transfer = await prisma.stockTransfer.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        fromLocation: true,
        toLocation: true,
        items: true
      }
    })

    if (!transfer) {
      return NextResponse.json({ error: 'Stock transfer not found' }, { status: 404 })
    }

    // Fetch product details separately
    const productIds = (transfer as any).items?.map((item: any) => item.productId) || []
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true }
    })
    const productMap = new Map(products.map(p => [p.id, p]))

    // Type cast for response
    const t = transfer as any

    return NextResponse.json({
      stock_transfer: {
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
        approval_notes: t.approvalNotes,
        completed_by: t.completedBy,
        completed_at: t.completedAt,
        created_at: t.createdAt,
        updated_at: t.updatedAt,
        items: (t.items || []).map((item: any) => {
          const product = productMap.get(item.productId)
          return {
            id: item.id,
            product_id: item.productId,
            product_name: product?.name,
            product_sku: product?.sku,
            quantity: item.quantity,
            received_qty: item.receivedQty
          }
        })
      }
    })
  } catch (error) {
    console.error('Get stock transfer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update stock transfer status and handle stock movement
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { status, action, approval_notes } = body

    // Handle approval action
    if (action === 'approve' || action === 'reject') {
      const transfer = await prisma.stockTransfer.findFirst({
        where: { id, tenantId: user.tenantId }
      })

      if (!transfer) {
        return NextResponse.json({ error: 'Stock transfer not found' }, { status: 404 })
      }

      if (transfer.status !== 'PENDING') {
        return NextResponse.json({ error: 'Can only approve or reject pending transfers' }, { status: 400 })
      }

      if (action === 'approve') {
        await prisma.stockTransfer.update({
          where: { id },
          data: {
            approvedBy: user.id,
            approvedAt: new Date(),
            approvalNotes: approval_notes || null,
            status: 'IN_TRANSIT'
          }
        })
        return NextResponse.json({ 
          message: 'Transfer approved successfully',
          status: 'in_transit'
        })
      } else {
        await prisma.stockTransfer.update({
          where: { id },
          data: {
            approvedBy: user.id,
            approvedAt: new Date(),
            approvalNotes: approval_notes || 'Rejected',
            status: 'CANCELLED'
          }
        })
        return NextResponse.json({ 
          message: 'Transfer rejected',
          status: 'cancelled'
        })
      }
    }

    // Handle status update
    if (status) {
      const validStatuses = ['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']
      if (!validStatuses.includes(status.toUpperCase())) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }

      const transfer = await prisma.stockTransfer.findFirst({
        where: { id, tenantId: user.tenantId },
        include: { items: true }
      })

      if (!transfer) {
        return NextResponse.json({ error: 'Stock transfer not found' }, { status: 404 })
      }

      const t = transfer as any
      const newStatus = status.toUpperCase() as 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED'

      // Validate status transitions
      const validTransitions: Record<string, string[]> = {
        'PENDING': ['IN_TRANSIT', 'CANCELLED'],
        'IN_TRANSIT': ['COMPLETED', 'CANCELLED'],
        'COMPLETED': [],
        'CANCELLED': []
      }

      if (!validTransitions[t.status].includes(newStatus)) {
        return NextResponse.json({ 
          error: `Cannot transition from ${t.status} to ${newStatus}` 
        }, { status: 400 })
      }

      // Handle stock movement when completing transfer
      if (newStatus === 'COMPLETED') {
        await prisma.$transaction(async (tx) => {
          // Process each item in the transfer
          for (const item of t.items) {
            // Get or create stock levels for both locations
            const [sourceStock, destStock] = await Promise.all([
              tx.stockLevel.findUnique({
                where: {
                  tenantId_productId_locationId: {
                    tenantId: user.tenantId!,
                    productId: item.productId,
                    locationId: t.fromLocationId
                  }
                }
              }),
              tx.stockLevel.findUnique({
                where: {
                  tenantId_productId_locationId: {
                    tenantId: user.tenantId!,
                    productId: item.productId,
                    locationId: t.toLocationId
                  }
                }
              })
            ])

            // Validate source stock
            if (!sourceStock || sourceStock.quantity < item.quantity) {
              throw new Error(`Insufficient stock for product at source location. Available: ${sourceStock?.quantity || 0}, Requested: ${item.quantity}`)
            }

            // Decrease stock at source
            await tx.stockLevel.update({
              where: {
                tenantId_productId_locationId: {
                  tenantId: user.tenantId!,
                  productId: item.productId,
                  locationId: t.fromLocationId
                }
              },
              data: {
                quantity: { decrement: item.quantity },
                updatedAt: new Date()
              }
            })

            // Increase stock at destination (create if doesn't exist)
            if (destStock) {
              await tx.stockLevel.update({
                where: {
                  tenantId_productId_locationId: {
                    tenantId: user.tenantId!,
                    productId: item.productId,
                    locationId: t.toLocationId
                  }
                },
                data: {
                  quantity: { increment: item.quantity },
                  updatedAt: new Date()
                }
              })
            } else {
              await tx.stockLevel.create({
                data: {
                  tenantId: user.tenantId!,
                  productId: item.productId,
                  locationId: t.toLocationId,
                  quantity: item.quantity,
                  reorderPoint: 0
                }
              })
            }

            // Create inventory events
            await Promise.all([
              tx.inventoryEvent.create({
                data: {
                  tenantId: user.tenantId!,
                  productId: item.productId,
                  locationId: t.fromLocationId,
                  type: 'TRANSFER_OUT',
                  quantityDelta: -item.quantity,
                  runningBalance: sourceStock.quantity - item.quantity,
                  referenceId: t.id,
                  referenceType: 'TRANSFER',
                  notes: `Transfer to location ${t.toLocationId}`,
                  userId: user.id
                }
              }),
              tx.inventoryEvent.create({
                data: {
                  tenantId: user.tenantId!,
                  productId: item.productId,
                  locationId: t.toLocationId,
                  type: 'TRANSFER_IN',
                  quantityDelta: item.quantity,
                  runningBalance: (destStock?.quantity || 0) + item.quantity,
                  referenceId: t.id,
                  referenceType: 'TRANSFER',
                  notes: `Transfer from location ${t.fromLocationId}`,
                  userId: user.id
                }
              })
            ])
          }

          // Update transfer status
          await tx.stockTransfer.update({
            where: { id },
            data: {
              status: newStatus,
              completedBy: user.id,
              completedAt: new Date()
            }
          })
        })
      } else {
        // Just update status for non-complete transitions
        await prisma.stockTransfer.update({
          where: { id },
          data: { status: newStatus }
        })
      }

      const updatedTransfer = await prisma.stockTransfer.findFirst({
        where: { id },
        include: {
          fromLocation: true,
          toLocation: true,
          items: true
        }
      })

      return NextResponse.json({ 
        transfer: updatedTransfer,
        message: `Transfer ${newStatus.toLowerCase()} successfully`
      })
    }

    return NextResponse.json({ error: 'No valid action provided' }, { status: 400 })
  } catch (error) {
    console.error('Update stock transfer error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// PUT - Update stock transfer details
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { from_location_id, to_location_id, priority, notes, items } = body

    // Check if transfer exists
    const existingTransfer = await prisma.stockTransfer.findFirst({
      where: { id, tenantId: user.tenantId },
      include: { items: true }
    })

    if (!existingTransfer) {
      return NextResponse.json({ error: 'Stock transfer not found' }, { status: 404 })
    }

    // Only allow editing pending transfers
    if (existingTransfer.status !== 'PENDING') {
      return NextResponse.json({ error: 'Can only edit pending transfers' }, { status: 400 })
    }

    // Validate locations
    if (from_location_id && from_location_id === to_location_id) {
      return NextResponse.json({ error: 'Source and destination cannot be the same' }, { status: 400 })
    }

    // Validate items if provided
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const quantity = Number(item.quantity)
        if (!item.product_id || isNaN(quantity) || quantity <= 0) {
          return NextResponse.json({ error: 'Invalid item: product_id and positive quantity required' }, { status: 400 })
        }

        // Check stock availability
        if (from_location_id || existingTransfer.fromLocationId) {
          const sourceId = from_location_id || existingTransfer.fromLocationId
          const stock = await prisma.stockLevel.findUnique({
            where: {
              tenantId_productId_locationId: {
                tenantId: user.tenantId,
                productId: item.product_id,
                locationId: sourceId
              }
            }
          })

          if (!stock || stock.quantity < quantity) {
            return NextResponse.json({ 
              error: `Insufficient stock. Available: ${stock?.quantity || 0}, Requested: ${quantity}` 
            }, { status: 400 })
          }
        }
      }
    }

    // Update transfer
    const updateData: any = {}
    if (from_location_id) updateData.fromLocationId = from_location_id
    if (to_location_id) updateData.toLocationId = to_location_id
    if (priority) updateData.priority = priority
    if (notes !== undefined) updateData.notes = notes

    const transfer = await prisma.$transaction(async (tx) => {
      // Update transfer details
      await tx.stockTransfer.update({
        where: { id },
        data: updateData
      })

      // Update items if provided
      if (items && Array.isArray(items)) {
        // Delete existing items
        await tx.stockTransferItem.deleteMany({ where: { transferId: id } })

        // Create new items
        for (const item of items) {
          await tx.stockTransferItem.create({
            data: {
              transferId: id,
              productId: item.product_id,
              quantity: Number(item.quantity)
            }
          })
        }
      }

      // Return updated transfer
      return tx.stockTransfer.findFirst({
        where: { id },
        include: {
          fromLocation: true,
          toLocation: true,
          items: true
        }
      })
    })

    // Fetch product details for response
    const productIds = (transfer as any).items?.map((item: any) => item.productId) || []
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true }
    })
    const productMap = new Map(products.map(p => [p.id, p]))
    
    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
    }

    const t = transfer as any

    return NextResponse.json({ 
      transfer: {
        id: t.id,
        from_location_id: t.fromLocationId,
        to_location_id: t.toLocationId,
        from_location_name: t.fromLocation?.name,
        to_location_name: t.toLocation?.name,
        status: t.status?.toLowerCase(),
        priority: t.priority,
        notes: t.notes,
        items: (t.items || []).map((item: any) => {
          const product = productMap.get(item.productId)
          return {
            id: item.id,
            product_id: item.productId,
            product_name: product?.name,
            product_sku: product?.sku,
            quantity: item.quantity
          }
        })
      },
      message: 'Transfer updated successfully'
    })
  } catch (error) {
    console.error('Update transfer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete stock transfer
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transfer = await prisma.stockTransfer.findFirst({
      where: { id, tenantId: user.tenantId }
    })

    if (!transfer) {
      return NextResponse.json({ error: 'Stock transfer not found' }, { status: 404 })
    }

    if (transfer.status === 'COMPLETED') {
      return NextResponse.json({ 
        error: 'Cannot delete completed transfer. Stock has already been moved.' 
      }, { status: 400 })
    }

    await prisma.stockTransfer.delete({
      where: { id }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Transfer deleted successfully'
    })
  } catch (error) {
    console.error('Delete stock transfer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
