import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/app/api/auth/[...nextauth]/route'

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()

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

    // Check if user is a booster
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (!userData || userData.role !== 'booster') {
      return NextResponse.json(
        { error: 'Forbidden - Booster access required' },
        { status: 403 }
      )
    }

    console.log('[Orders API] Booster claiming order:', { orderId, boosterId: userData.id })

    // First, check if order exists and is available
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

    // Check if order is available (pending and not claimed)
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: `Order is not available (status: ${order.status})` },
        { status: 400 }
      )
    }

    if (order.booster_id) {
      return NextResponse.json(
        { error: 'Order has already been claimed by another booster' },
        { status: 409 }
      )
    }

    // Update order with booster_id and claimed_at
    // Use a transaction-like approach: check again and update atomically
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        booster_id: userData.id,
        claimed_at: new Date().toISOString(),
        status: 'processing', // Change status to processing when claimed
      })
      .eq('id', orderId)
      .eq('status', 'pending')
      .is('booster_id', null) // Only update if still unclaimed
      .select()
      .single()

    if (updateError || !updatedOrder) {
      // Order was claimed by another booster between check and update
      return NextResponse.json(
        { error: 'Order was already claimed by another booster. Please refresh and try again.' },
        { status: 409 }
      )
    }

    console.log('[Orders API] ✅ Order claimed successfully:', updatedOrder.id)

    // ✅ Create payment transaction record for escrow
    const totalAmount = Number(updatedOrder.amount)
    const platformFee = totalAmount * 0.5 // 50%
    const boosterAmount = totalAmount * 0.5 // 50%

    const { data: paymentTransaction, error: paymentError } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        order_id: updatedOrder.id,
        stripe_payment_intent_id: updatedOrder.payment_intent_id,
        customer_id: updatedOrder.user_id,
        booster_id: userData.id,
        total_amount: totalAmount,
        platform_fee: platformFee,
        booster_amount: boosterAmount,
        currency: updatedOrder.currency || 'usd',
        payment_status: 'captured',
      })
      .select()
      .single()

    if (paymentError) {
      console.error('[Orders API] Failed to create payment transaction:', paymentError)
      // Payment transaction failed but order claimed, log warning
    } else {
      console.log('[Orders API] ✅ Payment transaction created:', paymentTransaction.id)
    }

    // ✅ Order başarıyla claim edildi, şimdi chat oluştur veya mevcut chat'i kullan
    // Önce bu customer-booster arasında zaten bir chat var mı kontrol et
    const { data: existingChat } = await supabaseAdmin
      .from('chats')
      .select('id')
      .eq('customer_id', updatedOrder.user_id)
      .eq('booster_id', userData.id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    let chatId = null

    if (existingChat) {
      // Mevcut chat'i kullan, sadece updated_at'i güncelle
      chatId = existingChat.id
      await supabaseAdmin
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', existingChat.id)
      console.log('[Orders API] ✅ Using existing chat:', existingChat.id)
    } else {
      // Yeni chat oluştur
      const { data: chat, error: chatError } = await supabaseAdmin
        .from('chats')
        .insert({
          order_id: updatedOrder.id,
          customer_id: updatedOrder.user_id,
          booster_id: userData.id,
          status: 'active',
        })
        .select()
        .single()

      if (chatError) {
        console.error('[Orders API] Failed to create chat:', chatError)
        // Chat oluşturulamadı ama order claim edildi, warning log
      } else {
        chatId = chat.id
        console.log('[Orders API] ✅ Chat created successfully:', chat.id)
      }
    }

    // İlk sistem mesajını oluştur (chat varsa)
    if (chatId) {
      await supabaseAdmin
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: userData.id,
          content: `I've claimed your order. I'll start working on it soon!`,
          message_type: 'system',
        })
        .then(({ error: msgError }) => {
          if (msgError) {
            console.error('[Orders API] Failed to create initial message:', msgError)
          } else {
            console.log('[Orders API] ✅ Initial message sent')
          }
        })
    }

    return NextResponse.json({
      message: 'Order claimed successfully',
      order: updatedOrder,
      chatId: chatId, // Frontend'e chat ID gönder
    }, { status: 200 })
  } catch (error) {
    console.error('[Orders API] Exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

