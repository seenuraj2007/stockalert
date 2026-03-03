import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { PermissionsService } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const supplier = await prisma.supplier.findFirst({
      where: { id, tenantId: user.tenantId }
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    return NextResponse.json({ supplier })
  } catch (error) {
    console.error('Get supplier error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load role permissions from database
    user = await PermissionsService.loadUserPermissions(user)

    // Check permission
    const hasPermission = await PermissionsService.canUpdate(user, 'suppliers')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied. You do not have permission to update suppliers.' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    const supplier = await prisma.supplier.updateMany({
      where: { id, tenantId: user.tenantId },
      data: body
    })

    if (supplier.count === 0) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update supplier error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load role permissions from database
    user = await PermissionsService.loadUserPermissions(user)

    // Check permission
    const hasPermission = await PermissionsService.canDelete(user, 'suppliers')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied. You do not have permission to delete suppliers.' }, { status: 403 })
    }

    const { id } = await params

    await prisma.supplier.deleteMany({
      where: { id, tenantId: user.tenantId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete supplier error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
