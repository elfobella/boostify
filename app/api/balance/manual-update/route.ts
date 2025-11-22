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

// Manual update endpoint - processes any pending deposits for the user
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Get user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', session.user.email)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get all succeeded payment intents for this user from Stripe
    // This is a fallback to process any missed deposits
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
    })

    const userDeposits = paymentIntents.data.filter(pi => {
      const metadata = pi.metadata || {}
      return metadata.type === 'balance_deposit' && 
             (metadata.user_id === user.id || metadata.user_email === user.email) &&
             pi.status === 'succeeded'
    })

    const processedDeposits = []
    const errors = []

    for (const pi of userDeposits) {
      // Check if already processed
      const { data: existing } = await supabaseAdmin
        .from('balance_transactions')
        .select('id')
        .eq('reference_id', pi.id)
        .eq('reference_type', 'payment_intent')
        .eq('transaction_type', 'deposit')
        .maybeSingle()

      if (existing) {
        continue // Already processed
      }

      // Process this deposit
      try {
        const { handleDepositSuccess } = await import('../deposit/route')
        const result = await handleDepositSuccess(pi.id)
        
        if (result.success) {
          processedDeposits.push({
            paymentIntentId: pi.id,
            amount: pi.amount / 100,
            balanceAfter: result.balanceAfter,
          })
        } else {
          errors.push({
            paymentIntentId: pi.id,
            error: result.error,
          })
        }
      } catch (error: any) {
        errors.push({
          paymentIntentId: pi.id,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: processedDeposits.length,
      processedDeposits,
      errors,
    })
  } catch (error: any) {
    console.error('[Balance Manual Update] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

