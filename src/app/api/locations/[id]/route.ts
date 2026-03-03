import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest, requireAuth } from '@/lib/auth'
import { PermissionsService } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const location = await prisma.location.findUnique({
      where: { id: req.url.split('/').pop() }
    })

    if (!location || location.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    return NextResponse.json({ location })
  } catch (error) {
    console.error('Get location error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    let user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load role permissions from database
    user = await PermissionsService.loadUserPermissions(user)

    // Check permission
    const hasPermission = await PermissionsService.canUpdate(user, 'locations')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied. You do not have permission to update locations.' }, { status: 403 })
    }

    const body = await req.json()
    const locationId = req.url.split('/').slice(-2, -1)[0]

    const location = await prisma.location.update({
      where: { id: locationId, tenantId: user.tenantId },
      data: body
    })

    return NextResponse.json({ location })
  } catch (error) {
    console.error('Update location error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    let user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load role permissions from database
    user = await PermissionsService.loadUserPermissions(user)

    // Check permission
    const hasPermission = await PermissionsService.canDelete(user, 'locations')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied. You do not have permission to delete locations.' }, { status: 403 })
    }

    const locationId = req.url.split('/').pop()

    await prisma.location.delete({
      where: { id: locationId, tenantId: user.tenantId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete location error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
