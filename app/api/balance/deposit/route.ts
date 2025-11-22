import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getOrCreateUser } from '@/lib/supabase'
import Stripe from 'stripe'
import { auth } from '@/app/api/auth/[...nextauth]/route'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-10-29.clover',
})

// Cashback rate: 2.5% (100 USD = 2.5 USD cashback)
const CASHBACK_RATE = 0.025

export async function POST(req: NextRequest) {
  try {
    const { amount } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Minimum deposit amount check (optional, can be removed)
    if (amount < 5) {
      return NextResponse.json(
        { error: 'Minimum deposit amount is $5' },
        { status: 400 }
      )
    }

    // Get session to get user ID
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get Supabase user ID from users table
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Get or create user in Supabase
    console.log('[Balance Deposit] Attempting to get or create user:', {
      email: session.user.email,
      name: session.user.name,
      hasImage: !!session.user.image,
      userId: session.user.id,
    })

    const user = await getOrCreateUser({
      email: session.user.email,
      name: session.user.name || null,
      image: session.user.image || null,
      provider: 'email', // Default, will be updated if OAuth
      providerId: session.user.id || undefined,
    })

    if (!user) {
      console.error('[Balance Deposit] ❌ getOrCreateUser returned null for email:', session.user.email)
      console.error('[Balance Deposit] Check Supabase logs above for details')
      return NextResponse.json(
        { 
          error: 'Failed to initialize user account. Please try again or contact support.',
          details: 'User creation failed. Check server logs for more information.'
        },
        { status: 500 }
      )
    }

    console.log('[Balance Deposit] User found/created:', {
      userId: user.id,
      email: user.email,
      balance: user.balance,
      cashback: user.cashback,
    })

    // Use balance from user object, default to 0 if null/undefined
    const currentBalance = parseFloat((user.balance as any) || '0')

    // Calculate cashback (2.5% of deposit amount)
    const cashbackAmount = Math.round(amount * CASHBACK_RATE * 100) / 100

    // Create Stripe PaymentIntent for deposit
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always',
      },
      metadata: {
        type: 'balance_deposit',
        user_id: user.id,
        user_email: session.user.email,
        deposit_amount: amount.toString(),
        cashback_amount: cashbackAmount.toString(),
      },
    })

    console.log('[Balance Deposit] PaymentIntent created:', {
      paymentIntentId: paymentIntent.id,
      amount,
      cashbackAmount,
      userId: user.id,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      cashbackAmount,
    })
  } catch (error: any) {
    console.error('[Balance Deposit] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create deposit payment' },
      { status: 500 }
    )
  }
}

// Webhook handler for successful deposit payment
export async function handleDepositSuccess(paymentIntentId: string) {
  try {
    if (!supabaseAdmin) {
      console.error('[Balance Deposit] Supabase admin client not initialized')
      return { success: false, error: 'Server configuration error' }
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return { success: false, error: 'Payment not succeeded' }
    }

    const metadata = paymentIntent.metadata || {}
    const userId = metadata.user_id
    const userEmail = metadata.user_email
    const depositAmount = parseFloat(metadata.deposit_amount || '0')
    const cashbackAmount = parseFloat(metadata.cashback_amount || '0')

    console.log('[Balance Deposit] Processing deposit:', {
      paymentIntentId,
      userId,
      userEmail,
      depositAmount,
      cashbackAmount,
      metadata,
    })

    // If userId is missing but we have email, try to get user by email
    let finalUserId = userId
    if (!finalUserId && userEmail) {
      console.log('[Balance Deposit] userId missing, fetching by email:', userEmail)
      const { data: userByEmail } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .single()
      
      if (userByEmail) {
        finalUserId = userByEmail.id
        console.log('[Balance Deposit] Found user by email:', finalUserId)
      }
    }

    if (!finalUserId || depositAmount <= 0) {
      console.error('[Balance Deposit] Invalid metadata or missing user:', {
        userId: finalUserId,
        depositAmount,
        metadata,
      })
      return { success: false, error: 'Invalid payment metadata or user not found' }
    }

    // Check if this deposit was already processed
    const { data: existingTransaction } = await supabaseAdmin
      .from('balance_transactions')
      .select('id')
      .eq('reference_id', paymentIntentId)
      .eq('reference_type', 'payment_intent')
      .single()

    if (existingTransaction) {
      console.log('[Balance Deposit] Deposit already processed:', paymentIntentId)
      return { success: true, message: 'Deposit already processed' }
    }

    // Get current balance
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('balance, cashback')
      .eq('id', finalUserId)
      .single()

    if (userError || !userData) {
      console.error('[Balance Deposit] User not found:', userError)
      return { success: false, error: 'User not found' }
    }

    const balanceBefore = parseFloat(userData.balance || '0')
    const cashbackBefore = parseFloat(userData.cashback || '0')
    const balanceAfter = balanceBefore + depositAmount + cashbackAmount
    const cashbackAfter = cashbackBefore + cashbackAmount

    // Update user balance and cashback
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        balance: balanceAfter,
        cashback: cashbackAfter,
      })
      .eq('id', finalUserId)

    if (updateError) {
      console.error('[Balance Deposit] Error updating balance:', updateError)
      return { success: false, error: 'Failed to update balance' }
    }

    // Create deposit transaction record
    const { error: transactionError } = await supabaseAdmin
      .from('balance_transactions')
      .insert({
        user_id: finalUserId,
        transaction_type: 'deposit',
        amount: depositAmount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        cashback_amount: cashbackAmount,
        description: `Balance deposit of $${depositAmount.toFixed(2)}`,
        reference_id: paymentIntentId,
        reference_type: 'payment_intent',
        metadata: {
          stripe_payment_intent_id: paymentIntentId,
          cashback_rate: CASHBACK_RATE,
        },
      })

    if (transactionError) {
      console.error('[Balance Deposit] Error creating transaction:', transactionError)
      // Don't fail if transaction record fails, balance is already updated
    }

    // Create cashback transaction record
    if (cashbackAmount > 0) {
      await supabaseAdmin
        .from('balance_transactions')
        .insert({
          user_id: finalUserId,
          transaction_type: 'cashback',
          amount: cashbackAmount,
          balance_before: balanceAfter - cashbackAmount,
          balance_after: balanceAfter,
          cashback_amount: cashbackAmount,
          description: `Cashback reward: $${cashbackAmount.toFixed(2)} (2.5% of deposit)`,
          reference_id: paymentIntentId,
          reference_type: 'payment_intent',
          metadata: {
            deposit_amount: depositAmount,
            cashback_rate: CASHBACK_RATE,
          },
        })
    }

    console.log('[Balance Deposit] ✅ Deposit processed successfully:', {
      userId: finalUserId,
      depositAmount,
      cashbackAmount,
      balanceBefore,
      balanceAfter,
    })

    return {
      success: true,
      balanceAfter,
      cashbackAmount,
    }
  } catch (error: any) {
    console.error('[Balance Deposit] Exception:', error)
    return { success: false, error: error.message }
  }
}

