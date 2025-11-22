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

export async function POST(req: NextRequest) {
  try {
    const { 
      amount, 
      currency = 'usd', 
      orderData, 
      estimatedTime, 
      boosterId, 
      couponCode, 
      paymentMethod = 'card',
      useBalance = false 
    } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
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

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Get or create user in Supabase
    const user = await getOrCreateUser({
      email: session.user.email,
      name: session.user.name || null,
      image: session.user.image || null,
      provider: 'email', // Default, will be updated if OAuth
      providerId: session.user.id || undefined,
    })

    if (!user) {
      console.error('[Balance Use Payment] Failed to get or create user')
      return NextResponse.json(
        { error: 'Failed to initialize user account' },
        { status: 500 }
      )
    }

    // Get user balance
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, balance')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('[Balance Use Payment] Error fetching user:', userError)
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      )
    }

    const userId = user.id
    const currentBalance = parseFloat(userData.balance || '0')

    // Validate and apply coupon if provided
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
        }
      } catch (error) {
        console.error('[Balance Use Payment] Error validating coupon:', error)
      }
    }

    // Calculate how much to use from balance
    let balanceToUse = 0
    let stripeAmount = finalAmount

    if (useBalance && currentBalance > 0) {
      balanceToUse = Math.min(currentBalance, finalAmount)
      stripeAmount = Math.max(0, finalAmount - balanceToUse)
    }

    // If balance covers the full amount, process payment without Stripe
    if (balanceToUse >= finalAmount) {
      // Deduct from balance
      const balanceBefore = currentBalance
      const balanceAfter = balanceBefore - finalAmount

      // Update user balance
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ balance: balanceAfter })
        .eq('id', userId)

      if (updateError) {
        console.error('[Balance Use Payment] Error updating balance:', updateError)
        return NextResponse.json(
          { error: 'Failed to update balance' },
          { status: 500 }
        )
      }

      // Create balance transaction record
      const { data: balanceTransaction } = await supabaseAdmin
        .from('balance_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'payment',
          amount: -finalAmount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description: `Payment for boost order`,
          reference_type: 'order',
          metadata: {
            original_amount: amount,
            discount_amount: discountAmount,
            coupon_code: couponCode || null,
          },
        })
        .select()
        .single()

      // Create order for balance-only payment
      const orderDataToInsert: any = {
        user_id: userId,
        booster_id: boosterId || null,
        payment_intent_id: null,
        payment_method: 'balance',
        balance_used: finalAmount,
        game: orderData?.game || 'clash-royale',
        service_category: orderData?.category || '',
        game_account: orderData?.gameAccount || '',
        current_level: orderData?.currentLevel || '',
        target_level: orderData?.targetLevel || '',
        amount: finalAmount,
        currency: 'usd',
        estimated_time: estimatedTime || null,
        status: boosterId ? 'processing' : 'pending',
        coupon_code: couponCode || null,
        discount_amount: discountAmount,
        addons: orderData?.addons ? (typeof orderData.addons === 'string' ? JSON.parse(orderData.addons) : orderData.addons) : {},
        payment_status: 'captured',
      }

      const { data: newOrder, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert(orderDataToInsert)
        .select()
        .single()

      if (orderError) {
        console.error('[Balance Use Payment] Error creating order:', orderError)
        // Rollback balance deduction
        await supabaseAdmin
          .from('users')
          .update({ balance: balanceBefore })
          .eq('id', userId)
        return NextResponse.json(
          { error: 'Failed to create order' },
          { status: 500 }
        )
      }

      // Update balance transaction with order reference
      if (balanceTransaction && newOrder) {
        await supabaseAdmin
          .from('balance_transactions')
          .update({ reference_id: newOrder.id })
          .eq('id', balanceTransaction.id)
      }

      // If booster is assigned, create chat
      if (boosterId && newOrder.user_id) {
        try {
          const { data: existingChat } = await supabaseAdmin
            .from('chats')
            .select('id')
            .eq('customer_id', newOrder.user_id)
            .eq('booster_id', boosterId)
            .eq('status', 'active')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          let chatId = existingChat?.id ?? null

          if (!chatId) {
            const { data: chat } = await supabaseAdmin
              .from('chats')
              .insert({
                order_id: newOrder.id,
                customer_id: newOrder.user_id,
                booster_id: boosterId,
                status: 'active',
              })
              .select()
              .single()

            chatId = chat?.id ?? null

            if (chatId) {
              await supabaseAdmin
                .from('messages')
                .insert({
                  chat_id: chatId,
                  sender_id: boosterId,
                  content: 'Thanks for choosing us! Your booster has been assigned and will reach out here soon.',
                  message_type: 'system',
                })
            }
          }
        } catch (chatError) {
          console.error('[Balance Use Payment] Error creating chat:', chatError)
        }
      }

      console.log('[Balance Use Payment] ✅ Balance-only order created:', newOrder.id)

      return NextResponse.json({
        success: true,
        paidWithBalance: true,
        balanceUsed: finalAmount,
        stripeAmount: 0,
        balanceAfter,
        paymentIntentId: null,
        clientSecret: null,
        orderId: newOrder.id,
        order: newOrder,
      })
    }

    // If partial balance or no balance, create Stripe payment intent for remaining amount
    // Prepare metadata
    const metadata: Record<string, string> = {
      use_balance: useBalance ? 'true' : 'false',
      balance_used: balanceToUse.toString(),
    }

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

    // Handle booster Connect split if applicable
    let transferData = undefined
    let applicationFeeAmount = undefined

    if (boosterId) {
      const { data: booster, error: boosterError } = await supabaseAdmin
        .from('users')
        .select('stripe_connect_account_id, onboarding_complete, charges_enabled, payouts_enabled')
        .eq('id', boosterId)
        .eq('role', 'booster')
        .single()

      if (!boosterError && booster) {
        if (booster.stripe_connect_account_id && booster.onboarding_complete && 
            booster.charges_enabled && booster.payouts_enabled) {
          const totalAmount = Math.round(stripeAmount * 100)
          applicationFeeAmount = Math.floor(totalAmount * 0.5)
          transferData = {
            destination: booster.stripe_connect_account_id,
          }
          metadata.booster_id = boosterId
        }
      }
    }

    // Create PaymentIntent for remaining amount
    const paymentIntentData: any = {
      amount: Math.round(stripeAmount * 100),
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always',
      },
      metadata: {
        ...metadata,
        selected_payment_method: paymentMethod,
        user_id: userId,
        total_amount: finalAmount.toString(),
        balance_used: balanceToUse.toString(),
      },
    }

    if (paymentMethod === 'crypto') {
      paymentIntentData.payment_method_types = ['crypto']
      paymentIntentData.payment_method_options = {
        crypto: {
          preferred_network: 'ethereum',
          preferred_currency: 'usdc',
        },
      }
      delete paymentIntentData.automatic_payment_methods
    }

    if (transferData && applicationFeeAmount !== undefined) {
      paymentIntentData.application_fee_amount = applicationFeeAmount
      paymentIntentData.transfer_data = transferData
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData)

    // If balance was used, deduct it now (before payment completes)
    if (balanceToUse > 0) {
      const balanceBefore = currentBalance
      const balanceAfter = balanceBefore - balanceToUse

      await supabaseAdmin
        .from('users')
        .update({ balance: balanceAfter })
        .eq('id', userId)

      await supabaseAdmin
        .from('balance_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'payment',
          amount: -balanceToUse,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description: `Partial payment for boost order (balance portion)`,
          reference_id: paymentIntent.id,
          reference_type: 'payment_intent',
          metadata: {
            payment_intent_id: paymentIntent.id,
            stripe_amount: stripeAmount,
            total_amount: finalAmount,
          },
        })
    }

    console.log('[Balance Use Payment] Payment intent created:', {
      paymentIntentId: paymentIntent.id,
      totalAmount: finalAmount,
      balanceUsed: balanceToUse,
      stripeAmount,
      userId,
    })

    return NextResponse.json({
      success: true,
      paidWithBalance: balanceToUse > 0,
      balanceUsed: balanceToUse,
      stripeAmount,
      balanceAfter: balanceToUse > 0 ? currentBalance - balanceToUse : currentBalance,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      couponApplied: !!couponData,
      discountAmount,
      finalAmount,
    })
  } catch (error: any) {
    console.error('[Balance Use Payment] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process payment' },
      { status: 500 }
    )
  }
}

