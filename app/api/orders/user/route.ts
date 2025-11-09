import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/app/api/auth/[...nextauth]/route'

export async function GET(req: NextRequest) {
  try {
    // Get session to get user ID
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    if (!supabaseAdmin) {
      console.error('[Orders API] Supabase admin client not initialized')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    console.log('[Orders API] Fetching orders for user:', userId)

    // Get Supabase user ID from users table by email
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email || '')
      .single()

    const supabaseUserId = userData?.id || null

    // Fetch orders by user_id
    let ordersQuery = supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (supabaseUserId) {
      ordersQuery = ordersQuery.eq('user_id', supabaseUserId)
    } else {
      // If user not found in users table, return empty orders
      // This means user hasn't been saved to Supabase yet (guest or new user)
      return NextResponse.json({
        orders: [],
        stats: {
          totalOrders: 0,
          totalSpent: 0,
          activeServices: 0,
        },
      }, { status: 200 })
    }

    const { data: orders, error: ordersError } = await ordersQuery

    if (ordersError) {
      console.error('[Orders API] Error fetching orders:', ordersError)
      return NextResponse.json(
        { error: ordersError.message || 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    console.log('[Orders API] Found orders:', orders?.length || 0)

    const orderIds = orders?.map(order => order.id).filter(Boolean) ?? []
    let feedbackMap: Record<string, any> = {}

    if (orderIds.length > 0) {
      const { data: feedbackList, error: feedbackError } = await supabaseAdmin
        .from('booster_feedback')
        .select('id, order_id, booster_id, customer_id, rating, comment, created_at, updated_at')
        .in('order_id', orderIds)

      if (feedbackError) {
        console.error('[Orders API] Error fetching feedback:', feedbackError)
      } else if (feedbackList) {
        feedbackMap = feedbackList.reduce<Record<string, any>>((acc, feedback) => {
          acc[feedback.order_id] = feedback
          return acc
        }, {})
      }
    }

    const boosterIds = orders
      ?.map(order => order.booster_id)
      .filter((id): id is string => Boolean(id)) ?? []

    let boosterMap: Record<string, { id: string; name: string | null; image: string | null }> = {}
    let boosterSummaryMap: Record<string, { averageRating: number | null; totalFeedbacks: number }> = {}

    if (boosterIds.length > 0) {
      const uniqueBoosterIds = Array.from(new Set(boosterIds))

      const { data: boosters, error: boostersError } = await supabaseAdmin
        .from('users')
        .select('id, name, image')
        .in('id', uniqueBoosterIds)

      if (boostersError) {
        console.error('[Orders API] Error fetching booster profiles:', boostersError)
      } else if (boosters) {
        boosterMap = boosters.reduce<Record<string, { id: string; name: string | null; image: string | null }>>(
          (acc, booster) => {
            acc[booster.id] = {
              id: booster.id,
              name: booster.name ?? null,
              image: booster.image ?? null,
            }
            return acc
          },
          {}
        )
      }

      const { data: boosterRatings, error: ratingsError } = await supabaseAdmin
        .from('booster_feedback')
        .select('booster_id, rating')
        .in('booster_id', uniqueBoosterIds)

      if (ratingsError) {
        console.error('[Orders API] Error fetching booster feedback summaries:', ratingsError)
      } else if (boosterRatings) {
        const summaryAccumulator = new Map<string, { total: number; count: number }>()

        boosterRatings.forEach(entry => {
          if (!entry.booster_id) return
          const ratingValue = typeof entry.rating === 'number' ? Number(entry.rating) : null
          if (ratingValue === null || Number.isNaN(ratingValue)) return

          const current = summaryAccumulator.get(entry.booster_id) || { total: 0, count: 0 }
          current.total += ratingValue
          current.count += 1
          summaryAccumulator.set(entry.booster_id, current)
        })

        summaryAccumulator.forEach((value, boosterId) => {
          boosterSummaryMap[boosterId] = {
            averageRating: Number((value.total / value.count).toFixed(2)),
            totalFeedbacks: value.count,
          }
        })
      }
    }

    // Calculate stats
    const totalOrders = orders?.length || 0
    const totalSpent = orders?.reduce((sum, order) => sum + Number(order.amount || 0), 0) || 0
    const activeServices = orders?.filter(order => 
      order.status === 'pending' || order.status === 'processing'
    ).length || 0

    return NextResponse.json({
      orders: (orders || []).map(order => ({
        ...order,
        booster_profile: order.booster_id ? boosterMap[order.booster_id] || null : null,
        booster_feedback_summary: order.booster_id ? boosterSummaryMap[order.booster_id] || { averageRating: null, totalFeedbacks: 0 } : null,
        feedback: feedbackMap[order.id] || null,
      })),
      stats: {
        totalOrders,
        totalSpent: Number(totalSpent.toFixed(2)),
        activeServices,
      },
    }, { status: 200 })
  } catch (error) {
    console.error('[Orders API] Exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

