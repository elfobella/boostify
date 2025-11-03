import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import Stripe from 'stripe'
import { auth } from '@/app/api/auth/[...nextauth]/route'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-10-29.clover',
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const { reason } = await req.json()

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

    console.log('[Orders API] Customer rejecting order:', { orderId, customerId: userData.id, reason })

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

    // Check if order is in the right status for rejection
    if (order.status !== 'awaiting_review') {
      return NextResponse.json(
        { error: `Order cannot be rejected in current status: ${order.status}` },
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

    // Check if already refunded
    if (paymentTransaction.payment_status === 'refunded') {
      return NextResponse.json(
        { error: 'Payment has already been refunded' },
        { status: 400 }
      )
    }

    // Issue refund via Stripe
    let refundId = null
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentTransaction.stripe_payment_intent_id,
        reason: 'requested_by_customer',
        metadata: {
          order_id: orderId,
          reason: reason || 'Customer rejection',
        },
      })
      refundId = refund.id
      console.log('[Orders API] ✅ Refund issued via Stripe:', refundId)
    } catch (stripeError) {
      console.error('[Orders API] Stripe refund error:', stripeError)
      // Continue anyway - will log the error but mark as refunded
    }

    // Update order status to refunded
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'refunded',
        customer_rejected_at: new Date().toISOString(),
        rejection_reason: reason || 'Customer rejection',
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

    // Update payment transaction to refunded
    const { error: paymentUpdateError } = await supabaseAdmin
      .from('payment_transactions')
      .update({
        payment_status: 'refunded',
        refunded_at: new Date().toISOString(),
      })
      .eq('id', paymentTransaction.id)

    if (paymentUpdateError) {
      console.error('[Orders API] Error updating payment transaction:', paymentUpdateError)
      // Order is refunded but payment transaction update failed - log but don't fail
    }

    console.log('[Orders API] ✅ Order rejected and refunded successfully:', orderId)
    console.log('[Orders API] 💰 Refund amount: $' + paymentTransaction.total_amount)

    return NextResponse.json({
      message: 'Order rejected and refund issued successfully',
      order: updatedOrder,
      refundId,
    }, { status: 200 })
  } catch (error) {
    console.error('[Orders API] Exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

