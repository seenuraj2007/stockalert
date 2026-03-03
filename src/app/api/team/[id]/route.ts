import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: memberId } = await params

    const member = await prisma.member.findFirst({
      where: { id: memberId, tenantId: user.tenantId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            name: true
          }
        },
        roleData: true
      }
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    return NextResponse.json({
      member: {
        id: member.id,
        userId: member.userId,
        username: member.user.username,
        email: member.user.email,
        full_name: member.user.name,
        role: member.role,
        roleId: member.roleId,
        roleName: member.roleData?.name || member.role,
        status: member.status,
        invitedBy: member.invitedBy,
        created_at: member.createdAt
      }
    })
  } catch (error) {
    console.error('Get member error:', error)
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

    // Only owner can update team members
    if (user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only owners can update team members.' }, { status: 403 })
    }

    const { id: memberId } = await params
    const body = await req.json()
    const { roleId } = body

    // Get the member being updated
    const targetMember = await prisma.member.findFirst({
      where: { id: memberId, tenantId: user.tenantId }
    })

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Prevent modifying yourself
    if (targetMember.userId === user.id) {
      return NextResponse.json({ error: 'Cannot modify your own role.' }, { status: 400 })
    }

    // Validate role if provided
    if (roleId) {
      const role = await prisma.role.findFirst({
        where: { id: roleId, tenantId: user.tenantId }
      })

      if (!role) {
        return NextResponse.json({ error: 'Invalid role selected' }, { status: 400 })
      }
    }

    const updatedMember = await prisma.member.update({
      where: { id: memberId },
      data: { roleId: roleId || null },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            name: true
          }
        },
        roleData: true
      }
    })

    return NextResponse.json({
      member: {
        id: updatedMember.id,
        userId: updatedMember.userId,
        username: updatedMember.user.username,
        email: updatedMember.user.email,
        full_name: updatedMember.user.name,
        role: updatedMember.role,
        roleId: updatedMember.roleId,
        roleName: updatedMember.roleData?.name || updatedMember.role,
        status: updatedMember.status,
        invitedBy: updatedMember.invitedBy,
        created_at: updatedMember.createdAt
      }
    })
  } catch (error) {
    console.error('Update member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('DELETE /api/team/[id] called')
    const user = await getUserFromRequest(req)
    console.log('User:', user?.id, 'Role:', user?.role, 'Tenant:', user?.tenantId)
    
    if (!user || !user.tenantId) {
      console.log('Unauthorized - no user or tenant')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only owners can remove team members
    if (user.role !== 'OWNER') {
      console.log('Forbidden - user is not OWNER, role is:', user.role)
      return NextResponse.json({ error: 'Only owners can remove team members.' }, { status: 403 })
    }

    const { id: memberId } = await params

    // Get the member being deleted
    const targetMember = await prisma.member.findFirst({
      where: { id: memberId, tenantId: user.tenantId }
    })

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Prevent removing yourself
    if (targetMember.userId === user.id) {
      return NextResponse.json({ error: 'Cannot remove yourself. Ask another owner to remove you.' }, { status: 400 })
    }

    await prisma.member.delete({
      where: { id: memberId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
