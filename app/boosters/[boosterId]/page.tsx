"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  MessageCircle,
  Package,
  Star,
  TrendingUp,
} from "lucide-react"
import { Navbar } from "@/app/components/navbar"
import { Footer } from "@/app/components/footer"
import { ProfileSkeleton } from "@/app/components/ui"

interface BoosterProfile {
  id: string
  name: string | null
  email: string | null
  image: string | null
  created_at: string | null
}

interface RatingBreakdownItem {
  rating: number
  count: number
  percentage?: number
}

interface FeedbackEntry {
  id: string
  rating: number | null
  comment: string | null
  created_at: string | null
  order_id: string | null
  customer: {
    id: string
    name: string | null
    image: string | null
  } | null
}

interface RecentOrderEntry {
  id: string
  status: string
  amount: number
  currency: string
  created_at: string
  customer: {
    id: string
    name: string | null
    image: string | null
  } | null
}

interface BoosterProfileResponse {
  booster: BoosterProfile
  stats: {
    orders: {
      total: number
      completed: number
      active: number
      totalEarnings: number
    }
    feedback: {
      averageRating: number | null
      totalFeedbacks: number
      ratingBreakdown: RatingBreakdownItem[]
    }
  }
  recentFeedback: FeedbackEntry[]
  recentOrders: RecentOrderEntry[]
}

function formatDate(dateString: string | null | undefined, withTime = false) {
  if (!dateString) return "—"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  })
}

function RatingStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1
        const isFilled = starValue <= Math.round(value)
        return (
          <Star
            key={starValue}
            className={`h-4 w-4 ${isFilled ? "text-yellow-400" : "text-gray-600"}`}
            fill={isFilled ? "currentColor" : "none"}
          />
        )
      })}
    </div>
  )
}

export default function BoosterPublicProfilePage() {
  const params = useParams<{ boosterId: string }>()
  const router = useRouter()
  const boosterId = params?.boosterId

  const [data, setData] = useState<BoosterProfileResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!boosterId) return

    const fetchProfile = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/boosters/${boosterId}/profile`)
        if (!response.ok) {
          const result = await response.json().catch(() => ({}))
          throw new Error(result.error || `Unable to load booster profile (status ${response.status})`)
        }
        const payload: BoosterProfileResponse = await response.json()
        setData(payload)
      } catch (fetchError) {
        console.error("[Booster Profile] Error loading booster profile:", fetchError)
        setError(fetchError instanceof Error ? fetchError.message : "Unexpected error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [boosterId])

  const ratingDistribution = useMemo(() => {
    if (!data) return []
    const entries = data.stats.feedback.ratingBreakdown
    const total = data.stats.feedback.totalFeedbacks || 0
    if (total === 0) return entries
    return entries.map(item => ({
      ...item,
      percentage: Math.round((item.count / total) * 100),
    }))
  }, [data])

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <ProfileSkeleton />
        <Footer />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 mt-16 py-12 md:py-24">
          <div className="container px-4">
            <div className="mx-auto max-w-3xl text-center">
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-10">
                <h1 className="text-2xl font-semibold text-gray-100">Booster profile not available</h1>
                <p className="mt-3 text-sm text-red-200/80">{error || "The booster you are looking for could not be found."}</p>
                <button
                  onClick={() => router.back()}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition-colors hover:border-red-400/60 hover:bg-red-500/20"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Go back
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const { booster, stats, recentFeedback, recentOrders } = data

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 mt-16 py-12 md:py-24">
        <div className="container px-4">
          <div className="mx-auto flex max-w-6xl flex-col gap-10">
            <button
              onClick={() => router.back()}
              className="inline-flex w-max items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200 transition-colors hover:border-blue-500/40 hover:bg-blue-500/20"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <section className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-950/60 via-zinc-950 to-zinc-950 p-8 md:p-12 shadow-xl">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-5">
                  {booster.image ? (
                    <Image
                      src={booster.image}
                      alt={booster.name || "Booster"}
                      width={96}
                      height={96}
                      className="rounded-2xl border border-blue-500/40 object-cover shadow-lg"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-3xl font-bold text-blue-200">
                      {(booster.name || "B")[0]?.toUpperCase()}
                    </div>
                  )}

                  <div>
                    <h1 className="text-3xl font-bold text-gray-100 md:text-4xl">
                      {booster.name || "Unnamed Booster"}
                    </h1>
                    <p className="mt-2 text-sm text-gray-400">
                      Joined {formatDate(booster.created_at)}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-4 py-1.5 text-sm text-yellow-200">
                        <Star className="h-4 w-4" />
                        <span className="font-semibold">
                          {typeof stats.feedback.averageRating === "number"
                            ? stats.feedback.averageRating.toFixed(2)
                            : "New"}
                        </span>
                      </div>
                      <div className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-200">
                        {stats.feedback.totalFeedbacks}{" "}
                        {stats.feedback.totalFeedbacks === 1 ? "review" : "reviews"}
                      </div>
                      <div className="rounded-full border border-green-500/20 bg-green-500/10 px-4 py-1.5 text-sm text-green-200">
                        {stats.orders.completed} completed orders
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-blue-200/80">Total Orders</span>
                  <Package className="h-5 w-5 text-blue-300" />
                </div>
                <p className="text-3xl font-bold text-blue-100">{stats.orders.total}</p>
              </div>

              <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-green-200/80">Completed</span>
                  <CheckCircle className="h-5 w-5 text-green-300" />
                </div>
                <p className="text-3xl font-bold text-green-100">{stats.orders.completed}</p>
              </div>

              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-yellow-200/80">Active</span>
                  <Clock className="h-5 w-5 text-yellow-300" />
                </div>
                <p className="text-3xl font-bold text-yellow-100">{stats.orders.active}</p>
              </div>

              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-purple-200/80">Total Earnings</span>
                  <TrendingUp className="h-5 w-5 text-purple-300" />
                </div>
                <p className="text-3xl font-bold text-purple-100">${stats.orders.totalEarnings.toFixed(2)}</p>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">
                <h2 className="text-lg font-semibold text-gray-100">Feedback summary</h2>
                <p className="mt-1 text-sm text-blue-200/70">
                  Overall rating based on recent customer reviews.
                </p>

                <div className="mt-6 flex flex-col gap-4">
                  <div className="flex items-center gap-4 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                    <div className="text-4xl font-bold text-gray-100">
                      {typeof stats.feedback.averageRating === "number"
                        ? stats.feedback.averageRating.toFixed(2)
                        : "New"}
                    </div>
                    {typeof stats.feedback.averageRating === "number" && (
                      <div>
                        <RatingStars value={stats.feedback.averageRating} />
                        <p className="mt-2 text-xs text-blue-200/70">
                          Based on {stats.feedback.totalFeedbacks}{" "}
                          {stats.feedback.totalFeedbacks === 1 ? "review" : "reviews"}
                        </p>
                      </div>
                    )}
                    {typeof stats.feedback.averageRating !== "number" && (
                      <p className="text-sm text-blue-200/80">No feedback yet</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {ratingDistribution.length === 0 ? (
                      <p className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4 text-sm text-blue-200/70">
                        Once customers leave feedback for this booster, their rating distribution will appear here.
                      </p>
                    ) : (
                      ratingDistribution.map(item => (
                        <div key={item.rating} className="flex items-center gap-3 text-sm text-blue-200/80">
                          <span className="w-12 text-right text-xs font-semibold text-blue-200/60">
                            {item.rating}★
                          </span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-blue-500/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                              style={{ width: `${Math.max(item.percentage ?? 0, 4)}%` }}
                            ></div>
                          </div>
                          <span className="w-14 text-right text-xs text-blue-200/60">
                            {item.count} ({item.percentage ?? 0}%)
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-emerald-500/15 bg-emerald-500/5 p-6">
                <h2 className="text-lg font-semibold text-gray-100">Recent orders</h2>
                <p className="mt-1 text-sm text-emerald-200/70">
                  A snapshot of the latest assignments completed by this booster.
                </p>

                <div className="mt-6 space-y-3">
                  {recentOrders.length === 0 ? (
                    <p className="rounded-xl border border-emerald-500/15 bg-emerald-500/10 p-4 text-sm text-emerald-100/80">
                      No orders yet. As soon as this booster starts working with customers, the activity feed will be visible here.
                    </p>
                  ) : (
                    recentOrders.map(order => (
                      <div
                        key={order.id}
                        className="rounded-2xl border border-emerald-500/15 bg-emerald-500/10 p-4"
                      >
                        <div className="flex items-center justify-between text-sm text-emerald-100">
                          <span className="font-medium">{order.status.replace(/_/g, " ")}</span>
                          <span className="text-xs text-emerald-200/80">
                            {formatDate(order.created_at, true)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm text-emerald-200/80">
                          <span>
                            {order.amount ? `$${Number(order.amount).toFixed(2)}` : "—"} {order.currency?.toUpperCase()}
                          </span>
                          {order.customer?.name && (
                            <span className="text-xs text-emerald-200/70">
                              Customer: {order.customer.name}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-gray-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">Customer feedback</h2>
                  <p className="mt-1 text-sm text-gray-400">
                    Real experiences shared by customers after working with this booster.
                  </p>
                </div>
                <span className="rounded-full border border-gray-700/60 bg-gray-800/60 px-3 py-1 text-xs text-gray-300">
                  {stats.feedback.totalFeedbacks} {stats.feedback.totalFeedbacks === 1 ? "review" : "reviews"}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {recentFeedback.length === 0 ? (
                  <p className="rounded-xl border border-gray-800 bg-zinc-900/70 p-6 text-sm text-gray-400">
                    This booster hasn&apos;t received any feedback yet. Once they complete their first orders, you&apos;ll be able to read customer impressions here.
                  </p>
                ) : (
                  recentFeedback.map(feedback => (
                    <div
                      key={feedback.id}
                      className="rounded-2xl border border-gray-800 bg-zinc-900/70 p-5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <RatingStars value={feedback.rating ?? 0} />
                          <span className="text-sm font-semibold text-gray-100">
                            {feedback.rating ? feedback.rating.toFixed(1) : "—"}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(feedback.created_at, true)}
                        </span>
                      </div>
                      {feedback.comment && (
                        <p className="mt-3 text-sm text-gray-200 leading-relaxed">
                          “{feedback.comment}”
                        </p>
                      )}
                      <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">
                        <MessageCircle className="h-4 w-4 text-gray-500" />
                        <span>
                          {feedback.customer?.name
                            ? `Shared by ${feedback.customer.name}`
                            : "Shared by a verified customer"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}


