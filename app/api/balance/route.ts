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
    // Try to select balance/cashback, but handle case where columns don't exist yet
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('balance, cashback')
      .eq('id', user.id)
      .maybeSingle()

    // If columns don't exist, return default values
    if (userError && userError.code !== 'PGRST116') {
      console.warn('[Balance] Error fetching balance (columns might not exist):', userError.message)
      // Try without balance/cashback columns
      const { data: userWithoutBalance } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()
      
      if (userWithoutBalance) {
        return NextResponse.json({
          balance: 0,
          cashback: 0,
        })
      }
    }

    if (!userData) {
      // User exists but balance columns might not exist - return defaults
      return NextResponse.json({
        balance: 0,
        cashback: 0,
      })
    }

    return NextResponse.json({
      balance: parseFloat((userData.balance as any) || '0'),
      cashback: parseFloat((userData.cashback as any) || '0'),
    })
  } catch (error: any) {
    console.error('[Balance] Exception:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

