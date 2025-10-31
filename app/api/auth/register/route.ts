import { NextResponse } from "next/server"
import { createUserWithPassword } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, password } = body

    console.log('[Register API] Received registration request:', { email, hasName: !!name, hasPassword: !!password })

    // Validate input
    if (!email || !name || !password) {
      console.error('[Register API] Missing required fields')
      return NextResponse.json(
        { error: "Email, name, and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      console.error('[Register API] Password too short')
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    // Check if Supabase is configured
    const { supabaseAdmin } = await import("@/lib/supabase")
    if (!supabaseAdmin) {
      console.error('[Register API] Supabase admin client not initialized')
      
      // Check which environment variables are missing
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      
      if (!supabaseUrl) {
        console.error('[Register API] NEXT_PUBLIC_SUPABASE_URL is missing')
      }
      if (!supabaseServiceKey) {
        console.error('[Register API] SUPABASE_SERVICE_ROLE_KEY is missing')
      } else if (supabaseServiceKey.length < 100) {
        console.error('[Register API] SUPABASE_SERVICE_ROLE_KEY seems too short (might be truncated):', supabaseServiceKey.length, 'chars')
      }
      
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 }
      )
    }

    // Check if email already exists in our users table (more efficient than listing all auth users)
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', email)
      .single()
    
    if (existingUser) {
      console.error('[Register API] Email already registered in users table:', email)
      return NextResponse.json(
        { error: "Email is already registered. Please sign in instead." },
        { status: 409 }
      )
    }

    // Create user in Supabase
    console.log('[Register API] Calling createUserWithPassword')
    const result = await createUserWithPassword({
      email,
      name,
      password,
    })

    if (!result.success) {
      console.error('[Register API] Failed to create user:', result.error)
      
      // Return appropriate status code based on error
      const statusCode = result.error?.includes('already registered') || result.error?.includes('already exists') 
        ? 409 
        : result.error?.includes('configuration') 
        ? 500 
        : 400
      
      return NextResponse.json(
        { error: result.error || "Failed to create user. Please try again." },
        { status: statusCode }
      )
    }

    if (!result.user) {
      console.error('[Register API] User creation returned success but no user object')
      return NextResponse.json(
        { error: "User creation completed but data was not returned. Please try signing in." },
        { status: 500 }
      )
    }

    console.log('[Register API] User created successfully:', result.user.id)
    return NextResponse.json(
      { message: "User created successfully", userId: result.user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("[Register API] Exception:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

