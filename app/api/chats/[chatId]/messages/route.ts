import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/app/api/auth/[...nextauth]/route'

// GET: Fetch messages for a chat
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
      console.error('[Messages API] Supabase admin client not initialized')
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

    console.log('[Messages API] Fetching messages for chat:', chatId)

    // First verify user has access to this chat
    const { data: chat } = await supabaseAdmin
      .from('chats')
      .select('id, customer_id, booster_id')
      .eq('id', chatId)
      .single()

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      )
    }

    if (chat.customer_id !== userData.id && chat.booster_id !== userData.id) {
      return NextResponse.json(
        { error: 'Forbidden - Access denied to this chat' },
        { status: 403 }
      )
    }

    // Fetch messages
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(
          id,
          name,
          email,
          image,
          role
        )
      `)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (messagesError) {
      console.error('[Messages API] Error fetching messages:', messagesError)
      return NextResponse.json(
        { error: messagesError.message || 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      messages: messages || [],
    }, { status: 200 })
  } catch (error) {
    console.error('[Messages API] Exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Send a message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params
    const { content, message_type = 'text' } = await req.json()

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      )
    }

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Message content is required' },
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
      console.error('[Messages API] Supabase admin client not initialized')
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

    console.log('[Messages API] Sending message to chat:', chatId)

    // First verify user has access to this chat
    const { data: chat } = await supabaseAdmin
      .from('chats')
      .select('id, customer_id, booster_id')
      .eq('id', chatId)
      .single()

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      )
    }

    if (chat.customer_id !== userData.id && chat.booster_id !== userData.id) {
      return NextResponse.json(
        { error: 'Forbidden - Access denied to this chat' },
        { status: 403 }
      )
    }

    // Insert message
    const { data: message, error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: userData.id,
        content: content.trim(),
        message_type: message_type,
      })
      .select(`
        *,
        sender:users!messages_sender_id_fkey(
          id,
          name,
          email,
          image,
          role
        )
      `)
      .single()

    if (messageError) {
      console.error('[Messages API] Error sending message:', messageError)
      return NextResponse.json(
        { error: messageError.message || 'Failed to send message' },
        { status: 500 }
      )
    }

    // Update chat's updated_at timestamp
    await supabaseAdmin
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId)

    console.log('[Messages API] ✅ Message sent successfully:', message.id)

    return NextResponse.json({
      message,
    }, { status: 201 })
  } catch (error) {
    console.error('[Messages API] Exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

