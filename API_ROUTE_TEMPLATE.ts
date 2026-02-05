// DKS StockAlert - API Route Migration Template (Neon Auth + Prisma 7)
//
// MIGRATION INSTRUCTIONS:
// 1. Replace all supabase imports with repository imports
// 2. Use requireAuth() for authentication
// 3. Use tenantId for data isolation
// 4. Use repository classes for data access
//
// OLD PATTERN (Supabase):
// import { getUserFromRequest } from '@/lib/auth'
// import { supabase as globalSupabase } from '@/lib/supabase'
// const user = await getUserFromRequest(req)
// const { data } = await globalSupabase.from('table').select('*')
//
// NEW PATTERN (Neon + Repositories):
// import { requireAuth } from '@/lib/auth'
// import { ProductRepository } from '@/lib/repositories'
// const { userId, tenantId } = await requireAuth(req)
// const repo = new ProductRepository(tenantId, userId)
// const data = await repo.findAll()

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { ProductRepository } from '@/lib/repositories'

export async function GET(req: Request) {
  try {
    // Get authenticated user and tenant
    const { userId, tenantId } = await requireAuth(req)

    // Initialize repository with tenant context
    const repo = new ProductRepository(tenantId, userId)

    // Parse query parameters
    const url = new URL(req.url)
    const category = url.searchParams.get('category')
    const search = url.searchParams.get('search')

    // Fetch data using repository
    const products = await repo.findAll({
      category: category || undefined,
      search: search || undefined,
    })

    // Return response
    return NextResponse.json({ products })
  } catch (error) {
    console.error('API Error:', error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { userId, tenantId } = await requireAuth(req)
    const body = await req.json()

    const repo = new ProductRepository(tenantId, userId)

    const product = await repo.create(body)

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('API Error:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      if (error.message.includes('PRODUCT_CONFLICT')) {
        return NextResponse.json(
          { error: 'Product already exists or version mismatch' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
