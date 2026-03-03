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

    // Only owners and admins can suspend team members
    if (!PermissionsService.isAdmin(user)) {
      return NextResponse.json({ error: 'Permission denied. Only owners and admins can suspend team members.' }, { status: 403 })
    }

    const { id: memberId } = await params

    // Get the member being suspended
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

    // Prevent suspending yourself
    if (targetMember.userId === user.id) {
      return NextResponse.json({ error: 'Cannot suspend yourself.' }, { status: 400 })
    }

    // Prevent non-owners from suspending owners
    if (targetMember.role === 'OWNER' && !PermissionsService.isOwner(user)) {
      return NextResponse.json({ error: 'Permission denied. Only owners can suspend owner accounts.' }, { status: 403 })
    }

    const suspendedMember = await prisma.member.update({
      where: { id: memberId },
      data: { status: 'SUSPENDED' },
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
      message: `Member ${suspendedMember.user.email} has been suspended`,
      member: {
        id: suspendedMember.id,
        userId: suspendedMember.userId,
        email: suspendedMember.user.email,
        full_name: suspendedMember.user.name,
        role: suspendedMember.role,
        status: suspendedMember.status,
        invitedBy: suspendedMember.invitedBy,
        created_at: suspendedMember.createdAt
      }
    })
  } catch (error) {
    console.error('Suspend member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
