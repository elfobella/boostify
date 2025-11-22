import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/app/api/auth/[...nextauth]/route'

// Create order for balance-only payments (no Stripe payment intent)
export async function POST(req: NextRequest) {
  try {
    const { orderData, estimatedTime, boosterId, couponCode, balanceUsed, totalAmount } = await req.json()

    if (!orderData || !totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid order data or amount' },
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

    // Get Supabase user ID from users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userId = userData.id
    const boosterIdValue = boosterId || null
    const orderStatus = boosterIdValue ? 'processing' : 'pending'

    // Extract coupon information
    const couponCodeValue = couponCode || null
    const discountAmount = orderData.discountAmount || 0

    let addons: Record<string, any> | null = null
    if (orderData.addons) {
      try {
        addons = typeof orderData.addons === 'string' 
          ? JSON.parse(orderData.addons) 
          : orderData.addons
      } catch (parseError) {
        console.warn('[Orders API] Failed to parse addons:', parseError)
        addons = {}
      }
    }

    const orderDataToInsert = {
      user_id: userId,
      booster_id: boosterIdValue,
      payment_intent_id: null, // No Stripe payment intent for balance payments
      payment_method: 'balance',
      balance_used: balanceUsed || totalAmount,
      game: orderData.game || 'clash-royale',
      service_category: orderData.category || '',
      game_account: orderData.gameAccount || '',
      current_level: orderData.currentLevel || '',
      target_level: orderData.targetLevel || '',
      amount: totalAmount,
      currency: 'usd',
      estimated_time: estimatedTime || null,
      status: orderStatus,
      coupon_code: couponCodeValue,
      discount_amount: discountAmount,
      addons: addons ?? {},
      payment_status: 'captured', // Balance payments are immediately captured
    }

    console.log('[Orders API] Creating balance order:', orderDataToInsert)

    // Create order in Supabase
    const { data: newOrder, error: createError } = await supabaseAdmin
      .from('orders')
      .insert(orderDataToInsert)
      .select()
      .single()

    if (createError) {
      console.error('[Orders API] Error creating balance order:', createError)
      return NextResponse.json(
        { error: createError.message || 'Failed to create order' },
        { status: 500 }
      )
    }

    console.log('[Orders API] ✅ Balance order created successfully:', newOrder.id)

    // If booster is already assigned, ensure chat exists
    if (boosterIdValue && newOrder.user_id) {
      try {
        const { data: existingChat } = await supabaseAdmin
          .from('chats')
          .select('id')
          .eq('customer_id', newOrder.user_id)
          .eq('booster_id', boosterIdValue)
          .eq('status', 'active')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        let chatId = existingChat?.id ?? null

        if (chatId) {
          await supabaseAdmin
            .from('chats')
            .update({ updated_at: new Date().toISOString(), order_id: newOrder.id })
            .eq('id', chatId)
        } else {
          const { data: chat, error: chatError } = await supabaseAdmin
            .from('chats')
            .insert({
              order_id: newOrder.id,
              customer_id: newOrder.user_id,
              booster_id: boosterIdValue,
              status: 'active',
            })
            .select()
            .single()

          if (chatError) {
            console.error('[Orders API] Failed to auto-create chat:', chatError)
          } else {
            chatId = chat?.id ?? null
            console.log('[Orders API] ✅ Auto chat created:', chatId)
          }
        }

        if (chatId) {
          await supabaseAdmin
            .from('messages')
            .insert({
              chat_id: chatId,
              sender_id: boosterIdValue,
              content: 'Thanks for choosing us! Your booster has been assigned and will reach out here soon.',
              message_type: 'system',
            })
        }
      } catch (chatException) {
        console.error('[Orders API] Exception while ensuring chat:', chatException)
      }
    }

    // Record coupon usage if coupon was applied
    if (couponCodeValue && discountAmount > 0) {
      try {
        const { data: coupon } = await supabaseAdmin
          .from('coupons')
          .select('id')
          .eq('code', couponCodeValue.toUpperCase())
          .single()

        if (coupon) {
          const originalAmount = totalAmount + discountAmount

          await supabaseAdmin
            .from('coupon_usages')
            .insert({
              coupon_id: coupon.id,
              user_id: userId,
              order_id: newOrder.id,
              discount_amount: discountAmount,
              original_amount: originalAmount,
              final_amount: totalAmount,
            })

          const { data: currentCoupon } = await supabaseAdmin
            .from('coupons')
            .select('usage_count')
            .eq('id', coupon.id)
            .single()

          if (currentCoupon) {
            await supabaseAdmin
              .from('coupons')
              .update({ usage_count: (currentCoupon.usage_count || 0) + 1 })
              .eq('id', coupon.id)
          }

          console.log('[Orders API] ✅ Coupon usage recorded:', couponCodeValue)
        }
      } catch (error) {
        console.error('[Orders API] Error recording coupon usage:', error)
      }
    }

    return NextResponse.json(
      { message: 'Order created successfully', orderId: newOrder.id, order: newOrder },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[Orders API] Exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

