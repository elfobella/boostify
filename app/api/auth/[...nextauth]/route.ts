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
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
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
