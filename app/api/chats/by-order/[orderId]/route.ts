import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/app/api/auth/[...nextauth]/route'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

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

    console.log('[Chats API] Fetching chat for order:', orderId)

    // Fetch chat by order_id
    const { data: chat, error: chatError } = await supabaseAdmin
      .from('chats')
      .select('id, order_id, customer_id, booster_id')
      .eq('order_id', orderId)
      .single()

    if (chatError || !chat) {
      return NextResponse.json(
        { error: 'Chat not found for this order' },
        { status: 404 }
      )
    }

    // Check if user has access to this chat
    if (chat.customer_id !== userData.id && chat.booster_id !== userData.id) {
      return NextResponse.json(
        { error: 'Forbidden - Access denied to this chat' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      chatId: chat.id,
    }, { status: 200 })
  } catch (error) {
    console.error('[Chats API] Exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

