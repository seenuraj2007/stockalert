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

const ADMIN_PERMISSIONS = {
  products: { create: true, read: true, update: true, delete: true, stock_update: true },
  sales: { create: true, read: true, update: true, delete: true },
  customers: { create: true, read: true, update: true, delete: true },
  suppliers: { create: true, read: true, update: true, delete: true },
  purchase_orders: { create: true, read: true, update: true, delete: true, receive: true },
  stock_transfers: { create: true, read: true, update: true, delete: true },
  stock_takes: { create: true, read: true, update: true, delete: true },
  locations: { create: true, read: true, update: true, delete: true },
  reports: { read: true, export: true },
  analytics: { read: true },
  alerts: { read: true, update: true },
  users: { create: true, read: true, update: true, delete: true },
}

const VIEWER_PERMISSIONS = {
  products: { create: false, read: true, update: false, delete: false, stock_update: false },
  sales: { create: false, read: true, update: false, delete: false },
  customers: { create: false, read: true, update: false, delete: false },
  suppliers: { create: false, read: true, update: false, delete: false },
  purchase_orders: { create: false, read: true, update: false, delete: false, receive: false },
  stock_transfers: { create: false, read: true, update: false, delete: false },
  stock_takes: { create: false, read: true, update: false, delete: false },
  locations: { create: false, read: true, update: false, delete: false },
  reports: { read: true, export: false },
  analytics: { read: true },
  alerts: { read: true, update: false },
  users: { create: false, read: false, update: false, delete: false },
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only owner can manage roles
    if (user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only owners can manage roles' }, { status: 403 })
    }

    let roles = await prisma.role.findMany({
      where: { tenantId: user.tenantId },
      include: {
        _count: {
          select: { members: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Auto-create default roles if none exist (for existing tenants)
    if (roles.length === 0) {
      await prisma.role.create({
        data: {
          tenantId: user.tenantId,
          name: 'Admin',
          permissions: ADMIN_PERMISSIONS,
          isDefault: true
        }
      })

      await prisma.role.create({
        data: {
          tenantId: user.tenantId,
          name: 'Viewer',
          permissions: VIEWER_PERMISSIONS,
          isDefault: false
        }
      })

      // Fetch again with created roles
      roles = await prisma.role.findMany({
        where: { tenantId: user.tenantId },
        include: {
          _count: {
            select: { members: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      })
    }

    return NextResponse.json({ roles })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only owner can create roles
    if (user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only owners can create roles' }, { status: 403 })
    }

    const body = await req.json()
    const { name, permissions, isDefault } = body

    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 })
    }

    // Check if role name already exists
    const existingRole = await prisma.role.findFirst({
      where: { tenantId: user.tenantId, name: name.trim() }
    })

    if (existingRole) {
      return NextResponse.json({ error: 'Role with this name already exists' }, { status: 400 })
    }

    // If setting as default, remove default from other roles
    if (isDefault) {
      await prisma.role.updateMany({
        where: { tenantId: user.tenantId, isDefault: true },
        data: { isDefault: false }
      })
    }

    // Merge with default permissions
    const mergedPermissions = { ...DEFAULT_PERMISSIONS, ...permissions }

    const role = await prisma.role.create({
      data: {
        tenantId: user.tenantId,
        name: name.trim(),
        permissions: mergedPermissions,
        isDefault: isDefault || false
      }
    })

    return NextResponse.json({ role }, { status: 201 })
  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
