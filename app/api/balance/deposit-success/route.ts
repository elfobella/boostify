import { NextRequest, NextResponse } from 'next/server'
import { handleDepositSuccess } from '../deposit/route'

// Handle successful balance deposit payment
export async function POST(req: NextRequest) {
  try {
    const { paymentIntentId } = await req.json()

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      )
    }

    const result = await handleDepositSuccess(paymentIntentId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        balanceAfter: result.balanceAfter,
        cashbackAmount: result.cashbackAmount,
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to process deposit' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[Balance Deposit Success] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

