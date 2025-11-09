import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { code, amount } = await req.json()

    if (!supabaseAdmin) {
      console.error('[Coupon Validation] Supabase admin client not initialized')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      )
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    // Normalize coupon code (uppercase, trim)
    const normalizedCode = code.trim().toUpperCase()

    // Fetch coupon from database
    const { data: coupon, error: couponError } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('code', normalizedCode)
      .eq('is_active', true)
      .single()

    if (couponError || !coupon) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Invalid or expired coupon code' 
        },
        { status: 200 } // Return 200 to indicate validation result, not error
      )
    }

    // Check if coupon is valid (date range)
    const now = new Date()
    const validFrom = new Date(coupon.valid_from)
    const validUntil = new Date(coupon.valid_until)

    if (now < validFrom || now > validUntil) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Coupon is not valid at this time' 
        },
        { status: 200 }
      )
    }

    // Check minimum amount requirement
    if (coupon.min_amount && amount < coupon.min_amount) {
      return NextResponse.json(
        { 
          valid: false,
          error: `Minimum order amount of $${coupon.min_amount} required` 
        },
        { status: 200 }
      )
    }

    // Check usage limit
    if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Coupon has reached its usage limit' 
        },
        { status: 200 }
      )
    }

    // Calculate discount amount
    let discountAmount = 0
    if (coupon.discount_type === 'percentage') {
      discountAmount = amount * (coupon.discount_value / 100)
      // Apply max discount if specified
      if (coupon.max_discount && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount
      }
    } else if (coupon.discount_type === 'fixed') {
      discountAmount = Math.min(coupon.discount_value, amount) // Can't discount more than the amount
    }

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100

    // Calculate final amount
    const finalAmount = Math.max(0, amount - discountAmount) // Ensure non-negative
    const finalAmountRounded = Math.round(finalAmount * 100) / 100

    console.log('[Coupon Validation] ✅ Valid coupon:', {
      code: normalizedCode,
      originalAmount: amount,
      discountAmount,
      finalAmount: finalAmountRounded,
    })

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
        description: coupon.description,
      },
      discountAmount,
      finalAmount: finalAmountRounded,
    })
  } catch (error: any) {
    console.error('[Coupon Validation] Error:', error)
    return NextResponse.json(
      { 
        valid: false,
        error: 'Failed to validate coupon code' 
      },
      { status: 500 }
    )
  }
}

