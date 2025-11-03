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

    console.log('[Orders API] Customer approving order:', { orderId, customerId: userData.id })

    // Fetch order with payment transaction
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

    // Verify customer owns this order
    if (order.user_id !== userData.id) {
      return NextResponse.json(
        { error: 'Forbidden - This order does not belong to you' },
        { status: 403 }
      )
    }

    // Check if order is in the right status for approval
    if (order.status !== 'awaiting_review') {
      return NextResponse.json(
        { error: `Order cannot be approved in current status: ${order.status}` },
        { status: 400 }
      )
    }

    // Fetch payment transaction
    const { data: paymentTransaction } = await supabaseAdmin
      .from('payment_transactions')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (!paymentTransaction) {
      console.error('[Orders API] No payment transaction found for order:', orderId)
      return NextResponse.json(
        { error: 'Payment transaction not found' },
        { status: 404 }
      )
    }

    // Check if already transferred
    if (paymentTransaction.payment_status === 'transferred') {
      return NextResponse.json(
        { error: 'Payment has already been transferred' },
        { status: 400 }
      )
    }

    // Update order status to completed
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'completed',
        customer_approved_at: new Date().toISOString(),
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

    // Update payment transaction to transferred
    const { error: paymentUpdateError } = await supabaseAdmin
      .from('payment_transactions')
      .update({
        payment_status: 'transferred',
        transferred_at: new Date().toISOString(),
        transfer_status: 'paid',
      })
      .eq('id', paymentTransaction.id)

    if (paymentUpdateError) {
      console.error('[Orders API] Error updating payment transaction:', paymentUpdateError)
      // Order is completed but payment transaction update failed - log but don't fail
    }

    console.log('[Orders API] ✅ Order approved successfully:', orderId)
    console.log('[Orders API] 💰 Payment released: Platform fee $' + paymentTransaction.platform_fee + ', Booster amount $' + paymentTransaction.booster_amount)

    // TODO: In production with Stripe Connect, create transfer here
    // For now (MVP), just mark as transferred for manual payout

    return NextResponse.json({
      message: 'Order approved successfully',
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

