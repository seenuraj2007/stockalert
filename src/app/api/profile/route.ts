import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.displayName,
        role: null,
        status: 'active',
        organization_id: user.tenantId,
        created_at: user.created_at,
        tenantId: user.tenantId,
        metadata: user.metadata
      }
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { full_name } = body

    if (full_name !== undefined) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { name: full_name || null }
        })
      } catch (error) {
        console.error('Update user name error:', error)
      }
    }

    const updatedUser = await getUserFromRequest(req)

    return NextResponse.json({
      user: updatedUser ? {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.displayName,
        role: null,
        status: 'active',
        organization_id: updatedUser.tenantId,
        created_at: updatedUser.created_at,
        tenantId: updatedUser.tenantId,
        metadata: updatedUser.metadata
      } : null
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
