import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/app/api/auth/[...nextauth]/route'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
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

    console.log('[Chats API] Fetching chat details:', chatId)

    // Fetch chat with relations
    const { data: chat, error: chatError } = await supabaseAdmin
      .from('chats')
      .select(`
        *,
        order:orders(
          id,
          game,
          service_category,
          status
        ),
        customer:users!chats_customer_id_fkey(
          id,
          name,
          email,
          image,
          role
        ),
        booster:users!chats_booster_id_fkey(
          id,
          name,
          email,
          image,
          role
        )
      `)
      .eq('id', chatId)
      .single()

    if (chatError || !chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
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
      chat,
    }, { status: 200 })
  } catch (error) {
    console.error('[Chats API] Exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

