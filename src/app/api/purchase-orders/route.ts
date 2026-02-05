import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserFromRequest, requireAuth } from '@/lib/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function createServiceClient() {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined')
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('tenant_id', user.tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Purchase orders fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ purchaseOrders: data || [] })
  } catch (error) {
    console.error('Purchase orders API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { supplierName, supplierEmail, supplierPhone, items, notes } = body

    if (!supplierName || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate order number
    const orderNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const supabase = createServiceClient()

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitCost), 0)

    const { data, error } = await supabase
      .from('purchase_orders')
      .insert({
        tenant_id: user.tenantId,
        order_number: orderNumber,
        supplier_name: supplierName,
        supplier_email: supplierEmail,
        supplier_phone: supplierPhone,
        total_amount: totalAmount,
        notes: notes,
        ordered_by: user.userId,
        ordered_at: new Date().toISOString(),
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Purchase order creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ purchaseOrder: data }, { status: 201 })
  } catch (error) {
    console.error('Purchase order POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
