import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/app/api/auth/[...nextauth]/route'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-10-29.clover',
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      console.error('[Connect] Supabase admin client not initialized')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, stripe_connect_account_id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!userData.stripe_connect_account_id) {
      return NextResponse.json(
        { error: 'No Connect account found. Please create one first.' },
        { status: 400 }
      )
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: userData.stripe_connect_account_id,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/booster/dashboard?onboarding=restart`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/booster/dashboard?onboarding=complete`,
      type: 'account_onboarding',
    })

    console.log('[Connect] ✅ Generated onboarding link for account:', userData.stripe_connect_account_id)

    return NextResponse.json({ url: accountLink.url })
  } catch (error: any) {
    console.error('[Connect] Error creating link:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate onboarding link' },
      { status: 500 }
    )
  }
}

