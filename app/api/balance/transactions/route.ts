import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getOrCreateUser } from '@/lib/supabase'
import { auth } from '@/app/api/auth/[...nextauth]/route'

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
      console.error('[Balance Transactions] Failed to get or create user')
      return NextResponse.json(
        { error: 'Failed to initialize user account' },
        { status: 500 }
      )
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const transactionType = searchParams.get('type') // Optional filter by type

    // Build query - handle case where table doesn't exist yet
    let query = supabaseAdmin
      .from('balance_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply type filter if provided
    if (transactionType) {
      query = query.eq('transaction_type', transactionType)
    }

    const { data: transactions, error: transactionsError } = await query

    // If table doesn't exist, return empty array
    if (transactionsError) {
      if (transactionsError.code === '42P01' || transactionsError.message?.includes('does not exist')) {
        console.warn('[Balance Transactions] Table does not exist yet, returning empty array')
        return NextResponse.json({
          transactions: [],
          pagination: {
            total: 0,
            limit,
            offset,
            hasMore: false,
          },
        })
      }
      console.error('[Balance Transactions] Error:', transactionsError)
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('balance_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (transactionType) {
      countQuery = countQuery.eq('transaction_type', transactionType)
    }

    const { count, error: countError } = await countQuery
    
    // If count fails, use transactions length
    const totalCount = countError ? (transactions?.length || 0) : (count || 0)

    return NextResponse.json({
      transactions: transactions || [],
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: totalCount > offset + limit,
      },
    })
  } catch (error: any) {
    console.error('[Balance Transactions] Exception:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

