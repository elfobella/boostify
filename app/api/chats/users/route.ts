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
          image
        ),
        booster:users!chats_booster_id_fkey(
          id,
          name,
          email,
          image
        )
      `)
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

    return NextResponse.json({
      chats: chats || [],
    }, { status: 200 })
  } catch (error) {
    console.error('[Chats API] Exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

