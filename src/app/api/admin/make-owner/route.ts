import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { PermissionsService } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!PermissionsService.isOwner(user)) {
      return NextResponse.json({ error: 'Forbidden: Only owners can perform this action' }, { status: 403 })
    }

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Find the user by email
    const targetUser = await prisma.user.findUnique({
      where: { email }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update the member's role to OWNER
    const member = await prisma.member.update({
      where: {
        tenantId_userId: {
          tenantId: user.tenantId!,
          userId: targetUser.id
        }
      },
      data: { role: 'OWNER' }
    })

    return NextResponse.json({ 
      message: 'Role updated successfully',
      member: {
        id: member.id,
        role: member.role,
        userId: member.userId,
        tenantId: member.tenantId
      }
    })
  } catch (error) {
    console.error('Error in make-owner route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
