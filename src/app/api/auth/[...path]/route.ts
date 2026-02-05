import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ user })
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT(req: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PATCH(req: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
