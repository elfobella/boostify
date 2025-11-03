import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/app/api/auth/[...nextauth]/route'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

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

    // Get user data
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only boosters can mark orders as complete
    if (userData.role !== 'booster') {
      return NextResponse.json(
        { error: 'Forbidden - Booster access required' },
        { status: 403 }
      )
    }

    console.log('[Orders API] Booster completing order:', { orderId, boosterId: userData.id })

    // Fetch order
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

    // Verify booster owns this order
    if (order.booster_id !== userData.id) {
      return NextResponse.json(
        { error: 'Forbidden - This order does not belong to you' },
        { status: 403 }
      )
    }

    // Check if order is in the right status for completion
    if (order.status !== 'processing') {
      return NextResponse.json(
        { error: `Order cannot be completed in current status: ${order.status}` },
        { status: 400 }
      )
    }

    // Update order status to awaiting_review
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'awaiting_review',
      })
      .eq('id', orderId)
      .select()
      .single()

    if (updateError || !updatedOrder) {
      console.error('[Orders API] Error updating order:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      )
    }

    console.log('[Orders API] ✅ Order marked as complete (awaiting review):', orderId)

    return NextResponse.json({
      message: 'Order completed successfully. Waiting for customer approval.',
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

