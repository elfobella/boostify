"use client"

import { Suspense, useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Navbar } from "@/app/components/navbar"
import { Footer } from "@/app/components/footer"
import { User, Mail, Calendar, Shield, Settings, Package, CreditCard, LogOut, Clock, CheckCircle, XCircle, Loader2, Star, MessageCircle, UserCircle2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useLocaleContext } from "@/contexts"
import { signOut } from "next-auth/react"
import { ProfileSkeleton } from "@/app/components/ui"
import { supabase } from "@/lib/supabase"
import { BalanceSection } from "@/app/components/balance/BalanceSection"

interface BoosterProfile {
  id: string
  name: string | null
  image: string | null
}

interface BoosterFeedback {
  id: string
  order_id: string
  booster_id: string
  customer_id: string
  rating: number | null
  comment: string | null
  created_at: string
  updated_at: string
}

interface BoosterFeedbackSummary {
  averageRating: number | null
  totalFeedbacks: number
}

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
  booster_id?: string | null
  booster_profile?: BoosterProfile | null
  feedback?: BoosterFeedback | null
  booster_feedback_summary?: BoosterFeedbackSummary | null
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
  const [hasLoadedOrders, setHasLoadedOrders] = useState(false)
  const previousUserIdRef = useRef<string | undefined>(undefined)
  const [approvingOrderId, setApprovingOrderId] = useState<string | null>(null)
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null)
  const [feedbackOrder, setFeedbackOrder] = useState<Order | null>(null)
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [feedbackComment, setFeedbackComment] = useState("")
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  const fetchOrders = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoadingOrders(true)
    }
    try {
      const response = await fetch('/api/orders/user')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setStats(data.stats || { totalOrders: 0, totalSpent: 0, activeServices: 0 })
        setHasLoadedOrders(true)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      if (showLoading) {
        setIsLoadingOrders(false)
      }
    }
  }, [])

  useEffect(() => {
    const currentUserId = session?.user?.id
    
    // Only fetch if:
    // 1. User exists and we haven't loaded orders yet, OR
    // 2. User ID has changed (different user logged in)
    if (currentUserId) {
      if (!hasLoadedOrders || previousUserIdRef.current !== currentUserId) {
        previousUserIdRef.current = currentUserId
        fetchOrders()
      }
    } else if (previousUserIdRef.current) {
      // User logged out - reset state
      previousUserIdRef.current = undefined
      setHasLoadedOrders(false)
      setIsLoadingOrders(false)
      setOrders([])
    }
  }, [session?.user?.id, hasLoadedOrders, fetchOrders])

  // Subscribe to realtime order updates
  useEffect(() => {
    if (!supabase || !session?.user?.id) return
    const client = supabase

    const channel = client
      .channel(`orders:user:${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => {
          fetchOrders(false)
        }
      )
      .subscribe()

    return () => {
      client.removeChannel(channel)
    }
  }, [session?.user?.id, fetchOrders])

  const handleApproveOrder = async (orderId: string) => {
    setApprovingOrderId(orderId)
    try {
      const response = await fetch(`/api/orders/${orderId}/approve`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        await fetchOrders(false) // Don't show loading spinner on refresh
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
        await fetchOrders(false) // Don't show loading spinner on refresh
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

  const getGameIcon = (game: string) => {
    const gameIcons: Record<string, string> = {
      'clash-royale': '/clash-royale.jpg',
      'league-of-legends': '/league-of-legends.jpeg',
      'valorant': '/valorant.jpeg',
    }
    return gameIcons[game] || '/clash-royale.jpg' // Default to Clash Royale
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

  const handleOpenFeedbackModal = (order: Order) => {
    setFeedbackOrder(order)
    setFeedbackRating(order.feedback?.rating ?? null)
    setHoverRating(null)
    setFeedbackComment(order.feedback?.comment ?? "")
    setFeedbackError(null)
  }

  const handleCloseFeedbackModal = () => {
    setFeedbackOrder(null)
    setFeedbackRating(null)
    setHoverRating(null)
    setFeedbackComment("")
    setFeedbackError(null)
    setIsSubmittingFeedback(false)
  }

  const handleSubmitFeedback = async () => {
    if (!feedbackOrder) return

    const trimmedComment = feedbackComment.trim()

    if ((feedbackRating === null || feedbackRating === undefined) && trimmedComment.length === 0) {
      setFeedbackError("Please provide a rating or a comment.")
      return
    }

    try {
      setIsSubmittingFeedback(true)
      setFeedbackError(null)

      const isUpdating = Boolean(feedbackOrder.feedback)

      const response = await fetch(`/api/orders/${feedbackOrder.id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: feedbackRating,
          comment: trimmedComment.length > 0 ? trimmedComment : null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchOrders(false) // Don't show loading spinner on refresh
        alert(isUpdating ? 'Feedback updated. Thank you!' : 'Thank you for sharing your feedback!')
        handleCloseFeedbackModal()
      } else {
        setFeedbackError(data.error || 'Failed to submit feedback. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setFeedbackError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  const renderFeedbackSummary = (order: Order) => {
    if (!order.feedback) return null

    const ratingValue = order.feedback.rating ?? 0

    return (
      <div className="rounded-md md:rounded-xl border border-gray-800/50 md:border-gray-800/70 bg-zinc-900/30 md:bg-zinc-900/70 px-2 py-1.5 md:px-3 md:py-2">
        <div className="flex items-center justify-between gap-1.5 md:gap-2">
          <div className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs text-gray-200">
            {Array.from({ length: 5 }).map((_, index) => {
              const starValue = index + 1
              return (
                <Star
                  key={starValue}
                  className={`h-2.5 w-2.5 md:h-3.5 md:w-3.5 ${starValue <= ratingValue ? 'text-yellow-300' : 'text-gray-600'}`}
                  fill={starValue <= ratingValue ? 'currentColor' : 'none'}
                />
              )
            })}
            {ratingValue > 0 && <span className="font-semibold text-gray-100 text-[10px] md:text-xs">{ratingValue.toFixed(1)}</span>}
          </div>
          <button
            onClick={() => handleOpenFeedbackModal(order)}
            className="rounded-full border border-gray-700/50 md:border-gray-700 px-1.5 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-[11px] font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-gray-100"
          >
            Edit
          </button>
        </div>
        {order.feedback.comment && (
          <div className="mt-1.5 md:mt-2 flex items-start gap-1.5 md:gap-2 text-[10px] md:text-xs text-gray-300">
            <MessageCircle className="mt-0.5 h-3 w-3 md:h-3.5 md:w-3.5 text-gray-500 flex-shrink-0" />
            <p className="whitespace-pre-line leading-relaxed line-clamp-2 md:line-clamp-none">{order.feedback.comment}</p>
          </div>
        )}
      </div>
    )
  }

  const renderBoosterAssignment = (order: Order) => {
    if (!order.booster_profile) return null

    const ratingValue = order.booster_feedback_summary?.averageRating ?? null
    const totalFeedbacks = order.booster_feedback_summary?.totalFeedbacks ?? 0

    return (
      <div className="flex items-center justify-between gap-2 md:gap-3 rounded-md md:rounded-lg border border-gray-800/50 md:border-gray-800/70 bg-zinc-900/30 md:bg-zinc-900/70 px-2 py-1.5 md:px-3 md:py-2">
        <div className="flex items-center gap-2 md:gap-2.5">
          {order.booster_profile.image ? (
            <Image
              src={order.booster_profile.image}
              alt={order.booster_profile.name || 'Booster'}
              width={24}
              height={24}
              className="md:w-8 md:h-8 rounded-full border border-blue-400/40 object-cover"
            />
          ) : (
            <div className="flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/10">
              <UserCircle2 className="h-3 w-3 md:h-[18px] md:w-[18px] text-blue-200" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="hidden md:inline text-[11px] uppercase tracking-wide text-blue-200/60">Booster</span>
            <span className="text-xs md:text-sm font-medium text-blue-100 truncate">
              {order.booster_profile.name || 'Unnamed Booster'}
            </span>
            {totalFeedbacks > 0 && (
              <span className="flex items-center gap-0.5 md:gap-1 text-[10px] md:text-[11px] text-blue-200/70">
                <Star className="h-2.5 w-2.5 md:h-3 md:w-3 text-yellow-300" />
                {ratingValue ? ratingValue.toFixed(1) : 'New'}
                <span className="text-blue-200/50">· {totalFeedbacks}</span>
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/boosters/${order.booster_profile.id}`}
          className="rounded-full border border-gray-700/50 md:border-gray-700 px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-[11px] font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-gray-100 flex-shrink-0"
        >
          Profile
        </Link>
      </div>
    )
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

            {/* Balance Section */}
            <div className="mb-8">
              <BalanceSection />
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
                <div className="space-y-2 md:space-y-4">
                  {orders.map((order) => {
                    const isAwaitingReview = order.status === 'awaiting_review'
                    const isCompletedWithBooster = order.status === 'completed' && !!order.booster_id

                    return (
                      <div
                        key={order.id}
                        className="rounded-lg border border-gray-800/50 md:border-gray-800 bg-zinc-900/30 md:bg-zinc-900/70 p-3 md:p-5 transition-colors hover:border-blue-500/40"
                      >
                        <div className="flex flex-col gap-2.5 md:gap-4">
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-1 md:space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-start gap-2">
                                {/* Game Icon */}
                                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded overflow-hidden border border-gray-700/50">
                                  <Image
                                    src={getGameIcon(order.game)}
                                    alt={order.game}
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex flex-col gap-1 min-w-0 flex-1">
                                  <h3 className="text-sm md:text-lg font-semibold text-gray-100">
                                    {getCategoryDisplay(order.service_category)}
                                  </h3>
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full border border-white/5 px-1.5 md:px-2.5 py-0.5 text-[10px] md:text-[11px] font-semibold w-fit ${getStatusColor(order.status)}`}
                                  >
                                    {getStatusText(order.status)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1 md:gap-2 text-[10px] md:text-[11px] text-gray-400">
                                <span className="text-gray-400">
                                  {order.game_account}
                                </span>
                                <span className="text-gray-500">•</span>
                                <span className="text-gray-400">
                                  {order.current_level} → {order.target_level}
                                </span>
                                {order.estimated_time && (
                                  <>
                                    <span className="text-gray-500">•</span>
                                    <span className="inline-flex items-center gap-1 text-gray-400">
                                      <Clock className="h-3 w-3 text-gray-500" />
                                      {order.estimated_time}
                                    </span>
                                  </>
                                )}
                                <span className="hidden md:inline text-gray-500">•</span>
                                <span className="hidden md:inline text-gray-400">
                                  {formatDate(order.created_at)}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-row items-center justify-between md:flex-col md:items-end md:justify-start gap-1 md:gap-1">
                              <span className="text-base md:text-xl font-semibold text-blue-200">
                                ${Number(order.amount).toFixed(2)}
                              </span>
                              <span className="text-[10px] md:text-[11px] uppercase tracking-wide text-gray-500">
                                {order.currency.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div className="grid gap-2 md:gap-3 md:grid-cols-2">
                            {order.booster_profile
                              ? renderBoosterAssignment(order)
                              : (
                                <div className="rounded-md border border-gray-800/50 md:border-gray-800 px-2 py-1.5 md:px-3 md:py-2 text-[10px] md:text-xs text-gray-400">
                                  Waiting for booster assignment.
                                </div>
                                )}

                            {isCompletedWithBooster ? (
                              order.feedback ? (
                                renderFeedbackSummary(order)
                              ) : (
                                <button
                                  onClick={() => handleOpenFeedbackModal(order)}
                                  className="flex items-center justify-center gap-1.5 md:gap-2 rounded-md md:rounded-lg border border-blue-500/30 px-2.5 py-1.5 md:px-3 md:py-2 text-[10px] md:text-xs font-semibold text-blue-100 transition hover:border-blue-400"
                                >
                                  <Star className="h-3 w-3 md:h-4 md:w-4" />
                                  Leave Feedback
                                </button>
                              )
                            ) : isAwaitingReview ? (
                              <div className="rounded-md md:rounded-lg border border-emerald-500/20 px-2 py-1.5 md:px-3 md:py-2 text-[10px] md:text-xs text-emerald-100/90">
                                Please review the completed boost. Approve if everything looks good or reject with a note for help.
                              </div>
                            ) : null}
                          </div>

                          {isAwaitingReview && (
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
                              <button
                                onClick={() => handleApproveOrder(order.id)}
                                disabled={approvingOrderId === order.id}
                                className="inline-flex items-center justify-center gap-1.5 md:gap-2 rounded-md md:rounded-lg bg-emerald-600 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {approvingOrderId === order.id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                                    Approving...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
                                    Approve
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleRejectOrder(order.id)}
                                disabled={rejectingOrderId === order.id}
                                className="inline-flex items-center justify-center gap-1.5 md:gap-2 rounded-md md:rounded-lg bg-rose-600 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {rejectingOrderId === order.id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                                    Rejecting...
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 md:h-4 md:w-4" />
                                    Reject
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {feedbackOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-100">
                  {feedbackOrder.feedback ? 'Update Your Feedback' : 'Share Your Experience'}
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  {feedbackOrder.booster_profile?.name
                    ? `How was your session with ${feedbackOrder.booster_profile.name}?`
                    : 'Tell us how the booster handled your order.'}
                </p>
              </div>
              <button
                onClick={handleCloseFeedbackModal}
                className="text-sm font-semibold text-gray-500 transition-colors hover:text-gray-300"
              >
                Close
              </button>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-gray-300 mb-2">
                Rate your booster
              </p>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, index) => {
                  const starValue = index + 1
                  const isActive = (hoverRating ?? feedbackRating ?? 0) >= starValue
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setFeedbackRating(starValue)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${isActive ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-300'}`}
                        fill={isActive ? 'currentColor' : 'none'}
                      />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-gray-300 mb-2">
                Leave a comment (optional)
              </p>
              <textarea
                value={feedbackComment}
                onChange={(event) => setFeedbackComment(event.target.value)}
                placeholder="Share what went well or what could be improved..."
                className="w-full min-h-[120px] resize-none rounded-xl border border-gray-800 bg-zinc-900/60 px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                maxLength={1000}
              />
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>Order ID: {feedbackOrder.id.slice(0, 8)}...</span>
                <span>{feedbackComment.length}/1000</span>
              </div>
            </div>

            {feedbackError && (
              <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                {feedbackError}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={handleCloseFeedbackModal}
                className="px-5 py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:text-gray-100"
                disabled={isSubmittingFeedback}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={isSubmittingFeedback}
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmittingFeedback ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4" />
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
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

