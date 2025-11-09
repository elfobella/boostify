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
      console.error('[Orders API] Supabase admin client not initialized')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Check if user is a booster
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (!userData || userData.role !== 'booster') {
      return NextResponse.json(
        { error: 'Forbidden - Booster access required' },
        { status: 403 }
      )
    }

    console.log('[Orders API] Fetching booster orders:', userData.id)

    // Fetch orders claimed by this booster
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('booster_id', userData.id)
      .order('claimed_at', { ascending: false })
      .limit(50)

    if (ordersError) {
      console.error('[Orders API] Error fetching booster orders:', ordersError)
      return NextResponse.json(
        { error: ordersError.message || 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    const customerIds = orders
      ?.map(order => order.user_id)
      .filter((id): id is string => Boolean(id)) ?? []

    const orderIds = orders?.map(order => order.id).filter(Boolean) ?? []

    let customerMap: Record<string, { id: string; name: string | null; email: string | null; image: string | null }> = {}

    if (customerIds.length > 0) {
      const uniqueCustomerIds = Array.from(new Set(customerIds))
      const { data: customers, error: customersError } = await supabaseAdmin
        .from('users')
        .select('id, name, email, image')
        .in('id', uniqueCustomerIds)

      if (customersError) {
        console.error('[Orders API] Error fetching customer profiles:', customersError)
      } else if (customers) {
        customerMap = customers.reduce<Record<string, { id: string; name: string | null; email: string | null; image: string | null }>>(
          (acc, customer) => {
            acc[customer.id] = {
              id: customer.id,
              name: customer.name ?? null,
              email: customer.email ?? null,
              image: customer.image ?? null,
            }
            return acc
          },
          {}
        )
      }
    }

    let orderFeedbackMap: Record<string, { rating: number | null; comment: string | null; created_at: string | null; customer_id: string | null }> = {}

    if (orderIds.length > 0) {
      const { data: orderFeedback, error: orderFeedbackError } = await supabaseAdmin
        .from('booster_feedback')
        .select('order_id, rating, comment, created_at, customer_id')
        .in('order_id', orderIds)

      if (orderFeedbackError) {
        console.error('[Orders API] Error fetching order feedback:', orderFeedbackError)
      } else if (orderFeedback) {
        orderFeedbackMap = orderFeedback.reduce<Record<string, { rating: number | null; comment: string | null; created_at: string | null; customer_id: string | null }>>(
          (acc, feedback) => {
            acc[feedback.order_id] = {
              rating: feedback.rating ?? null,
              comment: feedback.comment ?? null,
              created_at: feedback.created_at ?? null,
              customer_id: feedback.customer_id ?? null,
            }
            return acc
          },
          {}
        )
      }
    }

    let feedbackStats: { averageRating: number | null; totalFeedbacks: number } = {
      averageRating: null,
      totalFeedbacks: 0,
    }

    const { data: boosterFeedback, error: feedbackError } = await supabaseAdmin
      .from('booster_feedback')
      .select('rating')
      .eq('booster_id', userData.id)

    if (feedbackError) {
      console.error('[Orders API] Error fetching booster feedback summary:', feedbackError)
    } else if (boosterFeedback) {
      const ratings = boosterFeedback
        .map(item => (typeof item.rating === 'number' ? Number(item.rating) : null))
        .filter((rating): rating is number => rating !== null && !Number.isNaN(rating))

      if (ratings.length > 0) {
        const sum = ratings.reduce((acc, rating) => acc + rating, 0)
        feedbackStats = {
          averageRating: Number((sum / ratings.length).toFixed(2)),
          totalFeedbacks: ratings.length,
        }
      } else {
        feedbackStats = {
          averageRating: null,
          totalFeedbacks: 0,
        }
      }
    }

    // Calculate stats
    const totalOrders = orders?.length || 0
    const completedOrders = orders?.filter(order => order.status === 'completed').length || 0
    const activeOrders = orders?.filter(order => 
      order.status === 'pending' || order.status === 'processing' || order.status === 'awaiting_review'
    ).length || 0
    const totalEarnings = orders?.filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + Number(order.amount || 0), 0) || 0

    console.log('[Orders API] Found booster orders:', totalOrders)

    return NextResponse.json({
      orders: (orders || []).map(order => ({
        ...order,
        customer_profile: order.user_id ? customerMap[order.user_id] || null : null,
        feedback: orderFeedbackMap[order.id] || null,
      })),
      stats: {
        totalOrders,
        completedOrders,
        activeOrders,
        totalEarnings: Number(totalEarnings.toFixed(2)),
        averageRating: feedbackStats.averageRating,
        totalFeedbacks: feedbackStats.totalFeedbacks,
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

