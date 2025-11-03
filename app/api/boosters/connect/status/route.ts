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

export async function GET(req: NextRequest) {
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
      .select('id, role, stripe_connect_account_id, onboarding_complete, payouts_enabled, charges_enabled')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      console.error('[Connect] User not found:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only boosters can have Connect accounts
    if (userData.role !== 'booster') {
      console.log('[Connect] Non-booster tried to access Connect status:', session.user.email)
      return NextResponse.json(
        { error: 'Only boosters can access Connect status' },
        { status: 403 }
      )
    }

    // If no Connect account, return not started
    if (!userData.stripe_connect_account_id) {
      return NextResponse.json({
        hasAccount: false,
        onboardingComplete: false,
        readyToAccept: false,
        status: 'not_started'
      })
    }

    // Fetch fresh status from Stripe
    let stripeAccount
    try {
      stripeAccount = await stripe.accounts.retrieve(userData.stripe_connect_account_id)
    } catch (stripeError: any) {
      console.error('[Connect] Error fetching Stripe account:', stripeError)
      return NextResponse.json({
        hasAccount: true,
        onboardingComplete: false,
        readyToAccept: false,
        status: 'error',
        error: 'Could not retrieve account from Stripe'
      })
    }

    // Check if onboarding is complete
    const onboardingComplete = stripeAccount.charges_enabled && stripeAccount.payouts_enabled
    const readyToAccept = onboardingComplete

    console.log('[Connect] Status for account:', userData.stripe_connect_account_id, {
      onboardingComplete,
      chargesEnabled: stripeAccount.charges_enabled,
      payoutsEnabled: stripeAccount.payouts_enabled
    })

    // Update database with fresh status
    await supabaseAdmin
      .from('users')
      .update({
        onboarding_complete: onboardingComplete,
        charges_enabled: stripeAccount.charges_enabled,
        payouts_enabled: stripeAccount.payouts_enabled,
      })
      .eq('id', userData.id)

    return NextResponse.json({
      hasAccount: true,
      onboardingComplete,
      readyToAccept,
      chargesEnabled: stripeAccount.charges_enabled,
      payoutsEnabled: stripeAccount.payouts_enabled,
      status: onboardingComplete ? 'complete' : 'in_progress',
      accountId: userData.stripe_connect_account_id
    })
  } catch (error: any) {
    console.error('[Connect] Error checking status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check onboarding status' },
      { status: 500 }
    )
  }
}

