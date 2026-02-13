import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get single invoice
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
                items: true
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

// PATCH - Update invoice
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
        const { status, notes, terms, ewayBillNumber, ewayBillDate } = body

        // Check if invoice exists and belongs to tenant
        const existingInvoice = await prisma.invoice.findFirst({
            where: {
                id: resolvedParams.id,
                tenantId: user.tenantId
            }
        })

        if (!existingInvoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        }

        // Update invoice
        const invoice = await prisma.invoice.update({
            where: { id: resolvedParams.id },
            data: {
                status: status || existingInvoice.status,
                notes: notes !== undefined ? notes : existingInvoice.notes,
                terms: terms !== undefined ? terms : existingInvoice.terms,
                ewayBillNumber: ewayBillNumber || existingInvoice.ewayBillNumber,
                ewayBillDate: ewayBillDate ? new Date(ewayBillDate) : existingInvoice.ewayBillDate
            },
            include: {
                customer: true,
                items: true
            }
        })

        return NextResponse.json({ invoice })
    } catch (error) {
        console.error('Update invoice error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE - Delete invoice
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

        // Check if invoice exists and belongs to tenant
        const existingInvoice = await prisma.invoice.findFirst({
            where: {
                id: resolvedParams.id,
                tenantId: user.tenantId
            }
        })

        if (!existingInvoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        }

        // Only allow deleting draft invoices
        if (existingInvoice.status !== 'DRAFT') {
            return NextResponse.json({
                error: 'Only draft invoices can be deleted'
            }, { status: 400 })
        }

        // Delete invoice (items will be deleted due to cascade)
        await prisma.invoice.delete({
            where: { id: resolvedParams.id }
        })

        return NextResponse.json({ message: 'Invoice deleted successfully' })
    } catch (error) {
        console.error('Delete invoice error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
