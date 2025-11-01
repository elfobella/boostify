import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-10-29.clover',
})

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = 'usd', orderData, estimatedTime } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
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

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: metadata,
    })

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

