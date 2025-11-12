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
    const { amount, currency = 'usd', orderData, estimatedTime, boosterId, couponCode } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Validate and apply coupon if provided (do this first to calculate finalAmount)
    let finalAmount = amount
    let discountAmount = 0
    let couponData = null

    if (couponCode) {
      try {
        const couponResponse = await fetch(`${req.nextUrl.origin}/api/coupons/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: couponCode.trim(),
            amount: amount,
          }),
        })

        const couponResult = await couponResponse.json()

        if (couponResult.valid) {
          discountAmount = couponResult.discountAmount
          finalAmount = couponResult.finalAmount
          couponData = couponResult.coupon
          console.log('[PaymentIntent] Coupon applied:', {
            code: couponCode,
            discountAmount,
            finalAmount,
          })
        } else {
          console.warn('[PaymentIntent] Invalid coupon code:', couponCode)
          // Continue with original amount if coupon is invalid
        }
      } catch (error) {
        console.error('[PaymentIntent] Error validating coupon:', error)
        // Continue with original amount if validation fails
      }
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

      // Calculate split: 50% to booster, 50% to platform (based on final amount after coupon)
      const totalAmount = Math.round(finalAmount * 100)
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
      if (orderData.addons) {
        metadata.addons = JSON.stringify(orderData.addons)
      }
    }
    if (estimatedTime) {
      metadata.estimated_time = estimatedTime
    }
    if (couponCode && couponData) {
      metadata.coupon_code = couponCode.trim().toUpperCase()
      metadata.discount_amount = discountAmount.toString()
    }

    // Create PaymentIntent with optional Connect split
    // IMPORTANT: Do NOT specify payment_method_types when using automatic_payment_methods
    // This allows Apple Pay, Google Pay, Link, and other wallet methods to be available
    const paymentIntentData: any = {
      amount: Math.round(finalAmount * 100), // Convert to cents (use finalAmount after coupon discount)
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always', // Enable Apple Pay, Google Pay, and other redirect-based payment methods
      },
      metadata: metadata,
      // Do NOT add payment_method_types - this would restrict available methods
      // Do NOT add payment_method_configuration - use default Stripe account settings
      // Note: Google Pay requires automatic_payment_methods.enabled: true
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

    // Verify payment intent supports wallet methods
    const paymentMethodTypes = paymentIntent.payment_method_types || []
    const hasAutomaticMethods = paymentIntent.automatic_payment_methods?.enabled === true
    
    // Check if Google Pay is explicitly available in PaymentIntent
    const availablePaymentMethodTypes = paymentIntent.payment_method_options || {}
    const googlePayAvailable = hasAutomaticMethods || 
                               paymentMethodTypes.includes('google_pay') ||
                               paymentMethodTypes.includes('card') // Google Pay uses card payment method

    console.log('💰 Payment Intent created:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      originalAmount: amount,
      discountAmount,
      finalAmount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      couponCode: couponCode || null,
      paymentMethodTypes,
      automaticPaymentMethods: hasAutomaticMethods,
      allowRedirects: paymentIntent.automatic_payment_methods?.allow_redirects,
      paymentMethodOptions: availablePaymentMethodTypes,
      allowsApplePay: hasAutomaticMethods || paymentMethodTypes.includes('apple_pay'),
      allowsGooglePay: googlePayAvailable,
      troubleshooting: {
        ifGooglePayNotShowing: [
          '1. Check Stripe Dashboard → Settings → Payment methods → Google Pay is ENABLED in TEST MODE',
          '2. Ensure you are using TEST mode keys (pk_test_...) for localhost',
          '3. Verify Google Pay is enabled for your account region (Settings → Payment methods → Google Pay → Region settings)',
          '4. Check that PaymentIntent has automatic_payment_methods.enabled: true',
          '5. Ensure browser is Chrome/Edge Chromium (not Safari/Firefox)',
          '6. Check browser console for Stripe.js warnings about Google Pay',
        ],
      },
    })

    // Verify configuration supports wallet methods
    if (!hasAutomaticMethods) {
      console.warn('[PaymentIntent] ⚠️ Automatic payment methods not enabled. Apple Pay/Google Pay may not work.')
    }
    
    if (!googlePayAvailable) {
      console.warn('[PaymentIntent] ⚠️ Google Pay may not be available. Check Stripe Dashboard → Settings → Payment methods → Google Pay')
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      couponApplied: !!couponData,
      discountAmount,
      finalAmount,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

