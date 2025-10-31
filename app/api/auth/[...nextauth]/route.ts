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
        if (!supabaseAdmin) return null

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
        const userData = await getOrCreateUser({
          email: user.email || '',
          name: user.name || null,
          image: user.image || null,
          provider: account.provider as 'discord' | 'google',
          providerId: account.providerAccountId,
        })

        if (userData) {
          // Store Supabase user ID in NextAuth user object
          user.id = userData.id
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
