import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Client-side Supabase client (for browser)
// Only create if URL and key are provided (for build-time safety)
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Server-side Supabase client (for API routes, with service role key for admin operations)
export const supabaseAdmin: SupabaseClient | null = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Helper function to get or create user in Supabase
export async function getOrCreateUser(userData: {
  email: string
  name?: string | null
  image?: string | null
  provider: 'discord' | 'google' | 'email'
  providerId?: string
}) {
  if (!supabaseAdmin) {
    console.error('[Supabase] Admin client not initialized. Check environment variables.')
    return null
  }

  if (!userData.email) {
    console.error('[Supabase] Cannot create user: email is required')
    return null
  }

  try {
    console.log('[Supabase] Getting or creating user:', { email: userData.email, provider: userData.provider })
    
    // First, check if user exists by email
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', userData.email)
      .single()

    if (existingUser && !checkError) {
      console.log('[Supabase] User exists, updating last_login:', existingUser.id)
      // User exists, update last_login and optionally update name/image
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          last_login: new Date().toISOString(),
          name: userData.name || existingUser.name,
          image: userData.image || existingUser.image,
          provider_id: userData.providerId || existingUser.provider_id,
        })
        .eq('id', existingUser.id)
        .select()
        .single()

      if (updateError) {
        console.error('[Supabase] Error updating user:', updateError)
        return existingUser
      }

      console.log('[Supabase] User updated successfully:', updatedUser.id)
      return updatedUser
    }

    // User doesn't exist, create new user
    console.log('[Supabase] Creating new user:', userData.email)
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        email: userData.email,
        name: userData.name,
        image: userData.image,
        provider: userData.provider,
        provider_id: userData.providerId,
        last_login: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('[Supabase] Error creating user:', {
        error: createError,
        message: createError.message,
        details: createError.details,
        hint: createError.hint,
        code: createError.code,
      })
      return null
    }

    console.log('[Supabase] User created successfully:', newUser.id)
    return newUser
  } catch (error) {
    console.error('[Supabase] Exception in getOrCreateUser:', error)
    return null
  }
}

// Helper function to create user with password (for email/password registration)
export async function createUserWithPassword(userData: {
  email: string
  name: string
  password: string
}) {
  if (!supabaseAdmin) {
    console.error('[Supabase] Admin client not initialized. Check SUPABASE_SERVICE_ROLE_KEY environment variable.')
    return null
  }

  if (!userData.email || !userData.password) {
    console.error('[Supabase] Email and password are required')
    return null
  }

  try {
    console.log('[Supabase] Creating auth user with password:', { email: userData.email })
    
    // Use Supabase Auth to create user with password
    // This will automatically handle password hashing
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email for now
      user_metadata: {
        name: userData.name
      }
    })

    if (authError) {
      console.error('[Supabase] Error creating auth user:', {
        message: authError.message,
        status: authError.status,
        name: authError.name,
      })
      
      // Check if it's a duplicate email error
      if (authError.message?.toLowerCase().includes('already registered') || 
          authError.message?.toLowerCase().includes('already exists') ||
          authError.message?.toLowerCase().includes('user already')) {
        console.error('[Supabase] Email already exists in Supabase Auth')
      }
      
      return null
    }

    if (!authUser?.user) {
      console.error('[Supabase] Auth user created but user object is missing')
      return null
    }

    console.log('[Supabase] Auth user created successfully:', authUser.user.id)

    // Now create user record in our users table
    console.log('[Supabase] Creating user record in users table')
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        email: userData.email,
        name: userData.name,
        provider: 'email',
        provider_id: authUser.user.id,
        last_login: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('[Supabase] Error creating user record:', {
        message: createError.message,
        details: createError.details,
        hint: createError.hint,
        code: createError.code,
      })
      
      // If user record creation fails, try to delete the auth user to keep consistency
      // (optional - might want to keep auth user and retry later)
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        console.log('[Supabase] Cleaned up auth user due to user record creation failure')
      } catch (deleteError) {
        console.error('[Supabase] Error cleaning up auth user:', deleteError)
      }
      
      return null
    }

    console.log('[Supabase] User record created successfully:', newUser.id)
    return newUser
  } catch (error) {
    console.error('[Supabase] Exception in createUserWithPassword:', error)
    return null
  }
}

// Helper function to verify email/password login
export async function verifyUserPassword(email: string, password: string) {
  if (!supabaseAdmin) {
    console.error('Supabase admin client not initialized')
    return null
  }

  try {
    // Use Supabase Auth to verify password
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      console.error('Error verifying password:', authError)
      return null
    }

    // Update last_login in users table
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        last_login: new Date().toISOString(),
      })
      .eq('email', email)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating last_login:', updateError)
    }

    return authData.user
  } catch (error) {
    console.error('Error in verifyUserPassword:', error)
    return null
  }
}

