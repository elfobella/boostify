import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/app/api/auth/[...nextauth]/route'

export async function GET(req: NextRequest) {
  try {
    // Get session to verify user
    const session = await auth()
    
    if (!session?.user?.id && !session?.user?.email) {
      console.warn('[User Role API] Unauthorized request: missing session, id, or email')
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

    // Prefer user ID over email (more reliable and faster)
    let userData = null
    
    if (session.user.id) {
      console.log('[User Role API] Fetching role for user ID:', session.user.id)
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id, email, role, created_at, updated_at')
        .eq('id', session.user.id)
        .single()
      
      if (!error && data) {
        userData = data
        console.log('[User Role API] Resolved role:', userData.role || 'customer', 'for user id:', userData.id, 'updated_at:', userData.updated_at)
        return NextResponse.json({
          role: userData.role || 'customer',
        }, { status: 200 })
      } else if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" - that's OK, we'll try email
        console.error('[User Role API] Error fetching user by ID:', error)
      }
    }
    
    // Fallback to email if ID lookup failed or ID not available
    if (!userData && session.user.email) {
      console.log('[User Role API] Fetching role for email:', session.user.email)
      
      // Check for multiple records (handle duplicates)
      const { data: allUsers, error: listError } = await supabaseAdmin
        .from('users')
        .select('id, email, role, created_at, updated_at')
        .eq('email', session.user.email)
        .order('updated_at', { ascending: false })

      if (listError) {
        console.error('[User Role API] Error fetching users by email:', listError)
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

      userData = allUsers[0]
      
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
    }
    
    // If we reach here, neither ID nor email worked
    console.warn('[User Role API] Could not find user by ID or email, defaulting to customer')
    return NextResponse.json({
      role: 'customer',
    }, { status: 200 })
  } catch (error) {
    console.error('[User Role API] Exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

