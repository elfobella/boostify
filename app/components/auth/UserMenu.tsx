"use client"

import * as React from "react"
import { User, LogOut, Settings, Briefcase, MessageCircle, Wallet } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useLocaleContext } from "@/contexts"
import Image from "next/image"
import { useRouter } from "next/navigation"

export function UserMenu() {
  const { data: session, update: updateSession } = useSession()
  const { t } = useLocaleContext()
  const [isOpen, setIsOpen] = React.useState(false)
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [balance, setBalance] = React.useState<{ balance: number; cashback: number } | null>(null)
  const router = useRouter()
  
  const userRole = session?.user?.role || 'customer'
  
  // Log session info (no auto-refresh to avoid loops)
  React.useEffect(() => {
    if (session?.user) {
      console.log('[UserMenu] session user:', {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role || 'undefined',
      })
    }
  }, [session?.user?.id, session?.user?.email, session?.user?.role])

  React.useEffect(() => {
    if (session?.user) {
      fetchUnreadCount()
      fetchBalance()
    }
  }, [session])

  React.useEffect(() => {
    if (!session?.user) return

    const interval = setInterval(() => {
      fetchBalance()
    }, 30000) // Update balance every 30 seconds

    return () => clearInterval(interval)
  }, [session?.user?.id])

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/balance')
      if (response.ok) {
        const data = await response.json()
        setBalance(data)
      }
    } catch (error) {
      console.error('[UserMenu] Error fetching balance:', error)
    }
  }

  React.useEffect(() => {
    if (!session?.user) return

    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 15000)

    return () => clearInterval(interval)
  }, [session?.user?.id])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/chats/users')
      if (response.ok) {
        const data = await response.json()
        const count = typeof data.unreadCount === 'number' ? data.unreadCount : 0
        setUnreadCount(count)
      } else {
        // Endpoint might be unavailable in some environments; ignore
        setUnreadCount(0)
        console.warn('[UserMenu] /api/chats/users responded with status:', response.status)
      }
    } catch (error) {
      console.error('[UserMenu] Error fetching unread count:', error)
    }
  }

  if (!session?.user) {
    return null
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  const userInitials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U"

  return (
    <div className="relative">
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 z-10 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-zinc-950" />
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-gray-800 bg-zinc-900 hover:bg-zinc-800 transition-colors"
      >
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || "User"}
            width={24}
            height={24}
            className="rounded-full"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">{userInitials}</span>
          </div>
        )}
        <span className="hidden md:block text-sm font-medium text-gray-100 max-w-[120px] truncate">
          {session.user.name}
        </span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-800 bg-zinc-900 shadow-xl z-50 overflow-hidden">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-800">
              <div className="flex items-center gap-3">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{userInitials}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-100 truncate">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {session.user.email}
                  </p>
                </div>
              </div>
              
              {/* Wallet Info */}
              {balance !== null && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-blue-400" />
                      <span className="text-xs text-gray-400">Wallet</span>
                    </div>
                    <p className="text-sm font-bold text-blue-400">
                      ${balance.balance.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  router.push("/profile")
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 transition-colors"
              >
                <User className="h-4 w-4" />
                {t("auth.profile")}
              </button>

              {userRole === 'booster' && (
                <button
                  onClick={() => {
                    router.push("/booster/dashboard")
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 transition-colors"
                >
                  <Briefcase className="h-4 w-4" />
                  Booster Dashboard
                </button>
              )}

              <button
                onClick={() => {
                  router.push("/balance")
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 transition-colors"
              >
                <Wallet className="h-4 w-4" />
                Balance
              </button>

              <button
                onClick={() => {
                  router.push("/chats")
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 transition-colors relative"
              >
                <MessageCircle className="h-4 w-4" />
                Chats
                {unreadCount > 0 && (
                  <span className="ml-auto px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-zinc-800 transition-colors"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>

              <div className="border-t border-gray-800 my-2" />

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {t("auth.signOut")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

