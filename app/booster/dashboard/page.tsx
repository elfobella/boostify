"use client"

import { Suspense, useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/app/components/navbar"
import { Footer } from "@/app/components/footer"
import { Package, CreditCard, CheckCircle, Clock, TrendingUp, AlertCircle, Loader2, ExternalLink } from "lucide-react"
import { useLocaleContext } from "@/contexts"
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
  claimed_at?: string
  estimated_time?: string
}

interface BoosterStats {
  totalOrders: number
  completedOrders: number
  activeOrders: number
  totalEarnings: number
}

function BoosterDashboardContent() {
  const { data: session, status } = useSession()
  const { t } = useLocaleContext()
  const router = useRouter()
  const [availableOrders, setAvailableOrders] = useState<Order[]>([])
  const [myOrders, setMyOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<BoosterStats>({
    totalOrders: 0,
    completedOrders: 0,
    activeOrders: 0,
    totalEarnings: 0,
  })
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(true)
  const [isLoadingMyOrders, setIsLoadingMyOrders] = useState(true)
  const [activeTab, setActiveTab] = useState<'available' | 'my-orders'>('available')
  const [claimingOrderId, setClaimingOrderId] = useState<string | null>(null)
  const [completingOrderId, setCompletingOrderId] = useState<string | null>(null)
  
  // Stripe Connect onboarding state
  const [connectStatus, setConnectStatus] = useState<{
    hasAccount: boolean
    onboardingComplete: boolean
    readyToAccept: boolean
    status: string
  } | null>(null)
  const [isLoadingConnect, setIsLoadingConnect] = useState(true)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [isGettingLink, setIsGettingLink] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchAvailableOrders()
      fetchMyOrders()
      fetchConnectStatus()
    }
  }, [session])

  const fetchConnectStatus = async () => {
    setIsLoadingConnect(true)
    try {
      const response = await fetch('/api/boosters/connect/status')
      if (response.ok) {
        const data = await response.json()
        setConnectStatus(data)
      }
    } catch (error) {
      console.error('Error fetching Connect status:', error)
    } finally {
      setIsLoadingConnect(false)
    }
  }

  const handleCreateAccount = async () => {
    setIsCreatingAccount(true)
    try {
      const response = await fetch('/api/boosters/connect/create-account', {
        method: 'POST',
      })
      if (response.ok) {
        await fetchConnectStatus()
      } else {
        const error = await response.json()
        // Show more helpful error message
        if (error.error?.includes('Connect is not enabled')) {
          alert(
            `Stripe Connect Setup Required\n\n` +
            `Stripe Connect is not enabled for this platform.\n\n` +
            `Please:\n` +
            `1. Go to https://dashboard.stripe.com/connect/overview\n` +
            `2. Enable Connect for your platform\n` +
            `3. Then try again\n\n` +
            `See docs/STRIPE_CONNECT_SETUP.md for details.`
          )
        } else {
          alert(error.error || 'Failed to create account')
        }
      }
    } catch (error) {
      console.error('Error creating account:', error)
      alert('Failed to create account. Please check the console for details.')
    } finally {
      setIsCreatingAccount(false)
    }
  }

  const handleGetOnboardingLink = async () => {
    setIsGettingLink(true)
    try {
      const response = await fetch('/api/boosters/connect/onboard-link', {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        // Open Stripe onboarding in new tab
        window.open(data.url, '_blank')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to generate onboarding link')
      }
    } catch (error) {
      console.error('Error getting onboarding link:', error)
      alert('Failed to generate onboarding link')
    } finally {
      setIsGettingLink(false)
    }
  }

  const fetchAvailableOrders = async () => {
    setIsLoadingAvailable(true)
    try {
      const response = await fetch('/api/orders/available')
      if (response.ok) {
        const data = await response.json()
        setAvailableOrders(data.orders || [])
      } else if (response.status === 403) {
        // Not a booster, redirect or show message
        console.error('User is not a booster')
      }
    } catch (error) {
      console.error('Error fetching available orders:', error)
    } finally {
      setIsLoadingAvailable(false)
    }
  }

  const fetchMyOrders = async () => {
    setIsLoadingMyOrders(true)
    try {
      const response = await fetch('/api/orders/booster')
      if (response.ok) {
        const data = await response.json()
        setMyOrders(data.orders || [])
        setStats(data.stats || {
          totalOrders: 0,
          completedOrders: 0,
          activeOrders: 0,
          totalEarnings: 0,
        })
      } else if (response.status === 403) {
        console.error('User is not a booster')
      }
    } catch (error) {
      console.error('Error fetching my orders:', error)
    } finally {
      setIsLoadingMyOrders(false)
    }
  }

  const handleClaimOrder = async (orderId: string) => {
    setClaimingOrderId(orderId)
    try {
      const response = await fetch('/api/orders/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh both lists
        await fetchAvailableOrders()
        await fetchMyOrders()
        alert('Order claimed successfully!')
      } else {
        alert(data.error || 'Failed to claim order')
      }
    } catch (error) {
      console.error('Error claiming order:', error)
      alert('Error claiming order. Please try again.')
    } finally {
      setClaimingOrderId(null)
    }
  }

  const handleCompleteOrder = async (orderId: string) => {
    setCompletingOrderId(orderId)
    try {
      const response = await fetch(`/api/orders/${orderId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh orders
        await fetchMyOrders()
        alert('Order marked as complete! Waiting for customer approval.')
      } else {
        alert(data.error || 'Failed to complete order')
      }
    } catch (error) {
      console.error('Error completing order:', error)
      alert('Error completing order. Please try again.')
    } finally {
      setCompletingOrderId(null)
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
        return 'Awaiting Review'
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
      hour: '2-digit',
      minute: '2-digit',
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
            <h1 className="text-4xl font-bold text-gray-100 mb-4">Please Sign In</h1>
            <p className="text-gray-400 mb-8">You need to be logged in to access the booster dashboard.</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1 mt-16 py-12 md:py-24">
        <div className="container px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-100 mb-2">Booster Dashboard</h1>
              <p className="text-gray-400">Manage and claim available orders</p>
            </div>

            {/* Stripe Connect Onboarding Banner */}
            {!isLoadingConnect && connectStatus && !connectStatus.readyToAccept && (
              <div className="mb-8 bg-gradient-to-r from-yellow-950/50 to-orange-950/50 border border-yellow-500/30 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-100 mb-2">
                      {!connectStatus.hasAccount 
                        ? 'Setup Payment Account Required'
                        : 'Complete Payment Setup'}
                    </h3>
                    <p className="text-gray-300 mb-4">
                      {!connectStatus.hasAccount
                        ? 'You need to setup your Stripe Connect account to start receiving automatic payments. Click below to get started.'
                        : 'Complete your Stripe onboarding to start receiving orders automatically.'}
                    </p>
                    <div className="flex gap-3">
                      {!connectStatus.hasAccount ? (
                        <button
                          onClick={handleCreateAccount}
                          disabled={isCreatingAccount}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {isCreatingAccount ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            'Create Stripe Account'
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={handleGetOnboardingLink}
                          disabled={isGettingLink}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {isGettingLink ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              Complete Onboarding
                              <ExternalLink className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-950/50 to-cyan-950/50 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Package className="h-8 w-8 text-blue-400" />
                  <span className="text-3xl font-bold text-blue-400">{stats.totalOrders}</span>
                </div>
                <h3 className="text-gray-400 text-sm font-medium">Total Orders</h3>
              </div>

              <div className="bg-gradient-to-br from-green-950/50 to-emerald-950/50 border border-green-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                  <span className="text-3xl font-bold text-green-400">{stats.completedOrders}</span>
                </div>
                <h3 className="text-gray-400 text-sm font-medium">Completed</h3>
              </div>

              <div className="bg-gradient-to-br from-yellow-950/50 to-orange-950/50 border border-yellow-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="h-8 w-8 text-yellow-400" />
                  <span className="text-3xl font-bold text-yellow-400">{stats.activeOrders}</span>
                </div>
                <h3 className="text-gray-400 text-sm font-medium">Active</h3>
              </div>

              <div className="bg-gradient-to-br from-purple-950/50 to-pink-950/50 border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="h-8 w-8 text-purple-400" />
                  <span className="text-3xl font-bold text-purple-400">${stats.totalEarnings.toFixed(2)}</span>
                </div>
                <h3 className="text-gray-400 text-sm font-medium">Total Earnings</h3>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-gray-800 rounded-2xl p-4 md:p-8 lg:p-12 shadow-xl">
              <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-6 pb-3 md:pb-4 border-b border-gray-800">
                <button
                  onClick={() => setActiveTab('available')}
                  className={`px-3 py-2 md:px-6 md:py-3 rounded-lg text-sm md:text-base font-semibold transition-colors ${
                    activeTab === 'available'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Available ({availableOrders.length})
                </button>
                <button
                  onClick={() => setActiveTab('my-orders')}
                  className={`px-3 py-2 md:px-6 md:py-3 rounded-lg text-sm md:text-base font-semibold transition-colors ${
                    activeTab === 'my-orders'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  My Orders ({myOrders.length})
                </button>
              </div>

              {/* Available Orders Tab */}
              {activeTab === 'available' && (
                <div>
                  {isLoadingAvailable ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                      <p className="text-gray-500">Loading available orders...</p>
                    </div>
                  ) : availableOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">No available orders</p>
                      <p className="text-sm text-gray-600">All orders have been claimed</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {availableOrders.map((order) => (
                        <div
                          key={order.id}
                          className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/50 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-200 rounded-lg overflow-hidden group"
                        >
                          {/* Gradient accent */}
                          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          
                          <div className="p-3">
                            {/* Mobile/Tablet Layout */}
                            <div className="block md:hidden space-y-2.5">
                              {/* Header */}
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
                              
                              {/* Claim Button */}
                              <button
                                onClick={() => handleClaimOrder(order.id)}
                                disabled={claimingOrderId === order.id}
                                className="w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {claimingOrderId === order.id ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Claiming...
                                  </>
                                ) : (
                                  <>
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    Claim Order
                                  </>
                                )}
                              </button>
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
                                    <p className="text-xs text-gray-500 col-span-2">
                                      Created: {formatDate(order.created_at)}
                                    </p>
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
                                <button
                                  onClick={() => handleClaimOrder(order.id)}
                                  disabled={claimingOrderId === order.id}
                                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                  {claimingOrderId === order.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Claiming...
                                    </>
                                  ) : (
                                    <>
                                      <TrendingUp className="h-4 w-4" />
                                      Claim Order
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* My Orders Tab */}
              {activeTab === 'my-orders' && (
                <div>
                  {isLoadingMyOrders ? (
                    <div className="text-center py-12">
                      <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                      <p className="text-gray-500">Loading your orders...</p>
                    </div>
                  ) : myOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">No orders yet</p>
                      <p className="text-sm text-gray-600">Claim orders from the "Available Orders" tab</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {myOrders.map((order) => (
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
                              
                              {/* Mark Complete Button (only for processing orders) */}
                              {order.status === 'processing' && (
                                <button
                                  onClick={() => handleCompleteOrder(order.id)}
                                  disabled={completingOrderId === order.id}
                                  className="w-full px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                  {completingOrderId === order.id ? (
                                    <>
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      Completing...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-3.5 w-3.5" />
                                      Mark as Complete
                                    </>
                                  )}
                                </button>
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
                                    {order.claimed_at && (
                                      <p className="text-xs text-green-400 col-span-2">
                                        Claimed: {formatDate(order.claimed_at)}
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
                                
                                {/* Mark Complete Button (only for processing orders) */}
                                {order.status === 'processing' && (
                                  <button
                                    onClick={() => handleCompleteOrder(order.id)}
                                    disabled={completingOrderId === order.id}
                                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                  >
                                    {completingOrderId === order.id ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Completing...
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4" />
                                        Mark Complete
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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

export default function BoosterDashboardPage() {
  return (
    <Suspense fallback={
      <>
        <Navbar />
        <ProfileSkeleton />
        <Footer />
      </>
    }>
      <BoosterDashboardContent />
    </Suspense>
  )
}

