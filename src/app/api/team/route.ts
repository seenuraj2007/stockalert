import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { getOrganizationSubscription } from '@/lib/subscription'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

// GET /api/team - List team members
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const members = await prisma.member.findMany({
      where: { tenantId: user.tenantId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            name: true,
            createdAt: true
          }
        },
        roleData: true
      },
      orderBy: { createdAt: 'asc' }
    })

    const team = members.map((m: any) => ({
      id: m.id,
      userId: m.userId,
      username: m.user.username,
      email: m.user.email,
      full_name: m.user.name,
      role: m.role,
      roleId: m.roleId,
      roleName: m.roleData?.name || m.role,
      status: m.status,
      created_at: m.createdAt
    }))

    return NextResponse.json({ team })
  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/team - Create team member with username and password
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only owner can create users
    if (user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only owners can create users' }, { status: 403 })
    }

    const body = await req.json()
    const { username, password, full_name, roleId } = body

    // Validate required fields
    if (!username || !password || !roleId) {
      return NextResponse.json({ error: 'Username, password, and role are required' }, { status: 400 })
    }

    // Validate username (alphanumeric and underscores only, 3-30 characters)
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json({ 
        error: 'Username must be 3-30 characters and contain only letters, numbers, and underscores' 
      }, { status: 400 })
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Check subscription and team member limit
    const subscription = await getOrganizationSubscription(user.tenantId)
    const maxTeamMembers = subscription?.plan?.max_team_members || 3

    if (subscription && (subscription.status === 'expired' || subscription.status === 'cancelled')) {
      return NextResponse.json({ error: 'Subscription is not active' }, { status: 403 })
    }

    const memberCount = await prisma.member.count({
      where: { tenantId: user.tenantId }
    })

    if (maxTeamMembers !== -1 && memberCount >= maxTeamMembers) {
      return NextResponse.json({
        error: 'Team member limit reached',
        limit: maxTeamMembers,
        current: memberCount,
        upgradeUrl: '/subscription'
      }, { status: 403 })
    }

    // Check if role exists and belongs to tenant
    const role = await prisma.role.findFirst({
      where: { id: roleId, tenantId: user.tenantId }
    })

    if (!role) {
      return NextResponse.json({ error: 'Invalid role selected' }, { status: 400 })
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    })

    if (existingUser) {
      // Check if user is already in this tenant
      const existingMember = await prisma.member.findFirst({
        where: {
          tenantId: user.tenantId,
          userId: existingUser.id
        }
      })
      
      if (existingMember) {
        return NextResponse.json({ error: 'User already exists in organization' }, { status: 400 })
      }
      
      // Add existing user to tenant with selected role
      await prisma.member.create({
        data: {
          tenantId: user.tenantId,
          userId: existingUser.id,
          roleId: roleId,
          status: 'ACTIVE',
          invitedBy: user.id
        }
      })
      
      return NextResponse.json({
        user: {
          id: existingUser.id,
          username: existingUser.username,
          email: existingUser.email,
          full_name: existingUser.name,
          role: role.name,
          roleId: roleId,
          status: 'ACTIVE',
          message: 'User added to organization'
        }
      }, { status: 201 })
    }

    // Create new user with username and password
    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        name: full_name || null,
        passwordHash: hashedPassword
      }
    })

    // Create member record with selected role
    const member = await prisma.member.create({
      data: {
        tenantId: user.tenantId,
        userId: newUser.id,
        roleId: roleId,
        status: 'ACTIVE',
        invitedBy: user.id
      }
    })

    return NextResponse.json({
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.name,
        role: role.name,
        roleId: roleId,
        status: member.status,
        created_at: member.createdAt,
        message: 'User created successfully. They can now login with their username and password.'
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating team member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
