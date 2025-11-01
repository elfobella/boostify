import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/app/api/auth/[...nextauth]/route'

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

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

    console.log('[Orders API] Booster claiming order:', { orderId, boosterId: userData.id })

    // First, check if order exists and is available
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if order is available (pending and not claimed)
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: `Order is not available (status: ${order.status})` },
        { status: 400 }
      )
    }

    if (order.booster_id) {
      return NextResponse.json(
        { error: 'Order has already been claimed by another booster' },
        { status: 409 }
      )
    }

    // Update order with booster_id and claimed_at
    // Use a transaction-like approach: check again and update atomically
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        booster_id: userData.id,
        claimed_at: new Date().toISOString(),
        status: 'processing', // Change status to processing when claimed
      })
      .eq('id', orderId)
      .eq('status', 'pending')
      .is('booster_id', null) // Only update if still unclaimed
      .select()
      .single()

    if (updateError || !updatedOrder) {
      // Order was claimed by another booster between check and update
      return NextResponse.json(
        { error: 'Order was already claimed by another booster. Please refresh and try again.' },
        { status: 409 }
      )
    }

    console.log('[Orders API] ✅ Order claimed successfully:', updatedOrder.id)

    return NextResponse.json({
      message: 'Order claimed successfully',
      order: updatedOrder,
    }, { status: 200 })
  } catch (error) {
    console.error('[Orders API] Exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

