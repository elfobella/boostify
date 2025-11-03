"use client"

import { Suspense, useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Navbar } from "@/app/components/navbar"
import { Footer } from "@/app/components/footer"
import { User, Mail, Calendar, Shield, Settings, Package, CreditCard, LogOut, Clock, ArrowRight, CheckCircle, XCircle, Loader2 } from "lucide-react"
import Image from "next/image"
import { useLocaleContext } from "@/contexts"
import { signOut } from "next-auth/react"
import { ProfileSkeleton } from "@/app/components/ui"

interface Order {
  id: string
  game: string
  service_category: string
  game_account: string
  current_level: string
  target_level: string
  amount: number
  currency: string
  status: string
  created_at: string
  estimated_time?: string
}

interface OrderStats {
  totalOrders: number
  totalSpent: number
  activeServices: number
}

function ProfileContent() {
  const { data: session, status } = useSession()
  const { t } = useLocaleContext()
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    totalSpent: 0,
    activeServices: 0,
  })
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)
  const [approvingOrderId, setApprovingOrderId] = useState<string | null>(null)
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user) {
      fetchOrders()
    }
  }, [session])

  const fetchOrders = async () => {
    setIsLoadingOrders(true)
    try {
      const response = await fetch('/api/orders/user')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setStats(data.stats || { totalOrders: 0, totalSpent: 0, activeServices: 0 })
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const handleApproveOrder = async (orderId: string) => {
    setApprovingOrderId(orderId)
    try {
      const response = await fetch(`/api/orders/${orderId}/approve`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        await fetchOrders()
        alert('Order approved! Payment has been released.')
      } else {
        alert(data.error || 'Failed to approve order')
      }
    } catch (error) {
      console.error('Error approving order:', error)
      alert('Error approving order. Please try again.')
    } finally {
      setApprovingOrderId(null)
    }
  }

  const handleRejectOrder = async (orderId: string) => {
    const reason = prompt('Please provide a reason for rejecting this order:')
    if (!reason) return

    setRejectingOrderId(orderId)
    try {
      const response = await fetch(`/api/orders/${orderId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchOrders()
        alert('Order rejected. Refund has been processed.')
      } else {
        alert(data.error || 'Failed to reject order')
      }
    } catch (error) {
      console.error('Error rejecting order:', error)
      alert('Error rejecting order. Please try again.')
    } finally {
      setRejectingOrderId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/20'
      case 'processing':
        return 'text-blue-400 bg-blue-500/20'
      case 'awaiting_review':
        return 'text-purple-400 bg-purple-500/20'
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20'
      case 'cancelled':
        return 'text-red-400 bg-red-500/20'
      default:
        return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'processing':
        return 'Processing'
      case 'awaiting_review':
        return 'Awaiting Your Review'
      case 'pending':
        return 'Pending'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getCategoryDisplay = (category: string) => {
    const categoryMap: Record<string, string> = {
      'trophy-boosting': 'Trophy Boosting',
      'uc-medals-boosting': 'UC Medals Boosting',
      'crowns-boosting': 'Crowns Boosting',
    }
    return categoryMap[category] || category
  }

  if (status === "loading") {
    return (
      <>
        <Navbar />
        <ProfileSkeleton />
        <Footer />
      </>
    )
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-100 mb-4">{t("profile.pleaseSignIn")}</h1>
            <p className="text-gray-400 mb-8">{t("profile.signInDescription")}</p>
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
      <Navbar />
      
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
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-2 line-clamp-2">
                    {session.user.name || t("profile.user")}
                  </h1>
                  <p className="text-gray-400 text-lg mb-4 line-clamp-1">
                    {session.user.email}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>{t("profile.memberSince")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <Shield className="h-4 w-4" />
                      <span>{t("profile.verifiedAccount")}</span>
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
                  <span className="text-3xl font-bold text-blue-400">{stats.totalOrders}</span>
                </div>
                <h3 className="text-gray-400 text-sm font-medium">{t("profile.totalOrders")}</h3>
              </div>

              <div className="bg-gradient-to-br from-cyan-950/50 to-emerald-950/50 border border-cyan-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <CreditCard className="h-8 w-8 text-cyan-400" />
                  <span className="text-3xl font-bold text-cyan-400">${stats.totalSpent.toFixed(2)}</span>
                </div>
                <h3 className="text-gray-400 text-sm font-medium">{t("profile.totalSpent")}</h3>
              </div>

              <div className="bg-gradient-to-br from-emerald-950/50 to-blue-950/50 border border-emerald-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Shield className="h-8 w-8 text-emerald-400" />
                  <span className="text-3xl font-bold text-emerald-400">{stats.activeServices}</span>
                </div>
                <h3 className="text-gray-400 text-sm font-medium">{t("profile.activeServices")}</h3>
              </div>
            </div>

            {/* Account Details */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-gray-800 rounded-2xl p-8 md:p-12 shadow-xl mb-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
                <Settings className="h-6 w-6 text-blue-400" />
                <h2 className="text-2xl font-bold text-gray-100">{t("profile.accountDetails")}</h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg border border-gray-700">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <User className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-400 mb-1">{t("profile.fullName")}</p>
                    <p className="text-gray-100 font-medium line-clamp-2">{session.user.name || t("profile.notSet")}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg border border-gray-700">
                  <div className="p-3 bg-cyan-500/20 rounded-lg">
                    <Mail className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-400 mb-1">{t("profile.emailAddress")}</p>
                    <p className="text-gray-100 font-medium line-clamp-1">{session.user.email || t("profile.notSet")}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg border border-gray-700">
                  <div className="p-3 bg-emerald-500/20 rounded-lg">
                    <Shield className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-400 mb-1">{t("profile.accountStatus")}</p>
                    <p className="text-emerald-400 font-medium line-clamp-1">{t("profile.verified")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-gray-800 rounded-2xl p-8 md:p-12 shadow-xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-blue-400" />
                  <h2 className="text-2xl font-bold text-gray-100">{t("profile.recentOrders")}</h2>
                </div>
              </div>

              {isLoadingOrders ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">{t("profile.noOrdersYet")}</p>
                  <p className="text-sm text-gray-600">{t("profile.ordersDescription")}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/50 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-200 rounded-lg overflow-hidden group"
                    >
                      {/* Gradient accent */}
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="p-3">
                        {/* Mobile/Tablet Layout */}
                        <div className="block md:hidden space-y-2.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                                <Package className="h-4 w-4 text-blue-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-sm font-semibold text-gray-100 truncate">
                                    {getCategoryDisplay(order.service_category)}
                                  </h3>
                                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${getStatusColor(order.status)}`}>
                                    {getStatusText(order.status)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                  <span className="truncate">{order.game_account}</span>
                                  <span className="text-gray-600">•</span>
                                  <span>{order.current_level} → {order.target_level}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-lg font-bold text-blue-400">
                                ${Number(order.amount).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          
                          {/* Approve/Reject Buttons (only for awaiting_review orders) */}
                          {order.status === 'awaiting_review' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveOrder(order.id)}
                                disabled={approvingOrderId === order.id}
                                className="flex-1 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {approvingOrderId === order.id ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Approving...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    Approve
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleRejectOrder(order.id)}
                                disabled={rejectingOrderId === order.id}
                                className="flex-1 px-3 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {rejectingOrderId === order.id ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Rejecting...
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3.5 w-3.5" />
                                    Reject
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden md:flex items-center justify-between gap-6">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="p-3 bg-blue-500/20 rounded-lg flex-shrink-0">
                              <Package className="h-6 w-6 text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-100 truncate">
                                  {getCategoryDisplay(order.service_category)}
                                </h3>
                                <span className={`px-2.5 py-1 rounded-md text-xs font-medium flex-shrink-0 ${getStatusColor(order.status)}`}>
                                  {getStatusText(order.status)}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-400">
                                <p className="truncate">
                                  <span className="font-medium text-gray-300">Account:</span> {order.game_account}
                                </p>
                                <p>
                                  <span className="font-medium text-gray-300">Progress:</span> {order.current_level} → {order.target_level}
                                </p>
                                {order.estimated_time && (
                                  <p className="flex items-center gap-2 col-span-2">
                                    <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span>{order.estimated_time}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-3 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-blue-400">
                                ${Number(order.amount).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">{order.currency.toUpperCase()}</p>
                            </div>
                            <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                            
                            {/* Approve/Reject Buttons (only for awaiting_review orders) */}
                            {order.status === 'awaiting_review' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApproveOrder(order.id)}
                                  disabled={approvingOrderId === order.id}
                                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                  {approvingOrderId === order.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Approving...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4" />
                                      Approve
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleRejectOrder(order.id)}
                                  disabled={rejectingOrderId === order.id}
                                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                  {rejectingOrderId === order.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Rejecting...
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-4 w-4" />
                                      Reject
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <>
        <Navbar />
        <ProfileSkeleton />
        <Footer />
      </>
    }>
      <ProfileContent />
    </Suspense>
  )
}

