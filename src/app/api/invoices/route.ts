import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - List all invoices with enhanced filtering and search
export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req)
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status')
        const search = searchParams.get('search')
        const customerId = searchParams.get('customerId')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const minAmount = searchParams.get('minAmount')
        const maxAmount = searchParams.get('maxAmount')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        const where: any = { tenantId: user.tenantId }
        
        if (status && status !== 'all') {
            where.status = status.toUpperCase()
        }
        
        if (customerId) {
            where.customerId = customerId
        }

        // Date range filter
        if (startDate || endDate) {
            where.invoiceDate = {}
            if (startDate) {
                where.invoiceDate.gte = new Date(startDate)
            }
            if (endDate) {
                where.invoiceDate.lte = new Date(endDate + 'T23:59:59.999Z')
            }
        }

        // Amount range filter
        if (minAmount || maxAmount) {
            where.totalAmount = {}
            if (minAmount) {
                where.totalAmount.gte = parseFloat(minAmount)
            }
            if (maxAmount) {
                where.totalAmount.lte = parseFloat(maxAmount)
            }
        }

        // Search by invoice number or customer name
        if (search) {
            where.OR = [
                { invoiceNumber: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
                { customerGstNumber: { contains: search, mode: 'insensitive' } }
            ]
        }

        const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                include: {
                    customer: {
                        select: { id: true, name: true, email: true, phone: true }
                    },
                    items: {
                        select: {
                            id: true,
                            description: true,
                            quantity: true,
                            unitPrice: true,
                            totalAmount: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.invoice.count({ where })
        ])

        return NextResponse.json({
            invoices,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Get invoices error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Create new invoice with validation
export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req)
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const {
            customer_id,
            items,
            payment_method,
            global_discount = 0,
            global_discount_type = 'percent',
            is_inter_state = false,
            notes,
            customerName,
            customerAddress,
            customerCity,
            customerState,
            customerPincode,
            customerGstNumber
        } = body

        // Validation
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
        }

        if (!payment_method) {
            return NextResponse.json({ error: 'Payment method is required' }, { status: 400 })
        }

        // Validate each item
        for (const item of items) {
            if (!item.product_id || !item.quantity || item.quantity <= 0) {
                return NextResponse.json({ 
                    error: 'Each item must have a valid product and quantity' 
                }, { status: 400 })
            }
        }

        // Get tenant details
        const tenant = await prisma.tenant.findUnique({
            where: { id: user.tenantId }
        })

        if (!tenant) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        const tenantSettings = tenant.settings as any || {}

        // Generate invoice number
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const lastInvoice = await prisma.invoice.findFirst({
            where: {
                tenantId: user.tenantId,
                invoiceNumber: { startsWith: `INV-${dateStr}` }
            },
            orderBy: { invoiceNumber: 'desc' }
        })

        const sequence = lastInvoice
            ? parseInt(lastInvoice.invoiceNumber.slice(-3)) + 1
            : 1
        const invoiceNumber = `INV-${dateStr}-${sequence.toString().padStart(3, '0')}`

        // Get customer details
        const customer = customer_id
            ? await prisma.customer.findUnique({ where: { id: customer_id } })
            : null

        // Calculate invoice totals
        let subtotal = 0
        let totalGST = 0
        const invoiceItems = items.map((item: any) => {
            const quantity = Number(item.quantity)
            const unitPrice = Number(item.unit_price)
            const itemDiscount = Number(item.discount || 0)
            const gstRate = Number(item.gst_rate || 0)
            
            const itemSubtotal = quantity * unitPrice
            const itemDiscountAmount = global_discount_type === 'percent' 
                ? itemSubtotal * (global_discount / 100)
                : (global_discount / items.length)
            const taxableAmount = itemSubtotal - itemDiscountAmount
            
            let cgstAmount = 0, sgstAmount = 0, igstAmount = 0
            
            if (is_inter_state) {
                igstAmount = taxableAmount * gstRate / 100
            } else {
                cgstAmount = taxableAmount * (gstRate / 2) / 100
                sgstAmount = taxableAmount * (gstRate / 2) / 100
            }
            
            const itemGST = cgstAmount + sgstAmount + igstAmount
            const itemTotal = taxableAmount + itemGST
            
            subtotal += taxableAmount
            totalGST += itemGST
            
            return {
                tenantId: user.tenantId!,
                productId: item.product_id,
                description: item.description || 'Product',
                hsnCode: item.hsn_code || null,
                quantity,
                unitPrice,
                discount: itemDiscount,
                taxableAmount,
                cgstRate: is_inter_state ? 0 : gstRate / 2,
                sgstRate: is_inter_state ? 0 : gstRate / 2,
                igstRate: is_inter_state ? gstRate : 0,
                cgstAmount,
                sgstAmount,
                igstAmount,
                totalAmount: itemTotal
            }
        })

        const totalAmount = subtotal + totalGST
        
        // Determine invoice status and due date based on payment method
        const isCredit = payment_method === 'credit'
        const invoiceStatus = isCredit ? 'ISSUED' : 'PAID'
        const dueDate = isCredit ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null

        // Use transaction to ensure all operations succeed
        const result = await prisma.$transaction(async (tx) => {
            // Validate and reduce stock for each item
            for (const item of items) {
                const location = await tx.location.findFirst({
                    where: { 
                        tenantId: user.tenantId!,
                        isActive: true
                    }
                })

                if (!location) {
                    throw new Error('No active location found')
                }

                const stockLevel = await tx.stockLevel.findUnique({
                    where: {
                        tenantId_productId_locationId: {
                            tenantId: user.tenantId!,
                            productId: item.product_id,
                            locationId: location.id
                        }
                    }
                })

                if (!stockLevel || stockLevel.quantity < item.quantity) {
                    throw new Error(
                        `Insufficient stock for product. Available: ${stockLevel?.quantity || 0}, Required: ${item.quantity}`
                    )
                }

                // Update stock
                await tx.stockLevel.update({
                    where: {
                        tenantId_productId_locationId: {
                            tenantId: user.tenantId!,
                            productId: item.product_id,
                            locationId: location.id
                        }
                    },
                    data: {
                        quantity: { decrement: item.quantity },
                        updatedAt: new Date()
                    }
                })

                // Create inventory event
                await tx.inventoryEvent.create({
                    data: {
                        tenantId: user.tenantId!,
                        productId: item.product_id,
                        locationId: location.id,
                        type: 'STOCK_SOLD',
                        quantityDelta: -item.quantity,
                        runningBalance: stockLevel.quantity - item.quantity,
                        referenceId: 'pending',
                        referenceType: 'INVOICE',
                        notes: `Sale via invoice ${invoiceNumber}`,
                        userId: user.id
                    }
                })
            }

            // Update customer balance for credit payments
            if (isCredit && customer_id) {
                await tx.customer.update({
                    where: { id: customer_id },
                    data: {
                        balance: { increment: totalAmount }
                    }
                })
            }

            // Create invoice
            const invoice = await tx.invoice.create({
                data: {
                    tenantId: user.tenantId!,
                    customerId: customer_id || null,
                    invoiceNumber,
                    invoiceDate: new Date(),
                    dueDate,
                    status: invoiceStatus,
                    businessName: tenant.name,
                    businessAddress: tenantSettings.address || null,
                    businessCity: tenantSettings.city || null,
                    businessState: tenantSettings.state || null,
                    businessPincode: tenantSettings.pincode || null,
                    businessGstNumber: tenantSettings.gstNumber || null,
                    customerName: customerName || customer?.name || 'Walk-in Customer',
                    customerAddress: customerAddress || customer?.address || null,
                    customerCity: customerCity || customer?.city || null,
                    customerState: customerState || customer?.state || null,
                    customerPincode: customerPincode || customer?.pincode || null,
                    customerGstNumber: customerGstNumber || customer?.gstNumber || null,
                    subtotal,
                    totalCgst: invoiceItems.reduce((sum: number, item: any) => sum + item.cgstAmount, 0),
                    totalSgst: invoiceItems.reduce((sum: number, item: any) => sum + item.sgstAmount, 0),
                    totalIgst: invoiceItems.reduce((sum: number, item: any) => sum + item.igstAmount, 0),
                    totalGst: totalGST,
                    totalAmount,
                    notes: notes ? `${notes} | Payment: ${payment_method}` : `Payment: ${payment_method}`,
                    terms: null,
                    items: {
                        create: invoiceItems
                    }
                },
                include: {
                    customer: true,
                    items: true
                }
            })

            // Update inventory events with actual invoice ID
            await tx.inventoryEvent.updateMany({
                where: {
                    tenantId: user.tenantId!,
                    referenceId: 'pending',
                    referenceType: 'INVOICE'
                },
                data: {
                    referenceId: invoice.id
                }
            })

            return invoice
        })

        return NextResponse.json({ 
            invoice: {
                id: result.id,
                invoiceNumber: result.invoiceNumber,
                totalAmount: Number(result.totalAmount),
                invoiceDate: result.invoiceDate,
                items: result.items
            }
        }, { status: 201 })
    } catch (error) {
        console.error('Create invoice error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
