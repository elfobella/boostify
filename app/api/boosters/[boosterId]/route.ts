import { NextRequest, NextResponse } from 'next/server'
import { getBoosterProfileData } from '@/lib/boosterProfile'

interface RouteParams {
  boosterId: string
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { boosterId } = await params

    if (!boosterId) {
      return NextResponse.json(
        { error: 'Booster ID is required' },
        { status: 400 }
      )
    }

    const profileData = await getBoosterProfileData(boosterId)

    if (!profileData) {
      return NextResponse.json(
        { error: 'Booster not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(profileData, { status: 200 })
  } catch (error) {
    console.error('[Booster API] Exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}


