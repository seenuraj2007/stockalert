import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// Validation schemas
const createTicketSchema = z.object({
    customerName: z.string().min(1),
    customerPhone: z.string().optional(),
    customerEmail: z.string().email().optional(),
    productId: z.string().uuid().optional(),
    serialNumberId: z.string().uuid().optional(),
    serialNumber: z.string().optional(),
    serviceType: z.enum(['REPAIR', 'REPLACEMENT', 'UPGRADE', 'INSPECTION', 'UNLOCK', 'DATA_RECOVERY', 'OTHER']),
    issueDescription: z.string().min(1),
    estimatedCost: z.number().min(0).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    isWarrantyClaim: z.boolean().default(false),
    estimatedDate: z.string().optional(),
})

const updateTicketSchema = z.object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'DELIVERED', 'CANCELLED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    assignedTo: z.string().optional(),
    resolution: z.string().optional(),
    finalCost: z.number().min(0).optional(),
    internalNotes: z.string().optional(),
})

// Generate ticket number with uniqueness check
async function generateTicketNumber(tenantId: string): Promise<string> {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')

    // Use crypto for better randomness and check uniqueness
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
    const timestamp = date.getTime().toString(36).toUpperCase()
    let ticketNumber = `SRV-${year}${month}-${timestamp}${randomPart}`

    // Ensure uniqueness
    let attempts = 0
    while (attempts < 5) {
        const existing = await prisma.serviceTicket.findFirst({
            where: { tenantId, ticketNumber }
        })
        if (!existing) break

        // Generate new if collision
        const newRandom = Math.random().toString(36).substring(2, 6).toUpperCase()
        ticketNumber = `SRV-${year}${month}-${timestamp}${newRandom}`
        attempts++
    }

    return ticketNumber
}

// GET /api/service-tickets - List service tickets
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser(request)
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const priority = searchParams.get('priority')
        const search = searchParams.get('search')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        const where: Prisma.ServiceTicketWhereInput = { tenantId: user.tenantId }

        if (status && status !== 'all') {
            where.status = status
        }

        if (priority) {
            where.priority = priority
        }

        if (search) {
            where.OR = [
                { ticketNumber: { ilike: `%${search}%` } },
                { customerName: { ilike: `%${search}%` } },
                { customerPhone: { ilike: `%${search}%` } },
                { serialNumber: { ilike: `%${search}%` } },
            ]
        }

        const skip = (page - 1) * limit

        const [tickets, total] = await Promise.all([
            prisma.serviceTicket.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    product: {
                        select: { id: true, name: true, sku: true }
                    },
                    linkedSerial: {
                        select: { id: true, serialNumber: true, status: true }
                    }
                }
            }),
            prisma.serviceTicket.count({ where })
        ])

        // Get stats
        const stats = await prisma.serviceTicket.groupBy({
            by: ['status'],
            where: { tenantId: user.tenantId },
            _count: { status: true }
        })

        const statsMap = stats.reduce((acc, s) => {
            acc[s.status] = s._count.status
            return acc
        }, {} as Record<string, number>)

        return NextResponse.json({
            tickets,
            stats: {
                total,
                pending: statsMap.PENDING || 0,
                inProgress: statsMap.IN_PROGRESS || 0,
                waitingParts: statsMap.WAITING_PARTS || 0,
                completed: statsMap.COMPLETED || 0,
                delivered: statsMap.DELIVERED || 0,
                cancelled: statsMap.CANCELLED || 0,
            },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Get service tickets error:', error)
        return NextResponse.json({ error: 'Failed to fetch service tickets' }, { status: 500 })
    }
}

// POST /api/service-tickets - Create new service ticket
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser(request)
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const data = createTicketSchema.parse(body)

        // Generate ticket number with uniqueness check
        const ticketNumber = await generateTicketNumber(user.tenantId)

        // Check warranty status if serial number provided
        let warrantyStatus: string | null = null
        if (data.serialNumberId) {
            const serial = await prisma.serialNumber.findUnique({
                where: { id: data.serialNumberId }
            })
            if (serial?.warrantyExpiry) {
                warrantyStatus = serial.warrantyExpiry > new Date() ? 'VALID' : 'EXPIRED'
            } else {
                warrantyStatus = 'NO_WARRANTY'
            }
        }

        const ticket = await prisma.serviceTicket.create({
            data: {
                ...data,
                ticketNumber,
                tenantId: user.tenantId,
                warrantyStatus,
                estimatedDate: data.estimatedDate ? new Date(data.estimatedDate) : null,
                createdBy: user.id,
            },
            include: {
                product: {
                    select: { id: true, name: true, sku: true }
                }
            }
        })

        // Update serial number status if provided
        if (data.serialNumberId) {
            await prisma.serialNumber.update({
                where: { id: data.serialNumberId },
                data: { status: 'QUARANTINE' }
            })
        }

        return NextResponse.json({ ticket }, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
        }
        console.error('Create service ticket error:', error)
        return NextResponse.json({ error: 'Failed to create service ticket' }, { status: 500 })
    }
}

// PUT /api/service-tickets - Update service ticket
export async function PUT(request: NextRequest) {
    try {
        const user = await getCurrentUser(request)
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const ticketId = searchParams.get('id')

        if (!ticketId) {
            return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 })
        }

        const body = await request.json()
        const data = updateTicketSchema.parse(body)

        // Check if ticket exists
        const existing = await prisma.serviceTicket.findFirst({
            where: { id: ticketId, tenantId: user.tenantId }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
        }

        // Handle status transitions
        if (data.status) {
            if (data.status === 'COMPLETED') {
                // Update with completedAt
                const updated = await prisma.serviceTicket.update({
                    where: { id: ticketId },
                    data: {
                        ...data,
                        completedAt: new Date()
                    },
                    include: {
                        product: {
                            select: { id: true, name: true, sku: true }
                        }
                    }
                })
                return NextResponse.json({ ticket: updated })
            }

            // If delivering, restore serial number to original or defective status
            if (data.status === 'DELIVERED' && existing.serialNumberId) {
                // Check if it was a warranty claim - if so, mark as defective
                if (existing.isWarrantyClaim) {
                    await prisma.serialNumber.update({
                        where: { id: existing.serialNumberId },
                        data: { status: 'DEFECTIVE' }
                    })
                } else {
                    // Return to stock
                    await prisma.serialNumber.update({
                        where: { id: existing.serialNumberId },
                        data: { status: 'IN_STOCK' }
                    })
                }
            }
        }

        const ticket = await prisma.serviceTicket.update({
            where: { id: ticketId },
            data,
            include: {
                product: {
                    select: { id: true, name: true, sku: true }
                }
            }
        })

        return NextResponse.json({ ticket })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
        }
        console.error('Update service ticket error:', error)
        return NextResponse.json({ error: 'Failed to update service ticket' }, { status: 500 })
    }
}

// DELETE /api/service-tickets - Delete service ticket
export async function DELETE(request: NextRequest) {
    try {
        const user = await getCurrentUser(request)
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const ticketId = searchParams.get('id')

        if (!ticketId) {
            return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 })
        }

        const existing = await prisma.serviceTicket.findFirst({
            where: { id: ticketId, tenantId: user.tenantId }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
        }

        // Restore serial number status if exists
        if (existing.serialNumberId && existing.status !== 'DELIVERED' && existing.status !== 'CANCELLED') {
            await prisma.serialNumber.update({
                where: { id: existing.serialNumberId },
                data: { status: 'IN_STOCK' }
            })
        }

        await prisma.serviceTicket.delete({
            where: { id: ticketId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete service ticket error:', error)
        return NextResponse.json({ error: 'Failed to delete service ticket' }, { status: 500 })
    }
}
