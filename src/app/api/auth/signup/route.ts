import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { signUp } from '@/lib/auth'
import { signupSchema } from '@/lib/validators'
import { prisma } from '@/lib/prisma'
import { checkSignupRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const validatedData = signupSchema.parse(await req.json())

    // Check rate limit
    const rateLimit = checkSignupRateLimit(validatedData.email)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many signup attempts. Please try again later.',
          retryAfter: rateLimit.retryAfter
        },
        { 
          status: 429,
          headers: { 'Retry-After': rateLimit.retryAfter.toString() }
        }
      )
    }

    // Use our custom signUp function with Neon auth
    const result = await signUp(validatedData.email, validatedData.password, validatedData.full_name)

    if (!result) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    const { user, token } = result

    // Create tenant for user
    const tenantSlug = `${validatedData.email.split('@')[0]}-${Date.now().toString(36)}`
    const tenant = await prisma.tenant.create({
      data: {
        name: `${validatedData.full_name || validatedData.email.split('@')[0]}'s Business`,
        slug: tenantSlug,
        ownerId: user.id,
        settings: {
          currency: 'USD',
          timezone: 'UTC',
        }
      }
    })

    await prisma.member.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        role: 'OWNER',
        status: 'ACTIVE',
      }
    })

    await prisma.location.create({
      data: {
        tenantId: tenant.id,
        name: 'Default Location',
        type: 'WAREHOUSE',
        address: 'Main warehouse',
        isPrimary: true,
        isActive: true,
      }
    })

    const responseUser = {
      id: user.id,
      email: user.email,
      full_name: user.name,
      organization_id: tenant.id,
      role: 'owner',
      status: 'active',
      created_at: user.created_at,
      tenant_id: tenant.id
    }

    const response = NextResponse.json({ user: responseUser }, { status: 201 })

    // Set session token cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '3')
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
