import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getOrCreateUser } from '@/lib/supabase'
import { auth } from '@/app/api/auth/[...nextauth]/route'

// Get current user balance
export async function GET(req: NextRequest) {
  try {
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
      console.error('[Balance] Failed to get or create user')
      return NextResponse.json(
        { error: 'Failed to initialize user account' },
        { status: 500 }
      )
    }

    // Get user balance and cashback
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('balance, cashback')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('[Balance] Error fetching balance:', userError)
      return NextResponse.json(
        { error: 'Failed to fetch balance' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      balance: parseFloat(userData.balance || '0'),
      cashback: parseFloat(userData.cashback || '0'),
    })
  } catch (error: any) {
    console.error('[Balance] Exception:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

