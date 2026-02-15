import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get single invoice with full details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUserFromRequest(req)
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = await params
        const invoice = await prisma.invoice.findFirst({
            where: {
                id: resolvedParams.id,
                tenantId: user.tenantId
            },
            include: {
                customer: true,
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                imageUrl: true
                            }
                        }
                    }
                }
            }
        })

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        }

        return NextResponse.json({ invoice })
    } catch (error) {
        console.error('Get invoice error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PATCH - Update invoice with validation
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUserFromRequest(req)
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = await params
        const body = await req.json()
        const { status, notes, terms, ewayBillNumber, ewayBillDate, customerNotes } = body

        // Check if invoice exists
        const existingInvoice = await prisma.invoice.findFirst({
            where: {
                id: resolvedParams.id,
                tenantId: user.tenantId
            }
        })

        if (!existingInvoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        }

        // Validate status transitions
        const validStatuses = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']
        if (status && !validStatuses.includes(status.toUpperCase())) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        // Prevent modifying paid/cancelled invoices significantly
        if (existingInvoice.status === 'PAID' && status && status.toUpperCase() !== 'REFUNDED') {
            return NextResponse.json({ 
                error: 'Paid invoices can only be marked as refunded' 
            }, { status: 400 })
        }

        // Update invoice
        const updateData: any = {}
        
        if (status) updateData.status = status.toUpperCase()
        if (notes !== undefined) updateData.notes = notes
        if (terms !== undefined) updateData.terms = terms
        if (ewayBillNumber !== undefined) updateData.ewayBillNumber = ewayBillNumber
        if (ewayBillDate !== undefined) updateData.ewayBillDate = new Date(ewayBillDate)
        if (customerNotes !== undefined) updateData.customerNotes = customerNotes

        const invoice = await prisma.invoice.update({
            where: { id: resolvedParams.id },
            data: updateData,
            include: {
                customer: true,
                items: true
            }
        })

        return NextResponse.json({ 
            invoice,
            message: 'Invoice updated successfully'
        })
    } catch (error) {
        console.error('Update invoice error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE - Delete invoice (with restrictions)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUserFromRequest(req)
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = await params

        // Check if invoice exists
        const existingInvoice = await prisma.invoice.findFirst({
            where: {
                id: resolvedParams.id,
                tenantId: user.tenantId
            }
        })

        if (!existingInvoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        }

        // Only allow deleting draft or cancelled invoices
        if (!['DRAFT', 'CANCELLED'].includes(existingInvoice.status)) {
            return NextResponse.json({
                error: `Cannot delete ${existingInvoice.status.toLowerCase()} invoice. Only draft or cancelled invoices can be deleted.`
            }, { status: 400 })
        }

        // Use transaction to delete invoice and restore stock if needed
        await prisma.$transaction(async (tx) => {
            // If invoice was paid, restore stock
            if (existingInvoice.status === 'PAID') {
                const items = await tx.invoiceItem.findMany({
                    where: { invoiceId: resolvedParams.id }
                })

                for (const item of items) {
                    if (item.productId) {
                        const location = await tx.location.findFirst({
                            where: { tenantId: user.tenantId!, isActive: true }
                        })

                        if (location) {
                            await tx.stockLevel.update({
                                where: {
                                    tenantId_productId_locationId: {
                                        tenantId: user.tenantId!,
                                        productId: item.productId,
                                        locationId: location.id
                                    }
                                },
                                data: {
                                    quantity: { increment: item.quantity }
                                }
                            })
                        }
                    }
                }
            }

            // Delete invoice (items will be deleted via cascade)
            await tx.invoice.delete({
                where: { id: resolvedParams.id }
            })
        })

        return NextResponse.json({ 
            message: 'Invoice deleted successfully'
        })
    } catch (error) {
        console.error('Delete invoice error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
