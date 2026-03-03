import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { PermissionsService } from '@/lib/permissions'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only owners and admins can unsuspend team members
    if (!PermissionsService.isAdmin(user)) {
      return NextResponse.json({ error: 'Permission denied. Only owners and admins can unsuspend team members.' }, { status: 403 })
    }

    const { id: memberId } = await params

    // Get the member being unsuspended
    const targetMember = await prisma.member.findFirst({
      where: { id: memberId, tenantId: user.tenantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Only unsuspend if currently suspended
    if (targetMember.status !== 'SUSPENDED') {
      return NextResponse.json({ error: 'Member is not suspended' }, { status: 400 })
    }

    const unsuspendedMember = await prisma.member.update({
      where: { id: memberId },
      data: { status: 'ACTIVE' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Member ${unsuspendedMember.user.email} has been reactivated`,
      member: {
        id: unsuspendedMember.id,
        userId: unsuspendedMember.userId,
        email: unsuspendedMember.user.email,
        full_name: unsuspendedMember.user.name,
        role: unsuspendedMember.role,
        status: unsuspendedMember.status,
        invitedBy: unsuspendedMember.invitedBy,
        created_at: unsuspendedMember.createdAt
      }
    })
  } catch (error) {
    console.error('Unsuspend member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
