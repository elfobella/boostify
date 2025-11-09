import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/app/api/auth/[...nextauth]/route'

interface RouteParams {
  orderId: string
}

async function getSessionUser() {
  const session = await auth()

  if (!session?.user?.email) {
    return { error: 'Unauthorized', status: 401 as const }
  }

  if (!supabaseAdmin) {
    console.error('[Feedback API] Supabase admin client not initialized')
    return { error: 'Server configuration error', status: 500 as const }
  }

  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, role, email')
    .eq('email', session.user.email)
    .single()

  if (userError || !userData) {
    console.error('[Feedback API] User lookup failed:', userError)
    return { error: 'User not found', status: 404 as const }
  }

  return { user: userData, status: 200 as const }
}

async function getOrder(orderId: string) {
  if (!supabaseAdmin) {
    return { error: 'Server configuration error', status: 500 as const }
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    console.error('[Feedback API] Order lookup failed:', orderError)
    return { error: 'Order not found', status: 404 as const }
  }

  return { order, status: 200 as const }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const sessionResult = await getSessionUser()
    if ('error' in sessionResult) {
      return NextResponse.json({ error: sessionResult.error }, { status: sessionResult.status })
    }

    const { user } = sessionResult
    const orderResult = await getOrder(orderId)
    if ('error' in orderResult) {
      return NextResponse.json({ error: orderResult.error }, { status: orderResult.status })
    }

    const { order } = orderResult

    const isOrderOwner = order.user_id === user.id
    const isBooster = order.booster_id === user.id
    const isAdmin = user.role === 'admin'

    if (!isOrderOwner && !isBooster && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { data: feedback, error: feedbackError } = await supabaseAdmin
      .from('booster_feedback')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle()

    if (feedbackError) {
      console.error('[Feedback API] Error fetching feedback:', feedbackError)
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
    }

    return NextResponse.json({ feedback }, { status: 200 })
  } catch (error) {
    console.error('[Feedback API] Exception in GET:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const sessionResult = await getSessionUser()
    if ('error' in sessionResult) {
      return NextResponse.json({ error: sessionResult.error }, { status: sessionResult.status })
    }

    const { user } = sessionResult
    const orderResult = await getOrder(orderId)
    if ('error' in orderResult) {
      return NextResponse.json({ error: orderResult.error }, { status: orderResult.status })
    }

    const { order } = orderResult

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden - This order does not belong to you' }, { status: 403 })
    }

    if (order.status !== 'completed') {
      return NextResponse.json(
        { error: 'Feedback can only be submitted after the order is completed' },
        { status: 400 }
      )
    }

    if (!order.booster_id) {
      return NextResponse.json(
        { error: 'Feedback cannot be submitted because no booster is associated with this order' },
        { status: 400 }
      )
    }

    const body = await req.json().catch(() => null)

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { rating, comment } = body as {
      rating?: number | null
      comment?: string | null
    }

    if (rating !== undefined && rating !== null) {
      if (typeof rating !== 'number' || Number.isNaN(rating) || rating < 1 || rating > 5) {
        return NextResponse.json({ error: 'Rating must be a number between 1 and 5' }, { status: 400 })
      }
    }

    const trimmedComment =
      typeof comment === 'string'
        ? comment.trim()
        : null

    if ((rating === undefined || rating === null) && (!trimmedComment || trimmedComment.length === 0)) {
      return NextResponse.json(
        { error: 'Please provide a rating or a comment for your feedback' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { data: existingFeedback, error: existingError } = await supabaseAdmin
      .from('booster_feedback')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle()

    if (existingError) {
      console.error('[Feedback API] Error checking existing feedback:', existingError)
      return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
    }

    if (existingFeedback) {
      const updateData: Record<string, string | number | null> = {}

      if (rating !== undefined) {
        updateData.rating = rating
      }

      if (comment !== undefined) {
        updateData.comment = trimmedComment
      }

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { error: 'No changes detected in feedback submission' },
          { status: 400 }
        )
      }

      const { data: updatedFeedback, error: updateError } = await supabaseAdmin
        .from('booster_feedback')
        .update(updateData)
        .eq('id', existingFeedback.id)
        .select()
        .single()

      if (updateError || !updatedFeedback) {
        console.error('[Feedback API] Error updating feedback:', updateError)
        return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 })
      }

      console.log('[Feedback API] ✅ Feedback updated:', {
        orderId,
        boosterId: order.booster_id,
        customerId: user.id,
        rating: updateData.rating ?? existingFeedback.rating,
      })

      return NextResponse.json(
        { message: 'Feedback updated successfully', feedback: updatedFeedback },
        { status: 200 }
      )
    }

    const insertData = {
      order_id: order.id,
      booster_id: order.booster_id,
      customer_id: order.user_id,
      rating: rating ?? null,
      comment: trimmedComment,
    }

    const { data: newFeedback, error: insertError } = await supabaseAdmin
      .from('booster_feedback')
      .insert(insertData)
      .select()
      .single()

    if (insertError || !newFeedback) {
      console.error('[Feedback API] Error inserting feedback:', insertError)
      const code = (insertError as { code?: string } | null)?.code
      const status = code === '23505' ? 409 : 500
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status }
      )
    }

    console.log('[Feedback API] ✅ Feedback submitted:', {
      orderId,
      boosterId: order.booster_id,
      customerId: user.id,
      rating: rating ?? null,
    })

    return NextResponse.json(
      { message: 'Feedback submitted successfully', feedback: newFeedback },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Feedback API] Exception in POST:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}


