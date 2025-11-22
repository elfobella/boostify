import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-10-29.clover',
})

// Check if a payment intent is a balance deposit
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const paymentIntentId = searchParams.get('paymentIntentId')

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      )
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    const metadata = paymentIntent.metadata || {}
    const isDeposit = metadata.type === 'balance_deposit'

    return NextResponse.json({
      isDeposit,
      metadata,
    })
  } catch (error: any) {
    console.error('[Balance Check Deposit] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

