import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

const DEFAULT_PERMISSIONS = {
  products: { create: false, read: true, update: false, delete: false, stock_update: false },
  sales: { create: false, read: true, update: false, delete: false },
  customers: { create: false, read: true, update: false, delete: false },
  suppliers: { create: false, read: true, update: false, delete: false },
  purchase_orders: { create: false, read: true, update: false, delete: false },
  stock_transfers: { create: false, read: true, update: false, delete: false },
  stock_takes: { create: false, read: true, update: false, delete: false },
  locations: { create: false, read: true, update: false, delete: false },
  reports: { read: false, export: false },
  analytics: { read: true },
  alerts: { read: true, update: false },
  users: { create: false, read: false, update: false, delete: false },
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only owners can view roles' }, { status: 403 })
    }

    const { id: roleId } = await params

    const role = await prisma.role.findFirst({
      where: { id: roleId, tenantId: user.tenantId },
      include: {
        _count: {
          select: { members: true }
        }
      }
    })

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json({ role })
  } catch (error) {
    console.error('Error fetching role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only owners can update roles' }, { status: 403 })
    }

    const { id: roleId } = await params
    const body = await req.json()
    const { name, permissions, isDefault } = body

    const existingRole = await prisma.role.findFirst({
      where: { id: roleId, tenantId: user.tenantId }
    })

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Check if name already exists (excluding current role)
    if (name && name.trim() !== existingRole.name) {
      const duplicateRole = await prisma.role.findFirst({
        where: { tenantId: user.tenantId, name: name.trim() }
      })
      if (duplicateRole) {
        return NextResponse.json({ error: 'Role with this name already exists' }, { status: 400 })
      }
    }

    // If setting as default, remove default from other roles
    if (isDefault && !existingRole.isDefault) {
      await prisma.role.updateMany({
        where: { tenantId: user.tenantId, isDefault: true, id: { not: roleId } },
        data: { isDefault: false }
      })
    }

    // Merge permissions with defaults
    const mergedPermissions = {
      ...DEFAULT_PERMISSIONS,
      ...(existingRole.permissions as object),
      ...permissions
    }

    const role = await prisma.role.update({
      where: { id: roleId },
      data: {
        name: name?.trim() || existingRole.name,
        permissions: mergedPermissions,
        isDefault: isDefault !== undefined ? isDefault : existingRole.isDefault
      }
    })

    return NextResponse.json({ role })
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only owners can delete roles' }, { status: 403 })
    }

    const { id: roleId } = await params

    const existingRole = await prisma.role.findFirst({
      where: { id: roleId, tenantId: user.tenantId },
      include: {
        _count: {
          select: { members: true }
        }
      }
    })

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Check if role has members
    if (existingRole._count.members > 0) {
      return NextResponse.json({ 
        error: `Cannot delete role. ${existingRole._count.members} member(s) are assigned to this role.` 
      }, { status: 400 })
    }

    await prisma.role.delete({
      where: { id: roleId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
