import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      console.error('[Boosters API] Supabase admin client not initialized')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Get all boosters who have completed Stripe onboarding
    const { data: boosters, error: boostersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, onboarding_complete, payouts_enabled, charges_enabled, stripe_connect_account_id')
      .eq('role', 'booster')
      .eq('onboarding_complete', true)
      .eq('charges_enabled', true)
      .eq('payouts_enabled', true)
      .order('name')

    if (boostersError) {
      console.error('[Boosters API] Error fetching boosters:', boostersError)
      return NextResponse.json(
        { error: 'Failed to fetch boosters' },
        { status: 500 }
      )
    }

    // Return safe data (no sensitive info)
    const boosterIds = boosters.map(booster => booster.id).filter(Boolean)

    let ratingSummaryMap: Record<string, { averageRating: number | null; totalFeedbacks: number }> = {}
    let completedOrderMap: Record<string, number> = {}

    if (boosterIds.length > 0) {
      const { data: boosterRatings, error: ratingsError } = await supabaseAdmin
        .from('booster_feedback')
        .select('booster_id, rating')
        .in('booster_id', boosterIds)

      if (ratingsError) {
        console.error('[Boosters API] Error fetching booster ratings:', ratingsError)
      } else if (boosterRatings) {
        const accumulator = new Map<string, { total: number; count: number }>()

        boosterRatings.forEach(entry => {
          if (!entry.booster_id) return
          const ratingValue = typeof entry.rating === 'number' ? Number(entry.rating) : null
          if (ratingValue === null || Number.isNaN(ratingValue)) return

          const current = accumulator.get(entry.booster_id) || { total: 0, count: 0 }
          current.total += ratingValue
          current.count += 1
          accumulator.set(entry.booster_id, current)
        })

        accumulator.forEach((value, boosterId) => {
          ratingSummaryMap[boosterId] = {
            averageRating: Number((value.total / value.count).toFixed(2)),
            totalFeedbacks: value.count,
          }
        })
      }

      const { data: completedOrders, error: completedOrdersError } = await supabaseAdmin
        .from('orders')
        .select('booster_id')
        .eq('status', 'completed')
        .in('booster_id', boosterIds)

      if (completedOrdersError) {
        console.error('[Boosters API] Error fetching completed order counts:', completedOrdersError)
      } else if (completedOrders) {
        completedOrderMap = completedOrders.reduce<Record<string, number>>((acc, order) => {
          if (!order.booster_id) return acc
          acc[order.booster_id] = (acc[order.booster_id] || 0) + 1
          return acc
        }, {})
      }
    }

    const safeBoosters = boosters.map(booster => ({
      id: booster.id,
      name: booster.name,
      email: booster.email,
      averageRating: ratingSummaryMap[booster.id]?.averageRating ?? null,
      totalFeedbacks: ratingSummaryMap[booster.id]?.totalFeedbacks ?? 0,
      completedOrders: completedOrderMap[booster.id] ?? 0,
      // Don't expose stripe_connect_account_id to frontend
    }))

    console.log('[Boosters API] Found', safeBoosters.length, 'onboarded boosters')

    return NextResponse.json({
      boosters: safeBoosters,
      count: safeBoosters.length
    })
  } catch (error: any) {
    console.error('[Boosters API] Exception:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

