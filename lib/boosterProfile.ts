import { supabaseAdmin } from '@/lib/supabase'

export interface BoosterProfileSummary {
  averageRating: number | null
  totalFeedbacks: number
  totalOrders: number
  completedOrders: number
  activeOrders: number
  totalEarnings: number
}

export interface BoosterFeedbackEntry {
  id: string
  rating: number | null
  comment: string | null
  created_at: string
  customer: {
    id: string
    name: string | null
    image: string | null
  } | null
}

export interface BoosterRecentOrder {
  id: string
  game: string
  service_category: string
  status: string
  created_at: string
  amount: number
  currency: string
  customer: {
    id: string
    name: string | null
    image: string | null
  } | null
}

export interface BoosterProfileData {
  booster: {
    id: string
    name: string | null
    image: string | null
    role: string | null
    created_at?: string
  }
  summary: BoosterProfileSummary
  feedback: BoosterFeedbackEntry[]
  recentOrders: BoosterRecentOrder[]
}

export async function getBoosterProfileData(boosterId: string): Promise<BoosterProfileData | null> {
  if (!supabaseAdmin) {
    console.error('[BoosterProfile] Supabase admin client not initialized')
    return null
  }

  const { data: booster, error: boosterError } = await supabaseAdmin
    .from('users')
    .select('id, name, image, role, created_at')
    .eq('id', boosterId)
    .single()

  if (boosterError) {
    console.error('[BoosterProfile] Error fetching booster:', boosterError)
    return null
  }

  if (!booster || booster.role !== 'booster') {
    return null
  }

  const [{ count: totalOrdersCount = 0 }, { count: completedOrdersCount = 0 }, { data: ordersData }] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('booster_id', boosterId),
    supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('booster_id', boosterId)
      .eq('status', 'completed'),
    supabaseAdmin
      .from('orders')
      .select('id, game, service_category, status, created_at, amount, currency, user:user_id (id, name, image)')
      .eq('booster_id', boosterId)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const safeTotalOrders = totalOrdersCount ?? 0
  const safeCompletedOrders = completedOrdersCount ?? 0
  const activeOrders = safeTotalOrders - safeCompletedOrders

  const totalEarnings = ordersData
    ?.filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + Number(order.amount || 0), 0) || 0

  const { data: feedbackData, error: feedbackError } = await supabaseAdmin
    .from('booster_feedback')
    .select('id, rating, comment, created_at, customer:customer_id (id, name, image)')
    .eq('booster_id', boosterId)
    .order('created_at', { ascending: false })
    .limit(25)

  if (feedbackError) {
    console.error('[BoosterProfile] Error fetching feedback:', feedbackError)
  }

  let averageRating: number | null = null
  let totalFeedbacks = 0

  if (feedbackData && feedbackData.length > 0) {
    const ratings = feedbackData
      .map(entry => (typeof entry.rating === 'number' ? Number(entry.rating) : null))
      .filter((rating): rating is number => rating !== null && !Number.isNaN(rating))

    if (ratings.length > 0) {
      const sum = ratings.reduce((acc, rating) => acc + rating, 0)
      averageRating = Number((sum / ratings.length).toFixed(2))
      totalFeedbacks = ratings.length
    }
  }

  const recentOrders: BoosterRecentOrder[] = (ordersData || []).map(order => {
    const userData = Array.isArray(order.user) ? order.user[0] : order.user

    return {
      id: order.id,
      game: order.game,
      service_category: order.service_category,
      status: order.status,
      created_at: order.created_at,
      amount: Number(order.amount || 0),
      currency: order.currency,
      customer: userData
        ? {
            id: userData.id,
            name: userData.name || null,
            image: userData.image || null,
          }
        : null,
    }
  })

  const recentFeedback: BoosterFeedbackEntry[] = (feedbackData || []).map(entry => {
    const customerData = Array.isArray(entry.customer) ? entry.customer[0] : entry.customer

    return {
      id: entry.id,
      rating: entry.rating,
      comment: entry.comment,
      created_at: entry.created_at,
      customer: entry.customer
        ? {
            id: customerData?.id ?? null,
            name: customerData?.name || null,
            image: customerData?.image || null,
          }
        : null,
    }
  })

  return {
    booster: {
      id: booster.id,
      name: booster.name || null,
      image: booster.image || null,
      role: booster.role,
      created_at: booster.created_at,
    },
    summary: {
      averageRating,
      totalFeedbacks,
      totalOrders: safeTotalOrders,
      completedOrders: safeCompletedOrders,
      activeOrders,
      totalEarnings: Number(totalEarnings.toFixed(2)),
    },
    feedback: recentFeedback,
    recentOrders,
  }
}


