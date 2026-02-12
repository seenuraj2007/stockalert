import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - List all invoices
export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req)
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        const where: any = { tenantId: user.tenantId }
        if (status && status !== 'all') {
            where.status = status
        }

        const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                include: {
                    customer: true,
                    items: true
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

// POST - Create new invoice
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
            global_discount,
            is_inter_state,
            total_cgst,
            total_sgst,
            total_igst,
            total_gst,
            subtotal,
            total_amount,
            notes,
            customerName,
            customerAddress,
            customerCity,
            customerState,
            customerPincode,
            customerGstNumber
        } = body

        // Get tenant details for business info
        const tenant = await prisma.tenant.findUnique({
            where: { id: user.tenantId }
        })

        if (!tenant) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        // Get tenant settings for GST number
        const tenantSettings = tenant.settings as any || {}

        // Generate invoice number (format: INV-YYYYMMDD-XXX)
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

        // Calculate invoice items with GST
        const invoiceItems = items.map((item: any) => {
            const gstRate = item.gst_rate || 0
            const taxableAmount = item.taxable_amount || ((item.quantity * item.unit_price) - (item.discount || 0))
            
            let cgstRate = 0, sgstRate = 0, igstRate = 0
            let cgstAmount = 0, sgstAmount = 0, igstAmount = 0
            
            if (is_inter_state) {
                // Inter-state: IGST only
                igstRate = gstRate
                igstAmount = item.igst_amount || (taxableAmount * igstRate / 100)
            } else {
                // Intra-state: CGST + SGST (50% each)
                cgstRate = gstRate / 2
                sgstRate = gstRate / 2
                cgstAmount = item.cgst_amount || (taxableAmount * cgstRate / 100)
                sgstAmount = item.sgst_amount || (taxableAmount * sgstRate / 100)
            }

            const itemTotal = taxableAmount + cgstAmount + sgstAmount + igstAmount

            return {
                tenantId: user.tenantId!,
                productId: item.product_id || null,
                description: item.description || 'Product',
                hsnCode: item.hsn_code || null,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                discount: item.discount || 0,
                taxableAmount,
                cgstRate,
                sgstRate,
                igstRate,
                cgstAmount,
                sgstAmount,
                igstAmount,
                totalAmount: itemTotal
            }
        })

        // Ensure tenantId exists
        if (!user.tenantId) {
            return NextResponse.json({ error: 'No organization assigned' }, { status: 400 })
        }

        const tenantId = user.tenantId

        // Use transaction to ensure all operations succeed or fail together
        const result = await prisma.$transaction(async (tx) => {
            // Create invoice first
            const invoice = await tx.invoice.create({
                data: {
                    tenantId: tenantId,
                    customerId: customer_id || null,
                    invoiceNumber,
                    invoiceDate: new Date(),
                    dueDate: null,
                    status: 'PAID',
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
                    subtotal: subtotal || invoiceItems.reduce((sum: number, item: any) => sum + item.taxableAmount, 0),
                    totalCgst: total_cgst || invoiceItems.reduce((sum: number, item: any) => sum + item.cgstAmount, 0),
                    totalSgst: total_sgst || invoiceItems.reduce((sum: number, item: any) => sum + item.sgstAmount, 0),
                    totalIgst: total_igst || invoiceItems.reduce((sum: number, item: any) => sum + item.igstAmount, 0),
                    totalGst: total_gst || invoiceItems.reduce((sum: number, item: any) => sum + item.cgstAmount + item.sgstAmount + item.igstAmount, 0),
                    totalAmount: total_amount || invoiceItems.reduce((sum: number, item: any) => sum + item.totalAmount, 0),
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

            // Reduce stock for each item
            for (const item of items) {
                if (!item.product_id) continue

                // Get the primary location or first available location
                const location = await tx.location.findFirst({
                    where: { 
                        tenantId: tenantId,
                        isActive: true
                    }
                })

                if (!location) {
                    throw new Error('No active location found for stock reduction')
                }

                // Get current stock level
                const stockLevel = await tx.stockLevel.findUnique({
                    where: {
                        tenantId_productId_locationId: {
                            tenantId: tenantId,
                            productId: item.product_id,
                            locationId: location.id
                        }
                    }
                })

                if (!stockLevel) {
                    throw new Error(`Stock not found for product ${item.product_id}`)
                }

                if (stockLevel.quantity < item.quantity) {
                    throw new Error(`Insufficient stock for product ${item.product_id}. Available: ${stockLevel.quantity}, Required: ${item.quantity}`)
                }

                // Update stock level
                await tx.stockLevel.update({
                    where: {
                        tenantId_productId_locationId: {
                            tenantId: tenantId,
                            productId: item.product_id,
                            locationId: location.id
                        }
                    },
                    data: {
                        quantity: {
                            decrement: item.quantity
                        },
                        updatedAt: new Date()
                    }
                })

                // Create inventory event
                await tx.inventoryEvent.create({
                    data: {
                        tenantId: tenantId,
                        productId: item.product_id,
                        locationId: location.id,
                        type: 'STOCK_SOLD',
                        quantityDelta: -item.quantity,
                        runningBalance: stockLevel.quantity - item.quantity,
                        referenceId: invoice.id,
                        referenceType: 'INVOICE',
                        notes: `Sale via invoice ${invoiceNumber}`,
                        userId: user.id
                    }
                })
            }

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
