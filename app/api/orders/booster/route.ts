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

    console.log('[Orders API] Fetching booster orders:', userData.id)

    // Fetch orders claimed by this booster
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('booster_id', userData.id)
      .order('claimed_at', { ascending: false })
      .limit(50)

    if (ordersError) {
      console.error('[Orders API] Error fetching booster orders:', ordersError)
      return NextResponse.json(
        { error: ordersError.message || 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    // Calculate stats
    const totalOrders = orders?.length || 0
    const completedOrders = orders?.filter(order => order.status === 'completed').length || 0
    const activeOrders = orders?.filter(order => 
      order.status === 'pending' || order.status === 'processing'
    ).length || 0
    const totalEarnings = orders?.filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + Number(order.amount || 0), 0) || 0

    console.log('[Orders API] Found booster orders:', totalOrders)

    return NextResponse.json({
      orders: orders || [],
      stats: {
        totalOrders,
        completedOrders,
        activeOrders,
        totalEarnings: Number(totalEarnings.toFixed(2)),
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

