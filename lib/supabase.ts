import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Validate environment variables
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL) {
  // Only log in development or on Vercel
  if (!supabaseUrl) {
    console.warn('[Supabase] NEXT_PUBLIC_SUPABASE_URL is missing')
  } else if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    console.warn('[Supabase] NEXT_PUBLIC_SUPABASE_URL format looks incorrect:', supabaseUrl.substring(0, 30) + '...')
  }

  if (!supabaseAnonKey) {
    console.warn('[Supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY is missing')
  } else if (supabaseAnonKey.length < 50) {
    console.warn('[Supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY seems too short (might be truncated)')
  }

  if (!supabaseServiceKey) {
    console.warn('[Supabase] SUPABASE_SERVICE_ROLE_KEY is missing - email registration will not work')
  } else if (supabaseServiceKey.length < 100) {
    console.warn('[Supabase] SUPABASE_SERVICE_ROLE_KEY seems too short (might be truncated)')
  }
}

// Client-side Supabase client (for browser)
// Only create if URL and key are provided (for build-time safety)
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? (() => {
      try {
        return createClient(supabaseUrl, supabaseAnonKey)
      } catch (error) {
        console.error('[Supabase] Failed to create client-side client:', error)
        return null
      }
    })()
  : null

// Server-side Supabase client (for API routes, with service role key for admin operations)
export const supabaseAdmin: SupabaseClient | null = (supabaseUrl && supabaseServiceKey)
  ? (() => {
      try {
        return createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })
      } catch (error) {
        console.error('[Supabase] Failed to create admin client:', error)
        return null
      }
    })()
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
// Returns { success: boolean, user?: User, error?: string }
export async function createUserWithPassword(userData: {
  email: string
  name: string
  password: string
}): Promise<{ success: boolean; user?: any; error?: string }> {
  if (!supabaseAdmin) {
    const errorMsg = 'Supabase admin client not initialized. Check SUPABASE_SERVICE_ROLE_KEY environment variable.'
    console.error('[Supabase]', errorMsg)
    
    // Detailed diagnostics
    const envServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    
    console.error('[Supabase] Diagnostic Info:')
    console.error('[Supabase] - SUPABASE_SERVICE_ROLE_KEY exists:', !!envServiceKey)
    console.error('[Supabase] - SUPABASE_SERVICE_ROLE_KEY length:', envServiceKey.length)
    console.error('[Supabase] - NEXT_PUBLIC_SUPABASE_URL exists:', !!envUrl)
    console.error('[Supabase] - NEXT_PUBLIC_SUPABASE_URL:', envUrl)
    
    if (envServiceKey) {
      console.error('[Supabase] - Key starts with:', envServiceKey.substring(0, 20))
      console.error('[Supabase] - Key ends with:', envServiceKey.substring(Math.max(0, envServiceKey.length - 20)))
      
      // Check for common issues
      if (envServiceKey.trim() !== envServiceKey) {
        console.error('[Supabase] - WARNING: Key has leading/trailing whitespace!')
      }
      if (envServiceKey.length < 200) {
        console.error('[Supabase] - WARNING: Key seems too short (should be 250+ chars)')
      }
      if (!envServiceKey.startsWith('eyJ')) {
        console.error('[Supabase] - WARNING: Key does not start with "eyJ" (not a valid JWT)')
      }
    }
    
    return { success: false, error: 'Server configuration error. Please contact support.' }
  }

  if (!userData.email || !userData.password) {
    const errorMsg = 'Email and password are required'
    console.error('[Supabase]', errorMsg)
    return { success: false, error: errorMsg }
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
      
      // Check for invalid API key error
      if (authError.message?.toLowerCase().includes('invalid api key') || 
          authError.message?.toLowerCase().includes('api key') ||
          authError.message?.toLowerCase().includes('invalid') ||
          authError.status === 401 ||
          authError.status === 403) {
        console.error('[Supabase] Invalid API key detected - check SUPABASE_SERVICE_ROLE_KEY')
        console.error('[Supabase] Service key length:', supabaseServiceKey.length)
        console.error('[Supabase] Service key starts with:', supabaseServiceKey.substring(0, 20))
        console.error('[Supabase] Service key ends with:', supabaseServiceKey.substring(Math.max(0, supabaseServiceKey.length - 20)))
        
        // Check if key looks truncated
        if (supabaseServiceKey.length < 200) {
          console.error('[Supabase] WARNING: Service key seems too short! Should be 250+ characters')
        }
        
        // Try to decode JWT to verify
        try {
          const parts = supabaseServiceKey.split('.')
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
            console.error('[Supabase] Key role:', payload.role)
            if (payload.role !== 'service_role') {
              console.error('[Supabase] ERROR: Key role is not "service_role"! Found:', payload.role)
            }
          }
        } catch (e) {
          console.error('[Supabase] Could not decode JWT - key format might be invalid')
        }
        
        return { success: false, error: 'Server configuration error. Invalid API key. Please check Vercel environment variables.' }
      }
      
      // Check if it's a duplicate email error
      const isDuplicateEmail = authError.message?.toLowerCase().includes('already registered') || 
          authError.message?.toLowerCase().includes('already exists') ||
          authError.message?.toLowerCase().includes('user already') ||
          authError.message?.toLowerCase().includes('email address') ||
          authError.status === 422 // Supabase often returns 422 for duplicate emails
      
      if (isDuplicateEmail) {
        console.error('[Supabase] Email already exists in Supabase Auth')
        return { success: false, error: 'This email is already registered. Please sign in instead.' }
      }
      
      return { success: false, error: authError.message || 'Failed to create user account. Please try again.' }
    }

    if (!authUser?.user) {
      const errorMsg = 'Auth user created but user object is missing'
      console.error('[Supabase]', errorMsg)
      return { success: false, error: 'Failed to create user. Please try again.' }
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
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        console.log('[Supabase] Cleaned up auth user due to user record creation failure')
      } catch (deleteError) {
        console.error('[Supabase] Error cleaning up auth user:', deleteError)
      }
      
      // Provide specific error message based on error code
      if (createError.code === '23505') { // Unique violation
        return { success: false, error: 'This email is already registered. Please sign in instead.' }
      }
      
      return { 
        success: false, 
        error: createError.message || 'Failed to save user data. Please contact support if this persists.' 
      }
    }

    console.log('[Supabase] User record created successfully:', newUser.id)
    return { success: true, user: newUser }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('[Supabase] Exception in createUserWithPassword:', error)
    return { success: false, error: `Registration failed: ${errorMsg}` }
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

