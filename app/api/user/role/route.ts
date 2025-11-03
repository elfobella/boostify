import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/app/api/auth/[...nextauth]/route'

export async function GET(req: NextRequest) {
  try {
    // Get session to verify user
    const session = await auth()
    
    if (!session?.user?.email) {
      console.warn('[User Role API] Unauthorized request: missing session or email')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!supabaseAdmin) {
      console.error('[User Role API] Supabase admin client not initialized')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Get user role from users table
    console.log('[User Role API] Fetching role for:', session.user.email)
    
    // Check for multiple records (handle duplicates)
    const { data: allUsers, error: listError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, created_at, updated_at')
      .eq('email', session.user.email)
      .order('updated_at', { ascending: false })

    if (listError) {
      console.error('[User Role API] Error fetching users:', listError)
      return NextResponse.json({
        role: 'customer',
      }, { status: 200 })
    }

    if (!allUsers || allUsers.length === 0) {
      console.warn('[User Role API] User not found for email:', session.user.email)
      return NextResponse.json({
        role: 'customer',
      }, { status: 200 })
    }

    let userData = allUsers[0]
    
    if (allUsers.length > 1) {
      console.warn(`[User Role API] WARNING: Found ${allUsers.length} users with email ${session.user.email}:`, 
        allUsers.map(u => ({ id: u.id, role: u.role, updated_at: u.updated_at })))
      
      // Priority: booster > admin > customer
      // If any user has booster role, use that
      const boosterUser = allUsers.find(u => u.role === 'booster')
      if (boosterUser) {
        console.log(`[User Role API] Found booster user among duplicates, using booster role from user_id: ${boosterUser.id}`)
        userData = boosterUser
      } else {
        const adminUser = allUsers.find(u => u.role === 'admin')
        if (adminUser) {
          console.log(`[User Role API] Found admin user among duplicates, using admin role from user_id: ${adminUser.id}`)
          userData = adminUser
        } else {
          console.warn('[User Role API] Using most recently UPDATED user (first in sorted list)')
        }
      }
    }

    console.log('[User Role API] Resolved role:', userData.role || 'customer', 'for user id:', userData.id, 'updated_at:', userData.updated_at)
    return NextResponse.json({
      role: userData.role || 'customer',
    }, { status: 200 })
  } catch (error) {
    console.error('[User Role API] Exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

