import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { getOrCreateUser, createUserWithPassword, verifyUserPassword } from "@/lib/supabase"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await verifyUserPassword(
          credentials.email as string,
          credentials.password as string
        )

        if (!user) {
          return null
        }

        // Get user data from our users table
        const { supabaseAdmin } = await import("@/lib/supabase")
        if (!supabaseAdmin) {
          // Fallback if Supabase is not configured
          return {
            id: user.id,
            email: user.email || credentials.email as string,
            name: user.user_metadata?.name || null,
            image: user.user_metadata?.avatar_url || null,
          }
        }

        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single()

        return {
          id: user.id,
          email: user.email || credentials.email as string,
          name: userData?.name || user.user_metadata?.name || null,
          image: userData?.image || user.user_metadata?.avatar_url || null,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Save user to Supabase when they sign in with OAuth
      if (account?.provider === 'discord' || account?.provider === 'google') {
        try {
          console.log(`[NextAuth] Starting OAuth sign-in for ${account.provider}`)
          
          // Extract email from different possible locations
          const email = user.email || 
                       (profile as any)?.email || 
                       (profile as any)?.emails?.[0]?.value ||
                       (profile as any)?.email_addresses?.[0]?.email_address ||
                       ''
          
          // Extract name from different possible locations
          const name = user.name || 
                      (profile as any)?.name || 
                      (profile as any)?.displayName ||
                      (profile as any)?.username ||
                      (profile as any)?.global_name ||
                      null
          
          // Extract image from different possible locations
          const image = user.image || 
                       (profile as any)?.picture || 
                       (profile as any)?.avatar_url ||
                       (profile as any)?.avatar ||
                       null

          console.log(`[NextAuth] Sign in with ${account.provider}:`, {
            email,
            name,
            image,
            providerId: account.providerAccountId,
            hasProfile: !!profile,
            hasUserEmail: !!user.email,
            hasUserName: !!user.name,
            hasUserImage: !!user.image,
            userObject: { email: user.email, name: user.name, image: user.image },
            profileKeys: profile ? Object.keys(profile as any) : [],
          })

          // Check if Supabase is configured
          const { supabaseAdmin } = await import("@/lib/supabase")
          if (!supabaseAdmin) {
            console.error('[NextAuth] Supabase admin client not initialized - CANNOT save user')
            console.error('[NextAuth] Check SUPABASE_SERVICE_ROLE_KEY environment variable')
            return true // Still allow sign in even if Supabase is not configured
          }

          console.log('[NextAuth] Supabase admin client is initialized')

          if (!email || !email.trim()) {
            console.error(`[NextAuth] No email found for ${account.provider} user, cannot save to Supabase`)
            console.error(`[NextAuth] User object:`, JSON.stringify(user, null, 2))
            console.error(`[NextAuth] Profile object keys:`, profile ? Object.keys(profile as any) : 'null')
            return true // Still allow sign in
          }

          console.log('[NextAuth] Calling getOrCreateUser with:', {
            email,
            name,
            hasImage: !!image,
            provider: account.provider,
            providerId: account.providerAccountId,
          })

          const userData = await getOrCreateUser({
            email: email.trim(),
            name,
            image,
            provider: account.provider as 'discord' | 'google',
            providerId: account.providerAccountId,
          })

          if (userData) {
            console.log(`[NextAuth] ✅ User saved to Supabase successfully:`, {
              id: userData.id,
              email: userData.email,
              provider: userData.provider,
            })
            // Store Supabase user ID in NextAuth user object
            user.id = userData.id
          } else {
            console.error(`[NextAuth] ❌ Failed to save user to Supabase for ${account.provider}`)
            console.error(`[NextAuth] getOrCreateUser returned null - check Supabase logs above`)
          }
        } catch (error) {
          console.error(`[NextAuth] ❌ Exception in signIn callback for ${account.provider}:`, error)
          if (error instanceof Error) {
            console.error(`[NextAuth] Error message:`, error.message)
            console.error(`[NextAuth] Error stack:`, error.stack)
          }
          // Still allow sign in even if there's an error
          // This prevents blocking legitimate users if Supabase has issues
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.role = token.role as string | undefined
        console.log('[NextAuth][session] user:', {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role || 'undefined',
        })
      }
      return session
    },
    async jwt({ token, user, trigger }) {
      // On initial sign in or session update, fetch role from database
      if (user || trigger === 'update') {
        token.id = user?.id || token.id
        token.email = user?.email || token.email
      }
      
      // Fetch role from DB when:
      // 1. User just signed in (user object exists) - ALWAYS fetch on sign in
      // 2. Token doesn't have a role yet - First time setup
      // 3. Session is updated via updateSession() - For role changes without re-signing
      if ((user || !token.role || trigger === 'update') && token.email) {
        const { supabaseAdmin } = await import("@/lib/supabase")
        if (supabaseAdmin) {
          // Get all users with this email
          const { data: allUsers, error: listError } = await supabaseAdmin
            .from('users')
            .select('id, email, role, updated_at, created_at')
            .eq('email', token.email)
            .order('updated_at', { ascending: false })
          
          if (listError) {
            console.error('[NextAuth][jwt] Error fetching users:', listError)
            if (!token.role) {
              token.role = 'customer'
            }
            return token
          }

          if (!allUsers || allUsers.length === 0) {
            console.warn('[NextAuth][jwt] user not found in DB, defaulting role to customer. email:', token.email)
            if (!token.role) {
              token.role = 'customer'
            }
            return token
          }

          if (allUsers.length > 1) {
            console.warn(`[NextAuth][jwt] WARNING: Found ${allUsers.length} users with email ${token.email}:`, 
              allUsers.map(u => ({ 
                id: u.id, 
                role: u.role, 
                updated_at: u.updated_at,
                created_at: u.created_at
              })))
            
            // Priority: booster > admin > customer
            // If any user has booster role, use that
            const boosterUser = allUsers.find(u => u.role === 'booster')
            if (boosterUser) {
              console.log(`[NextAuth][jwt] Found booster user among duplicates, using booster role from user_id: ${boosterUser.id}`)
              token.role = 'booster'
              return token
            }
            
            const adminUser = allUsers.find(u => u.role === 'admin')
            if (adminUser) {
              console.log(`[NextAuth][jwt] Found admin user among duplicates, using admin role from user_id: ${adminUser.id}`)
              token.role = 'admin'
              return token
            }
          }

          // Use the most recently updated user (or only user)
          const userData = allUsers[0]
          const previousRole = token.role
          const newRole = userData.role || 'customer'
          token.role = newRole
          
          console.log('[NextAuth][jwt] Role fetch details:', {
            email: token.email,
            previousRole: previousRole || 'none',
            newRole: newRole,
            userId: userData.id,
            updatedAt: userData.updated_at,
            totalUsers: allUsers.length,
            trigger: trigger || 'none',
            hasUser: !!user,
            allRoles: allUsers.map(u => ({ id: u.id, role: u.role }))
          })
          
          if (previousRole && previousRole !== newRole) {
            console.log(`[NextAuth][jwt] 🔄 Role CHANGED: ${previousRole} → ${newRole} for email: ${token.email}`)
          }
        } else {
          if (!token.role) {
            token.role = 'customer'
            console.error('[NextAuth][jwt] supabaseAdmin missing, defaulting role to customer')
          }
        }
      } else if (!token.role) {
        // Fallback if no role is set
        token.role = 'customer'
      }
      
      return token
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
})

export const { GET, POST } = handlers
