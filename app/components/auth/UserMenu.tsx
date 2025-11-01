"use client"

import * as React from "react"
import { User, LogOut, Settings, Briefcase } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useLocaleContext } from "@/contexts"
import Image from "next/image"
import { useRouter } from "next/navigation"

export function UserMenu() {
  const { data: session } = useSession()
  const { t } = useLocaleContext()
  const [isOpen, setIsOpen] = React.useState(false)
  const [userRole, setUserRole] = React.useState<string>('customer')
  const router = useRouter()

  React.useEffect(() => {
    if (session?.user) {
      fetchUserRole()
    }
  }, [session])

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/user/role')
      if (response.ok) {
        const data = await response.json()
        setUserRole(data.role || 'customer')
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
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

