import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface RouteParams {
  boosterId: string
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { boosterId } = await params

    if (!boosterId) {
      return NextResponse.json(
        { error: 'Booster ID is required' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      console.error('[Booster Profile API] Supabase admin client not initialized')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const { data: booster, error: boosterError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, image, created_at, role')
      .eq('id', boosterId)
      .single()

    if (boosterError || !booster || booster.role !== 'booster') {
      return NextResponse.json(
        { error: 'Booster not found' },
        { status: 404 }
      )
    }

    const [
      totalOrdersResult,
      completedOrdersResult,
      activeOrdersResult,
    ] = await Promise.all([
      supabaseAdmin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('booster_id', boosterId),
      supabaseAdmin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('booster_id', boosterId)
        .eq('status', 'completed'),
      supabaseAdmin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('booster_id', boosterId)
        .in('status', ['pending', 'processing', 'awaiting_review']),
    ])

    if (totalOrdersResult.error) {
      console.error('[Booster Profile API] Error fetching total orders:', totalOrdersResult.error)
    }

    if (completedOrdersResult.error) {
      console.error('[Booster Profile API] Error fetching completed orders:', completedOrdersResult.error)
    }

    if (activeOrdersResult.error) {
      console.error('[Booster Profile API] Error fetching active orders:', activeOrdersResult.error)
    }

    const totalOrders = totalOrdersResult.count ?? 0
    const completedOrders = completedOrdersResult.count ?? 0
    const activeOrders = activeOrdersResult.count ?? 0

    const { data: earningsData, error: earningsError } = await supabaseAdmin
      .from('orders')
      .select('total_earnings:sum(amount)')
      .eq('booster_id', boosterId)
      .eq('status', 'completed')
      .single()

    if (earningsError) {
      console.error('[Booster Profile API] Error fetching earnings summary:', earningsError)
    }

    const { data: ratingBreakdownData, error: ratingBreakdownError } = await supabaseAdmin
      .from('booster_feedback')
      .select('rating')
      .eq('booster_id', boosterId)

    if (ratingBreakdownError) {
      console.error('[Booster Profile API] Error fetching rating list for breakdown:', ratingBreakdownError)
    }

    const { data: feedbackList, error: feedbackError } = await supabaseAdmin
      .from('booster_feedback')
      .select('id, rating, comment, created_at, order_id, customer_id')
      .eq('booster_id', boosterId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (feedbackError) {
      console.error('[Booster Profile API] Error fetching recent feedback:', feedbackError)
    }

    const feedbackCustomerIds = feedbackList
      ?.map(item => item.customer_id)
      .filter((id): id is string => Boolean(id)) ?? []

    let feedbackCustomerMap: Record<string, { id: string; name: string | null; image: string | null }> = {}

    if (feedbackCustomerIds.length > 0) {
      const uniqueCustomerIds = Array.from(new Set(feedbackCustomerIds))
      const { data: customers, error: customersError } = await supabaseAdmin
        .from('users')
        .select('id, name, image')
        .in('id', uniqueCustomerIds)

      if (customersError) {
        console.error('[Booster Profile API] Error fetching feedback customer profiles:', customersError)
      } else if (customers) {
        feedbackCustomerMap = customers.reduce<Record<string, { id: string; name: string | null; image: string | null }>>(
          (acc, customer) => {
            acc[customer.id] = {
              id: customer.id,
              name: customer.name ?? null,
              image: customer.image ?? null,
            }
            return acc
          },
          {}
        )
      }
    }

    const { data: recentOrders, error: recentOrdersError } = await supabaseAdmin
      .from('orders')
      .select('id, status, amount, currency, created_at, user_id')
      .eq('booster_id', boosterId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentOrdersError) {
      console.error('[Booster Profile API] Error fetching recent orders:', recentOrdersError)
    }

    const recentOrderCustomerIds = recentOrders
      ?.map(order => order.user_id)
      .filter((id): id is string => Boolean(id)) ?? []

    let recentOrderCustomerMap: Record<string, { id: string; name: string | null; image: string | null }> = {}

    if (recentOrderCustomerIds.length > 0) {
      const uniqueIds = Array.from(new Set(recentOrderCustomerIds))
      const { data: customers, error: customersError } = await supabaseAdmin
        .from('users')
        .select('id, name, image')
        .in('id', uniqueIds)

      if (customersError) {
        console.error('[Booster Profile API] Error fetching recent order customers:', customersError)
      } else if (customers) {
        recentOrderCustomerMap = customers.reduce<Record<string, { id: string; name: string | null; image: string | null }>>(
          (acc, customer) => {
            acc[customer.id] = {
              id: customer.id,
              name: customer.name ?? null,
              image: customer.image ?? null,
            }
            return acc
          },
          {}
        )
      }
    }

    const ratingBreakdown = (() => {
      if (!ratingBreakdownData || ratingBreakdownData.length === 0) return []
      const counter = new Map<number, number>()

      ratingBreakdownData.forEach(entry => {
        const value = typeof entry.rating === 'number' ? Number(entry.rating) : null
        if (value === null || Number.isNaN(value)) return
        counter.set(value, (counter.get(value) || 0) + 1)
      })

      return Array.from(counter.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([rating, count]) => ({ rating, count }))
    })()

    const totalFeedbacks = ratingBreakdown.reduce((sum, item) => sum + item.count, 0)
    const averageRating = totalFeedbacks > 0
      ? Number((ratingBreakdown.reduce((sum, item) => sum + item.rating * item.count, 0) / totalFeedbacks).toFixed(2))
      : null

    const recentFeedback = (feedbackList || []).map(feedback => ({
      id: feedback.id,
      rating: feedback.rating,
      comment: feedback.comment,
      created_at: feedback.created_at,
      order_id: feedback.order_id,
      customer: feedback.customer_id ? feedbackCustomerMap[feedback.customer_id] || null : null,
    }))

    const ordersSummary = {
      total: totalOrders ?? 0,
      completed: completedOrders ?? 0,
      active: activeOrders ?? 0,
      totalEarnings: earningsData?.total_earnings ? Number(Number(earningsData.total_earnings).toFixed(2)) : 0,
    }

    const recentOrdersFormatted = (recentOrders || []).map(order => ({
      id: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      created_at: order.created_at,
      customer: order.user_id ? recentOrderCustomerMap[order.user_id] || null : null,
    }))

    return NextResponse.json({
      booster: {
        id: booster.id,
        name: booster.name,
        email: booster.email,
        image: booster.image,
        created_at: booster.created_at,
      },
      stats: {
        orders: ordersSummary,
        feedback: {
          averageRating,
          totalFeedbacks,
          ratingBreakdown,
        },
      },
      recentFeedback,
      recentOrders: recentOrdersFormatted,
    }, { status: 200 })
  } catch (error) {
    console.error('[Booster Profile API] Exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}


