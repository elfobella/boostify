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
    const safeBoosters = boosters.map(booster => ({
      id: booster.id,
      name: booster.name,
      email: booster.email, // For display only
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

