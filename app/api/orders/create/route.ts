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

export async function POST(req: NextRequest) {
  try {
    const { paymentIntentId } = await req.json()

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      )
    }

    console.log('[Orders API] Creating order for payment intent:', paymentIntentId)

    // Get session to get user ID
    const session = await auth()
    
    // Get Supabase user ID from users table
    let userId = null
    if (session?.user?.email) {
      if (!supabaseAdmin) {
        console.warn('[Orders API] Supabase admin client not initialized - order will be saved without user_id')
      } else {
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', session.user.email)
          .single()
        
        userId = userData?.id || null
      }
    }

    // Retrieve payment intent from Stripe to get metadata
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment intent is not succeeded' },
        { status: 400 }
      )
    }

    // Extract order data from metadata
    const metadata = paymentIntent.metadata || {}
    
    // If booster_id in metadata (from Connect flow), set status to processing
    // Otherwise keep as pending for legacy claim flow
    const boosterId = metadata.booster_id || null
    const orderStatus = boosterId ? 'processing' : 'pending'
    
    const orderData = {
      user_id: userId,
      booster_id: boosterId,
      payment_intent_id: paymentIntentId,
      game: metadata.game || 'clash-royale',
      service_category: metadata.service_category || '',
      game_account: metadata.game_account || '',
      current_level: metadata.current_level || '',
      target_level: metadata.target_level || '',
      amount: paymentIntent.amount / 100, // Convert from cents to dollars
      currency: paymentIntent.currency,
      estimated_time: metadata.estimated_time || null,
      status: orderStatus,
    }

    console.log('[Orders API] Order data:', orderData)

    if (!supabaseAdmin) {
      console.error('[Orders API] Supabase admin client not initialized')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Check if order already exists
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('payment_intent_id', paymentIntentId)
      .single()

    if (existingOrder) {
      console.log('[Orders API] Order already exists:', existingOrder.id)
      return NextResponse.json(
        { message: 'Order already exists', orderId: existingOrder.id },
        { status: 200 }
      )
    }

    // Create order in Supabase
    const { data: newOrder, error: createError } = await supabaseAdmin
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (createError) {
      console.error('[Orders API] Error creating order:', createError)
      return NextResponse.json(
        { error: createError.message || 'Failed to create order' },
        { status: 500 }
      )
    }

    console.log('[Orders API] ✅ Order created successfully:', newOrder.id)

    // Update order payment_status to 'captured' since payment succeeded
    await supabaseAdmin
      .from('orders')
      .update({ payment_status: 'captured' })
      .eq('id', newOrder.id)

    return NextResponse.json(
      { message: 'Order created successfully', orderId: newOrder.id, order: newOrder },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Orders API] Exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

