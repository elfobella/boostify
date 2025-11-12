import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/app/api/auth/[...nextauth]/route'

export async function GET(req: NextRequest) {
  try {
    // Get session to verify user
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!supabaseAdmin) {
      console.error('[Chats API] Supabase admin client not initialized')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Get user data
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('[Chats API] Fetching user chats:', userData.id)

    // Fetch chats for this user (customer or booster)
    const { data: chats, error: chatsError } = await supabaseAdmin
      .from('chats')
      .select('*')
      .or(`customer_id.eq.${userData.id},booster_id.eq.${userData.id}`)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (chatsError) {
      console.error('[Chats API] Error fetching chats:', chatsError)
      return NextResponse.json(
        { error: chatsError.message || 'Failed to fetch chats' },
        { status: 500 }
      )
    }

    const chatsList = chats || []

    const orderIds = Array.from(new Set(chatsList.map(chat => chat.order_id).filter(Boolean)))
    const userIds = Array.from(new Set(
      chatsList.flatMap(chat => [chat.customer_id, chat.booster_id]).filter(Boolean)
    ))
    const chatIds = Array.from(new Set(chatsList.map(chat => chat.id).filter(Boolean)))

    const [ordersResult, usersResult] = await Promise.all([
      orderIds.length > 0
        ? supabaseAdmin
            .from('orders')
            .select('id, game, service_category, status')
            .in('id', orderIds)
        : Promise.resolve({ data: [], error: null }),
      userIds.length > 0
        ? supabaseAdmin
            .from('users')
            .select('id, name, email, image')
            .in('id', userIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    const ordersData = ordersResult.data || []
    const usersData = usersResult.data || []

    if (ordersResult.error) {
      console.error('[Chats API] Error hydrating orders:', ordersResult.error)
    }

    if (usersResult.error) {
      console.error('[Chats API] Error hydrating users:', usersResult.error)
    }

    const orderMap = new Map(ordersData.map(order => [order.id, order]))
    const userMap = new Map(usersData.map(user => [user.id, user]))

    let lastMessageMap = new Map<string, any>()
    let unreadCount = 0

    if (chatIds.length > 0) {
      const { data: latestMessages, error: latestMessagesError } = await supabaseAdmin
        .from('messages')
        .select('id, chat_id, sender_id, content, created_at, read_at')
        .in('chat_id', chatIds)
        .order('created_at', { ascending: false })

      if (latestMessagesError) {
        console.error('[Chats API] Error hydrating latest messages:', latestMessagesError)
      } else if (latestMessages) {
        for (const message of latestMessages) {
          if (!lastMessageMap.has(message.chat_id)) {
            lastMessageMap.set(message.chat_id, message)
            if (message.sender_id && message.sender_id !== userData.id && !message.read_at) {
              unreadCount += 1
            }
          }
        }
      }
    }

    const hydratedChats = chatsList.map(chat => ({
      ...chat,
      order: chat.order_id ? orderMap.get(chat.order_id) || null : null,
      customer: chat.customer_id ? userMap.get(chat.customer_id) || null : null,
      booster: chat.booster_id ? userMap.get(chat.booster_id) || null : null,
      lastMessage: lastMessageMap.get(chat.id) || null,
    }))
 
    return NextResponse.json({
      chats: hydratedChats,
      unreadCount,
    }, { status: 200 })
  } catch (error) {
    console.error('[Chats API] Exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

