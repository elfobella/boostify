"use client"

import { useEffect, useState, Suspense } from "react"
import { useSession } from "next-auth/react"
import { Navbar } from "@/app/components/navbar"
import { Footer } from "@/app/components/footer"
import { User, Mail, Calendar, Shield, Settings, Package, CreditCard, LogOut } from "lucide-react"
import Image from "next/image"
import { useLocaleContext } from "@/contexts"
import { signOut } from "next-auth/react"

function ProfileContent() {
  const { data: session, status } = useSession()
  const { t } = useLocaleContext()
  const [loginModalOpen, setLoginModalOpen] = useState(false)

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar onOpenLoginModal={() => setLoginModalOpen(true)} />
        <main className="flex-1 flex items-center justify-center py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-100 mb-4">Please Sign In</h1>
            <p className="text-gray-400 mb-8">You need to be logged in to view your profile.</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const userInitials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U"

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onOpenLoginModal={() => {}} />
      
      <main className="flex-1 mt-16 py-12 md:py-24">
        <div className="container px-4">
          <div className="max-w-5xl mx-auto">
            {/* Profile Header */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-gray-800 rounded-2xl p-8 md:p-12 mb-8 shadow-xl">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      width={120}
                      height={120}
                      className="rounded-full border-4 border-blue-500/30"
                    />
                  ) : (
                    <div className="w-[120px] h-[120px] rounded-full border-4 border-blue-500/30 bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">{userInitials}</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-zinc-950"></div>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-2">
                    {session.user.name || "User"}
                  </h1>
                  <p className="text-gray-400 text-lg mb-4">
                    {session.user.email}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>Member since 2024</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <Shield className="h-4 w-4" />
                      <span>Verified Account</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleSignOut}
                  className="px-6 py-3 border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  <LogOut className="h-5 w-5" />
                  {t("auth.signOut")}
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-950/50 to-cyan-950/50 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Package className="h-8 w-8 text-blue-400" />
                  <span className="text-3xl font-bold text-blue-400">0</span>
                </div>
                <h3 className="text-gray-400 text-sm font-medium">Total Orders</h3>
              </div>

              <div className="bg-gradient-to-br from-cyan-950/50 to-emerald-950/50 border border-cyan-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <CreditCard className="h-8 w-8 text-cyan-400" />
                  <span className="text-3xl font-bold text-cyan-400">$0</span>
                </div>
                <h3 className="text-gray-400 text-sm font-medium">Total Spent</h3>
              </div>

              <div className="bg-gradient-to-br from-emerald-950/50 to-blue-950/50 border border-emerald-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Shield className="h-8 w-8 text-emerald-400" />
                  <span className="text-3xl font-bold text-emerald-400">0</span>
                </div>
                <h3 className="text-gray-400 text-sm font-medium">Active Services</h3>
              </div>
            </div>

            {/* Account Details */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-gray-800 rounded-2xl p-8 md:p-12 shadow-xl mb-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
                <Settings className="h-6 w-6 text-blue-400" />
                <h2 className="text-2xl font-bold text-gray-100">Account Details</h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg border border-gray-700">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <User className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">Full Name</p>
                    <p className="text-gray-100 font-medium">{session.user.name || "Not set"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg border border-gray-700">
                  <div className="p-3 bg-cyan-500/20 rounded-lg">
                    <Mail className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">Email Address</p>
                    <p className="text-gray-100 font-medium">{session.user.email || "Not set"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg border border-gray-700">
                  <div className="p-3 bg-emerald-500/20 rounded-lg">
                    <Shield className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">Account Status</p>
                    <p className="text-emerald-400 font-medium">Verified</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-gray-800 rounded-2xl p-8 md:p-12 shadow-xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-blue-400" />
                  <h2 className="text-2xl font-bold text-gray-100">Recent Orders</h2>
                </div>
              </div>

              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No orders yet</p>
                <p className="text-sm text-gray-600">Your boosting orders will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function ProfilePage() {
  const [loginModalOpen, setLoginModalOpen] = useState(false)

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  )
}

