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

        const authUser = await verifyUserPassword(
          credentials.email as string,
          credentials.password as string
        )

        if (!authUser) {
          return null
        }

        // Get user data from our users table - THIS IS THE SOURCE OF TRUTH
        const { supabaseAdmin } = await import("@/lib/supabase")
        if (!supabaseAdmin) {
          // Fallback if Supabase is not configured - use auth user ID
          return {
            id: authUser.id,
            email: authUser.email || credentials.email as string,
            name: authUser.user_metadata?.name || null,
            image: authUser.user_metadata?.avatar_url || null,
          }
        }

        // CRITICAL: Get user from users table
        // Strategy: Try provider_id first (most reliable - links to Supabase Auth), then email
        const email = credentials.email as string
        const normalizedEmail = email.trim().toLowerCase()
        console.log('[NextAuth][Credentials] Searching for user in users table:', {
          email: normalizedEmail,
          authUserId: authUser.id,
          provider: 'email',
        })
        
        let userData = null
        let userError = null
        
        // Strategy 1: Search by email FIRST (EXACTLY like session callback does)
        // Session callback uses this successfully: .select('id, email, role, updated_at, created_at').eq('email', ...).order(...)
        console.log('[NextAuth][Credentials] Attempting email search (matching session callback approach):', {
          email: normalizedEmail,
          originalEmail: email,
        })
        
        // Use EXACT same query as session callback (it works there!)
        const { data: allUsers, error: listError } = await supabaseAdmin
          .from('users')
          .select('id, email, role, updated_at, created_at, provider_id, provider, name, image')
          .eq('email', normalizedEmail)
          .order('updated_at', { ascending: false })
        
        console.log('[NextAuth][Credentials] Email query result (session callback style):', {
          hasError: !!listError,
          error: listError,
          hasData: !!allUsers,
          dataLength: allUsers?.length || 0,
          firstUserId: allUsers?.[0]?.id,
          firstUserEmail: allUsers?.[0]?.email,
          firstUserRole: allUsers?.[0]?.role,
        })
        
        if (!listError && allUsers && allUsers.length > 0) {
          // Handle duplicates: prioritize booster > admin > customer (same as session callback)
          const boosterUser = allUsers.find(u => u.role === 'booster')
          if (boosterUser) {
            userData = [boosterUser]
          } else {
            const adminUser = allUsers.find(u => u.role === 'admin')
            if (adminUser) {
              userData = [adminUser]
            } else {
              userData = [allUsers[0]]
            }
          }
          
          console.log('[NextAuth][Credentials] ✅ Found user by email (session callback style):', {
            id: userData[0].id,
            email: userData[0].email,
            role: userData[0].role,
            provider_id: userData[0].provider_id,
          })
        } else {
          // Strategy 2: Search by provider_id (fallback)
          console.log('[NextAuth][Credentials] Email search failed, trying provider_id:', {
            listError,
            hasData: !!allUsers,
            dataLength: allUsers?.length || 0,
            provider_id: authUser.id,
          })
          
          const { data: userByProviderId, error: providerIdError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('provider_id', authUser.id)
            .order('updated_at', { ascending: false })
          
          console.log('[NextAuth][Credentials] Provider_id query result:', {
            hasError: !!providerIdError,
            error: providerIdError,
            hasData: !!userByProviderId,
            dataLength: userByProviderId?.length || 0,
          })
          
          if (!providerIdError && userByProviderId && userByProviderId.length > 0) {
            // Filter to email provider if multiple found
            const emailProviderUser = userByProviderId.find(u => u.provider === 'email')
            if (emailProviderUser) {
              userData = [emailProviderUser]
            } else {
              userData = [userByProviderId[0]]
            }
            
            console.log('[NextAuth][Credentials] ✅ Found user by provider_id:', {
              id: userData[0].id,
              email: userData[0].email,
              role: userData[0].role,
              provider_id: userData[0].provider_id,
            })
          } else {
            // Strategy 3: Case-insensitive email search
            console.log('[NextAuth][Credentials] Provider_id search failed, trying case-insensitive email:', {
              providerIdError,
              hasData: !!userByProviderId,
              dataLength: userByProviderId?.length || 0,
            })
            
            const { data: userByIlike, error: ilikeError } = await supabaseAdmin
              .from('users')
              .select('*')
              .ilike('email', email.trim())
              .order('updated_at', { ascending: false })
            
            console.log('[NextAuth][Credentials] Case-insensitive query result:', {
              hasError: !!ilikeError,
              error: ilikeError,
              hasData: !!userByIlike,
              dataLength: userByIlike?.length || 0,
            })
            
            if (!ilikeError && userByIlike && userByIlike.length > 0) {
              userData = userByIlike
              console.log('[NextAuth][Credentials] ✅ Found user by case-insensitive email:', {
                id: userByIlike[0].id,
                email: userByIlike[0].email,
                role: userByIlike[0].role,
              })
            } else {
              userError = ilikeError || listError || providerIdError
              console.error('[NextAuth][Credentials] ❌ All search strategies failed:', {
                listError,
                providerIdError,
                ilikeError,
              })
            }
          }
        }

        console.log('[NextAuth][Credentials] Query result:', {
          hasError: !!userError,
          error: userError,
          dataLength: userData?.length || 0,
          data: userData ? userData.map(u => ({ id: u.id, email: u.email, role: u.role })) : null,
        })

        // If user doesn't exist in users table, create it
        // This can happen if user was created in Supabase Auth but not in users table
        if (userError || !userData || userData.length === 0) {
          console.warn('[NextAuth][Credentials] User not found in users table, creating:', {
            email: credentials.email,
            error: userError,
            hasData: !!userData,
            dataLength: userData?.length || 0,
          })
          
          // Create user in users table
          const { data: newUser, error: createError } = await supabaseAdmin
            .from('users')
            .insert({
              email: credentials.email,
              name: authUser.user_metadata?.name || null,
              image: authUser.user_metadata?.avatar_url || null,
              provider: 'email',
              provider_id: authUser.id, // Link to Supabase Auth user
              last_login: new Date().toISOString(),
            })
            .select()
            .single()

          if (createError) {
            // If duplicate email error OR RLS policy error, user probably already exists
            // Try to fetch existing user using raw SQL query via RPC or direct query
            if (createError.code === '23505' || createError.code === '42501') {
              console.log('[NextAuth][Credentials] User already exists (duplicate or RLS), trying to fetch:', {
                email: credentials.email,
                authUserId: authUser.id,
                errorCode: createError.code,
              })
              
              // Try multiple strategies with more detailed logging
              let existingUser = null
              
              // Strategy 1: Try provider_id again (maybe RLS was blocking before)
              console.log('[NextAuth][Credentials] RLS error - retrying provider_id search')
              const { data: retryProviderId, error: retryProviderError } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('provider_id', authUser.id)
              
              console.log('[NextAuth][Credentials] Retry provider_id result:', {
                hasError: !!retryProviderError,
                error: retryProviderError,
                hasData: !!retryProviderId,
                dataLength: retryProviderId?.length || 0,
              })
              
              if (retryProviderId && retryProviderId.length > 0) {
                existingUser = retryProviderId
                console.log('[NextAuth][Credentials] ✅ Found user on retry by provider_id')
              } else {
                // Strategy 2: Exact email match
                const { data: exactMatch, error: exactMatchError } = await supabaseAdmin
                  .from('users')
                  .select('*')
                  .eq('email', email.trim().toLowerCase())
                  .order('updated_at', { ascending: false })
                
                console.log('[NextAuth][Credentials] Exact email match result:', {
                  hasError: !!exactMatchError,
                  error: exactMatchError,
                  hasData: !!exactMatch,
                  dataLength: exactMatch?.length || 0,
                })
              
                if (exactMatch && exactMatch.length > 0) {
                  existingUser = exactMatch
                } else {
                  // Strategy 3: Case-insensitive search
                  const { data: caseInsensitive, error: caseInsensitiveError } = await supabaseAdmin
                    .from('users')
                    .select('*')
                    .ilike('email', email.trim())
                    .order('updated_at', { ascending: false })
                  
                  console.log('[NextAuth][Credentials] Case-insensitive result:', {
                    hasError: !!caseInsensitiveError,
                    error: caseInsensitiveError,
                    hasData: !!caseInsensitive,
                    dataLength: caseInsensitive?.length || 0,
                  })
                
                  if (caseInsensitive && caseInsensitive.length > 0) {
                    existingUser = caseInsensitive
                  }
                }
              }
              
              if (existingUser && existingUser.length > 0) {
                userData = existingUser
                console.log('[NextAuth][Credentials] ✅ Found existing user after RLS error:', {
                  id: existingUser[0].id,
                  email: existingUser[0].email,
                  role: existingUser[0].role,
                  provider_id: existingUser[0].provider_id,
                })
              } else {
                console.error('[NextAuth][Credentials] ❌ Duplicate/RLS error but user not found after all retries:', {
                  error: createError,
                  searchedEmail: email,
                  searchedProviderId: authUser.id,
                  allRetriesFailed: true,
                })
                // Last resort: Use auth user ID and let session callback resolve it
                // Session callback will fetch role from DB using email
                return {
                  id: authUser.id,
                  email: authUser.email || email,
                  name: authUser.user_metadata?.name || null,
                  image: authUser.user_metadata?.avatar_url || null,
                }
              }
            } else {
              console.error('[NextAuth][Credentials] Failed to create user in users table:', createError)
              // If we can't create user, still allow auth but use auth user ID
              // This is a fallback - ideally this should never happen
              return {
                id: authUser.id,
                email: authUser.email || credentials.email as string,
                name: authUser.user_metadata?.name || null,
                image: authUser.user_metadata?.avatar_url || null,
              }
            }
          } else if (newUser) {
            userData = [newUser]
            console.log('[NextAuth][Credentials] Created user in users table:', newUser.id)
          } else {
            // No error but no user either - retry select
            const { data: retryUser } = await supabaseAdmin
              .from('users')
              .select('*')
              .eq('email', credentials.email)
              .order('updated_at', { ascending: false })
              .limit(1)
            
            if (retryUser && retryUser.length > 0) {
              userData = retryUser
            } else {
              // Last resort fallback
              return {
                id: authUser.id,
                email: authUser.email || credentials.email as string,
                name: authUser.user_metadata?.name || null,
                image: authUser.user_metadata?.avatar_url || null,
              }
            }
          }
        }

        // Use the user from users table (handle duplicates)
        let finalUser = userData[0]
        if (userData.length > 1) {
          // Priority: booster > admin > customer
          const boosterUser = userData.find(u => u.role === 'booster')
          if (boosterUser) {
            finalUser = boosterUser
          } else {
            const adminUser = userData.find(u => u.role === 'admin')
            if (adminUser) {
              finalUser = adminUser
            }
          }
        }

        // Update last_login (async, don't wait for it - fire and forget)
        ;(async () => {
          try {
            await supabaseAdmin
              .from('users')
              .update({ last_login: new Date().toISOString() })
              .eq('id', finalUser.id)
          } catch (err: any) {
            // Log but don't fail auth
            if (err?.code !== 'PGRST116') {
              console.error('[NextAuth][Credentials] Error updating last_login:', err)
            }
          }
        })()

        console.log('[NextAuth][Credentials] User authenticated:', {
          email: finalUser.email,
          userId: finalUser.id, // ← This should be users table ID: c8d48821-0ecf-452d-ba51-556863efb9fc
          role: finalUser.role,
          authUserId: authUser.id, // ← This is Supabase Auth ID: f309a6e3-2e55-48cd-a321-e43c71805bdb
          provider: finalUser.provider,
        })

        // Return users table ID (not Supabase Auth ID)
        // This ID will be used as token.id and token.sub in JWT callback
        const returnedUser = {
          id: finalUser.id, // ← THIS IS CRITICAL: Use users table ID
          email: finalUser.email || credentials.email as string,
          name: finalUser.name || authUser.user_metadata?.name || null,
          image: finalUser.image || authUser.user_metadata?.avatar_url || null,
        }
        
        console.log('[NextAuth][Credentials] Returning user object:', {
          id: returnedUser.id,
          email: returnedUser.email,
          expectedUsersTableId: 'c8d48821-0ecf-452d-ba51-556863efb9fc',
          isCorrect: returnedUser.id === 'c8d48821-0ecf-452d-ba51-556863efb9fc',
        })
        
        return returnedUser
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
      if (session.user && (token.sub || token.id || token.email)) {
        // ALWAYS fetch role from database (source of truth)
        // This ensures manual database changes are reflected immediately
        const { supabaseAdmin } = await import("@/lib/supabase")
        if (supabaseAdmin && token.email) {
          try {
            let userData = null
            
            // Normalize email for query (case-insensitive)
            const normalizedEmail = token.email.trim().toLowerCase()
            
            console.log('[NextAuth][session] 🔍 Fetching role from DB:', {
              tokenEmail: token.email,
              normalizedEmail,
              tokenId: token.id,
              tokenSub: token.sub,
              currentSessionRole: session.user.role,
              currentTokenRole: token.role,
            })
            
            // STRATEGY 1: Query by email FIRST (most reliable - works in session callback)
            // Try exact match first
            const { data: allUsers, error: listError } = await supabaseAdmin
              .from('users')
              .select('id, email, role, updated_at, created_at')
              .eq('email', normalizedEmail)
              .order('updated_at', { ascending: false })
            
            console.log('[NextAuth][session] Email query result:', {
              hasError: !!listError,
              error: listError,
              hasData: !!allUsers,
              dataLength: allUsers?.length || 0,
              users: allUsers?.map(u => ({ id: u.id, email: u.email, role: u.role })) || [],
            })
            
            // If exact match fails, try case-insensitive search
            let finalUsers = allUsers
            if ((listError || !allUsers || allUsers.length === 0) && normalizedEmail !== token.email) {
              console.log('[NextAuth][session] Exact match failed, trying case-insensitive search')
              const { data: caseInsensitiveUsers, error: ilikeError } = await supabaseAdmin
                .from('users')
                .select('id, email, role, updated_at, created_at')
                .ilike('email', token.email.trim())
                .order('updated_at', { ascending: false })
              
              console.log('[NextAuth][session] Case-insensitive query result:', {
                hasError: !!ilikeError,
                error: ilikeError,
                hasData: !!caseInsensitiveUsers,
                dataLength: caseInsensitiveUsers?.length || 0,
                users: caseInsensitiveUsers?.map(u => ({ id: u.id, email: u.email, role: u.role })) || [],
              })
              
              if (!ilikeError && caseInsensitiveUsers && caseInsensitiveUsers.length > 0) {
                finalUsers = caseInsensitiveUsers
              }
            }
            
            if (finalUsers && finalUsers.length > 0) {
              // Handle duplicates: prioritize booster > admin > customer
              const boosterUser = finalUsers.find(u => u.role === 'booster')
              if (boosterUser) {
                userData = boosterUser
                console.log('[NextAuth][session] ✅ Found booster user:', {
                  id: boosterUser.id,
                  email: boosterUser.email,
                  role: boosterUser.role,
                })
              } else {
                const adminUser = finalUsers.find(u => u.role === 'admin')
                if (adminUser) {
                  userData = adminUser
                  console.log('[NextAuth][session] ✅ Found admin user:', {
                    id: adminUser.id,
                    email: adminUser.email,
                    role: adminUser.role,
                  })
                } else {
                  userData = finalUsers[0]
                  console.log('[NextAuth][session] ✅ Found user (customer):', {
                    id: finalUsers[0].id,
                    email: finalUsers[0].email,
                    role: finalUsers[0].role,
                  })
                }
              }
            }
            
            // STRATEGY 2: Fallback to token.id if email query failed and token.id exists
            if (!userData && token.id) {
              const { data, error } = await supabaseAdmin
                .from('users')
                .select('id, email, role, updated_at')
                .eq('id', token.id)
                .single()
              
              if (!error && data) {
                userData = data
              }
            }
            
            if (userData) {
              // CRITICAL: Always use the users table ID (not auth user ID)
              // This ensures consistency across the app
              session.user.id = userData.id
              
              // Update token.id if it was wrong (for future requests)
              if (token.id !== userData.id) {
                const oldTokenId = token.id
                token.id = userData.id
                token.sub = userData.id
                console.log(`[NextAuth][session] 🔄 Updated token.id from ${oldTokenId} to ${userData.id} (users table ID)`)
              }
              
              const dbRole = userData.role || 'customer'
              const previousTokenRole = token.role
              const previousSessionRole = session.user.role
              
              session.user.role = dbRole
              
              // Update token role if it differs (for consistency)
              if (previousTokenRole !== dbRole) {
                token.role = dbRole
                console.log(`[NextAuth][session] 🔄 Role updated in token: ${previousTokenRole || 'none'} → ${dbRole} for user ${userData.id}`)
              }
              
              if (previousSessionRole !== dbRole) {
                console.log(`[NextAuth][session] 🔄 Role updated in session: ${previousSessionRole || 'none'} → ${dbRole}`)
              }
              
              console.log('[NextAuth][session] ✅ Final session data:', {
                id: session.user.id,
                email: session.user.email,
                role: dbRole,
                userId: userData.id,
                updatedAt: userData.updated_at,
                dbEmail: userData.email,
                dbRole: userData.role,
              })
            } else {
              // Fallback: Use token.id if available, otherwise token.sub
              session.user.id = (token.id || token.sub) as string
              // Fallback to token role if DB lookup fails
              session.user.role = (token.role as string | undefined) || 'customer'
              console.warn('[NextAuth][session] ⚠️ User not found in DB, using token role:', {
                tokenRole: token.role,
                tokenEmail: token.email,
                tokenId: token.id,
                sessionRole: session.user.role,
              })
            }
          } catch (error) {
            console.error('[NextAuth][session] Error fetching role from DB:', error)
            // Fallback: Use token.id if available, otherwise token.sub
            session.user.id = (token.id || token.sub) as string
            // Fallback to token role on error
            session.user.role = (token.role as string | undefined) || 'customer'
          }
        } else {
          // Fallback if Supabase not available or no email
          session.user.id = (token.id || token.sub) as string
          session.user.role = (token.role as string | undefined) || 'customer'
        }
      }
      return session
    },
    async jwt({ token, user, trigger }) {
      // On initial sign in or session update, fetch role from database
      if (user || trigger === 'update') {
        token.email = user?.email || token.email
        
        // CRITICAL: For credentials provider, we need to resolve the correct users table ID
        // NextAuth sets user.id to token.sub automatically, but we need users table ID
        if (user?.id) {
          // This is the ID from credentials provider (should be users table ID)
          // But let's verify it's correct by checking if it exists in users table
          const { supabaseAdmin } = await import("@/lib/supabase")
          if (supabaseAdmin && token.email) {
            // Check if this ID exists in users table
            const { data: userById } = await supabaseAdmin
              .from('users')
              .select('id')
              .eq('id', user.id)
              .single()
            
            if (userById) {
              // ID exists in users table, use it
              token.id = user.id
              token.sub = user.id
              console.log('[NextAuth][jwt] Using credentials provider ID (verified in users table):', user.id)
            } else {
              // ID doesn't exist in users table, resolve by email
              console.warn('[NextAuth][jwt] Credentials ID not found in users table, resolving by email:', {
                credentialsId: user.id,
                email: token.email,
              })
              const { data: userByEmail } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('email', token.email)
                .order('updated_at', { ascending: false })
                .limit(1)
              
              if (userByEmail && userByEmail.length > 0) {
                token.id = userByEmail[0].id
                token.sub = userByEmail[0].id
                console.log('[NextAuth][jwt] Resolved users table ID by email:', userByEmail[0].id)
              } else {
                // Fallback to credentials ID
                token.id = user.id
                token.sub = user.id
                console.warn('[NextAuth][jwt] User not found by email, using credentials ID:', user.id)
              }
            }
          } else {
            token.id = user.id
            token.sub = user.id
          }
        } else {
          // No user object, try to resolve from email
          if (token.email && !token.id) {
            const { supabaseAdmin } = await import("@/lib/supabase")
            if (supabaseAdmin) {
              const { data: userByEmail } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('email', token.email)
                .order('updated_at', { ascending: false })
                .limit(1)
              
              if (userByEmail && userByEmail.length > 0) {
                token.id = userByEmail[0].id
                if (!token.sub || token.sub === token.email) {
                  token.sub = userByEmail[0].id
                }
              }
            }
          } else {
            token.id = token.id || token.sub
          }
        }
      }
      
      // Fetch role from DB when:
      // 1. User just signed in (user object exists) - ALWAYS fetch on sign in
      // 2. Token doesn't have a role yet - First time setup
      // 3. Session is updated via updateSession() - For role changes without re-signing
      if ((user || !token.role || trigger === 'update') && (token.id || token.email)) {
        const { supabaseAdmin } = await import("@/lib/supabase")
        if (supabaseAdmin) {
          let userData = null
          let allUsers: any[] = []
          
          // Prefer user ID over email (more reliable and faster)
          if (token.id) {
            const { data, error } = await supabaseAdmin
              .from('users')
              .select('id, email, role, updated_at, created_at')
              .eq('id', token.id)
              .single()
            
            if (!error && data) {
              userData = data
              allUsers = [data]
            } else if (error && error.code !== 'PGRST116') {
              // PGRST116 is "not found" - that's OK, we'll try email
              console.error('[NextAuth][jwt] Error fetching user by ID:', error)
            }
          }
          
          // Fallback to email if ID lookup failed or ID not available
          if (!userData && token.email) {
            const { data: emailUsers, error: listError } = await supabaseAdmin
              .from('users')
              .select('id, email, role, updated_at, created_at')
              .eq('email', token.email)
              .order('updated_at', { ascending: false })
            
            if (listError) {
              console.error('[NextAuth][jwt] Error fetching users by email:', listError)
              if (!token.role) {
                token.role = 'customer'
              }
              return token
            }

            if (!emailUsers || emailUsers.length === 0) {
              console.warn('[NextAuth][jwt] user not found in DB, defaulting role to customer. email:', token.email)
              if (!token.role) {
                token.role = 'customer'
              }
              return token
            }
            
            allUsers = emailUsers
            
            if (emailUsers.length > 1) {
              console.warn(`[NextAuth][jwt] WARNING: Found ${emailUsers.length} users with email ${token.email}:`, 
                emailUsers.map(u => ({ 
                  id: u.id, 
                  role: u.role, 
                  updated_at: u.updated_at,
                  created_at: u.created_at
                })))
              
              // Priority: booster > admin > customer
              // If any user has booster role, use that
              const boosterUser = emailUsers.find(u => u.role === 'booster')
              if (boosterUser) {
                console.log(`[NextAuth][jwt] Found booster user among duplicates, using booster role from user_id: ${boosterUser.id}`)
                userData = boosterUser
                // Update token.id to the correct user ID
                token.id = boosterUser.id
              } else {
                const adminUser = emailUsers.find(u => u.role === 'admin')
                if (adminUser) {
                  console.log(`[NextAuth][jwt] Found admin user among duplicates, using admin role from user_id: ${adminUser.id}`)
                  userData = adminUser
                  // Update token.id to the correct user ID
                  token.id = adminUser.id
                } else {
                  userData = emailUsers[0]
                  // Update token.id to the correct user ID
                  token.id = emailUsers[0].id
                }
              }
            } else {
              userData = emailUsers[0]
              // Update token.id to the correct user ID
              token.id = emailUsers[0].id
            }
          }

          if (userData) {
            const previousRole = token.role
            const newRole = userData.role || 'customer'
            token.role = newRole
            
            console.log('[NextAuth][jwt] Role fetch details:', {
              email: token.email,
              userId: token.id,
              previousRole: previousRole || 'none',
              newRole: newRole,
              updatedAt: userData.updated_at,
              totalUsers: allUsers.length,
              trigger: trigger || 'none',
              hasUser: !!user,
              allRoles: allUsers.map(u => ({ id: u.id, role: u.role }))
            })
            
            if (previousRole && previousRole !== newRole) {
              console.log(`[NextAuth][jwt] 🔄 Role CHANGED: ${previousRole} → ${newRole} for user ${token.id}`)
            }
          } else {
            if (!token.role) {
              token.role = 'customer'
              console.warn('[NextAuth][jwt] User not found in DB, defaulting role to customer')
            }
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
