import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-10-29.clover',
})

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'usd', orderData, estimatedTime, boosterId } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // If boosterId provided, validate and get Connect account for split payment
    let transferData = undefined
    let applicationFeeAmount = undefined
    
    if (boosterId) {
      if (!supabaseAdmin) {
        console.error('[PaymentIntent] Supabase admin client not initialized')
        return NextResponse.json(
          { error: 'Server configuration error' },
          { status: 500 }
        )
      }

      // Get booster's Connect account
      const { data: booster, error: boosterError } = await supabaseAdmin
        .from('users')
        .select('stripe_connect_account_id, onboarding_complete, charges_enabled, payouts_enabled')
        .eq('id', boosterId)
        .eq('role', 'booster')
        .single()

      if (boosterError || !booster) {
        console.error('[PaymentIntent] Booster not found:', boosterError)
        return NextResponse.json(
          { error: 'Booster not found' },
          { status: 404 }
        )
      }

      // Validate booster is fully onboarded
      if (!booster.stripe_connect_account_id || !booster.onboarding_complete) {
        console.error('[PaymentIntent] Booster not onboarded:', { 
          hasAccount: !!booster.stripe_connect_account_id,
          isComplete: booster.onboarding_complete 
        })
        return NextResponse.json(
          { error: 'Booster must complete Stripe onboarding first' },
          { status: 400 }
        )
      }

      if (!booster.charges_enabled || !booster.payouts_enabled) {
        console.error('[PaymentIntent] Booster not ready:', {
          chargesEnabled: booster.charges_enabled,
          payoutsEnabled: booster.payouts_enabled
        })
        return NextResponse.json(
          { error: 'Booster is not ready to accept payments yet' },
          { status: 400 }
        )
      }

      // Calculate split: 50% to booster, 50% to platform
      const totalAmount = Math.round(amount * 100)
      applicationFeeAmount = Math.floor(totalAmount * 0.5) // Platform fee
      
      transferData = {
        destination: booster.stripe_connect_account_id,
      }

      console.log('[PaymentIntent] Creating split payment:', {
        totalAmount,
        applicationFeeAmount,
        boosterAmount: totalAmount - applicationFeeAmount,
        destination: booster.stripe_connect_account_id
      })
    }

    // Prepare metadata for the payment intent
    const metadata: Record<string, string> = {}
    if (orderData) {
      metadata.game = orderData.game || 'clash-royale'
      metadata.service_category = orderData.category || ''
      metadata.game_account = orderData.gameAccount || ''
      metadata.current_level = orderData.currentLevel || ''
      metadata.target_level = orderData.targetLevel || ''
    }
    if (estimatedTime) {
      metadata.estimated_time = estimatedTime
    }

    // Create PaymentIntent with optional Connect split
    const paymentIntentData: any = {
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: metadata,
    }

    // Add Connect split if booster provided
    if (transferData && applicationFeeAmount !== undefined) {
      paymentIntentData.application_fee_amount = applicationFeeAmount
      paymentIntentData.transfer_data = transferData
      if (boosterId) {
        metadata.booster_id = boosterId
      }
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData)

    console.log('💰 Payment Intent created:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

