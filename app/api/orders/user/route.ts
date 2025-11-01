import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/app/api/auth/[...nextauth]/route'

export async function GET(req: NextRequest) {
  try {
    // Get session to get user ID
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    if (!supabaseAdmin) {
      console.error('[Orders API] Supabase admin client not initialized')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    console.log('[Orders API] Fetching orders for user:', userId)

    // Get Supabase user ID from users table by email
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email || '')
      .single()

    const supabaseUserId = userData?.id || null

    // Fetch orders by user_id
    let ordersQuery = supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (supabaseUserId) {
      ordersQuery = ordersQuery.eq('user_id', supabaseUserId)
    } else {
      // If user not found in users table, return empty orders
      // This means user hasn't been saved to Supabase yet (guest or new user)
      return NextResponse.json({
        orders: [],
        stats: {
          totalOrders: 0,
          totalSpent: 0,
          activeServices: 0,
        },
      }, { status: 200 })
    }

    const { data: orders, error: ordersError } = await ordersQuery

    if (ordersError) {
      console.error('[Orders API] Error fetching orders:', ordersError)
      return NextResponse.json(
        { error: ordersError.message || 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    console.log('[Orders API] Found orders:', orders?.length || 0)

    // Calculate stats
    const totalOrders = orders?.length || 0
    const totalSpent = orders?.reduce((sum, order) => sum + Number(order.amount || 0), 0) || 0
    const activeServices = orders?.filter(order => 
      order.status === 'pending' || order.status === 'processing'
    ).length || 0

    return NextResponse.json({
      orders: orders || [],
      stats: {
        totalOrders,
        totalSpent: Number(totalSpent.toFixed(2)),
        activeServices,
      },
    }, { status: 200 })
  } catch (error) {
    console.error('[Orders API] Exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

