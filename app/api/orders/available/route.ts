import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/app/api/auth/[...nextauth]/route'

export async function GET(req: NextRequest) {
  try {
    // Get session to verify user
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!supabaseAdmin) {
      console.error('[Orders API] Supabase admin client not initialized')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Check if user is a booster
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (!userData || userData.role !== 'booster') {
      return NextResponse.json(
        { error: 'Forbidden - Booster access required' },
        { status: 403 }
      )
    }

    console.log('[Orders API] Fetching available orders for booster:', userData.id)

    // Fetch available orders (pending and not claimed)
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .is('booster_id', null)
      .order('created_at', { ascending: false })
      .limit(50)

    if (ordersError) {
      console.error('[Orders API] Error fetching available orders:', ordersError)
      return NextResponse.json(
        { error: ordersError.message || 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    console.log('[Orders API] Found available orders:', orders?.length || 0)

    return NextResponse.json({
      orders: orders || [],
    }, { status: 200 })
  } catch (error) {
    console.error('[Orders API] Exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

