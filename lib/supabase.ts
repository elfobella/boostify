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
    console.error('Supabase admin client not initialized')
    return null
  }

  try {
    // First, check if user exists by email
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', userData.email)
      .single()

    if (existingUser && !checkError) {
      // User exists, update last_login
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          last_login: new Date().toISOString(),
          name: userData.name || existingUser.name,
          image: userData.image || existingUser.image,
        })
        .eq('id', existingUser.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating user:', updateError)
        return existingUser
      }

      return updatedUser
    }

    // User doesn't exist, create new user
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
      console.error('Error creating user:', createError)
      return null
    }

    return newUser
  } catch (error) {
    console.error('Error in getOrCreateUser:', error)
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
    console.error('Supabase admin client not initialized')
    return null
  }

  try {
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
      console.error('Error creating auth user:', authError)
      return null
    }

    // Now create user record in our users table
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
      console.error('Error creating user record:', createError)
      return null
    }

    return newUser
  } catch (error) {
    console.error('Error in createUserWithPassword:', error)
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

