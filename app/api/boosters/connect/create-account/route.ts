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
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      console.error('[Connect] Supabase admin client not initialized')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Get user from database - prefer ID over email
    let userData = null
    let userError = null

    if (session.user.id) {
      const result = await supabaseAdmin
        .from('users')
        .select('id, email, name, role, stripe_connect_account_id, onboarding_complete')
        .eq('id', session.user.id)
        .single()
      userData = result.data
      userError = result.error
    }

    // Fallback to email if ID lookup failed or ID not available
    if (!userData && session.user.email) {
      const result = await supabaseAdmin
        .from('users')
        .select('id, email, name, role, stripe_connect_account_id, onboarding_complete')
        .eq('email', session.user.email)
        .single()
      userData = result.data
      userError = result.error
    }

    if (userError || !userData) {
      console.error('[Connect] User not found:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only boosters can create Connect accounts
    if (userData.role !== 'booster') {
      return NextResponse.json(
        { error: 'Only boosters can create Connect accounts' },
        { status: 403 }
      )
    }

    // Check if already has a Connect account
    if (userData.stripe_connect_account_id) {
      return NextResponse.json(
        { 
          error: 'Connect account already exists',
          accountId: userData.stripe_connect_account_id,
          onboarding_complete: userData.onboarding_complete || false
        },
        { status: 400 }
      )
    }

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // TODO: Get from user profile or make configurable
      email: userData.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual', // TODO: Allow selection
    })

    console.log('[Connect] ✅ Created Connect account:', account.id, 'for user:', userData.id)

    // Update user with Connect account ID
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ stripe_connect_account_id: account.id })
      .eq('id', userData.id)

    if (updateError) {
      console.error('[Connect] Error updating user:', updateError)
      return NextResponse.json(
        { error: 'Failed to save Connect account' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      accountId: account.id 
    })
  } catch (error: any) {
    console.error('[Connect] Error creating account:', error)
    
    // Check if Connect is not enabled
    if (error.message?.includes('Connect') || error.code === 'account_invalid') {
      return NextResponse.json(
        { 
          error: 'Stripe Connect is not enabled for this platform. Please enable Connect in your Stripe Dashboard: https://dashboard.stripe.com/connect/overview',
          details: error.message,
          code: error.code,
          help: 'See docs/STRIPE_CONNECT_SETUP.md for setup instructions'
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create Connect account',
        details: error.type || 'unknown_error',
        code: error.code
      },
      { status: 500 }
    )
  }
}

