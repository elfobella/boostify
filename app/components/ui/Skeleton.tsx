import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-700/50", className)}
      {...props}
    />
  )
}

// Profile Skeleton
export function ProfileSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 mt-16 py-12 md:py-24">
        <div className="container px-4">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Profile Header Skeleton */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-gray-800 rounded-2xl p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Avatar Skeleton */}
                <Skeleton className="w-[120px] h-[120px] rounded-full" />
                
                {/* User Info Skeleton */}
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-10 w-64" />
                  <Skeleton className="h-6 w-48" />
                  <div className="flex gap-4">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-28" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>

            {/* Account Details Skeleton */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-gray-800 rounded-2xl p-8 md:p-12">
              <Skeleton className="h-7 w-40 mb-6" />
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg">
                    <Skeleton className="h-11 w-11 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Card Skeleton
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-zinc-900 rounded-xl p-6 border border-gray-800", className)}>
      <Skeleton className="h-6 w-32 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}

// Form Input Skeleton
export function InputSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  )
}

// Button Skeleton
export function ButtonSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-10 w-full rounded-lg", className)} />
}

// List Item Skeleton
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg">
      <Skeleton className="h-12 w-12 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}

// Page Skeleton (full page)
export function PageSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="space-y-4 w-full max-w-4xl px-4">
        <Skeleton className="h-12 w-64 mx-auto" />
        <Skeleton className="h-6 w-96 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

// Payment Modal Content Skeleton
export function PaymentModalSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  )
}

// Avatar Skeleton (for user menu, profile, etc.)
export function AvatarSkeleton({ size = 24 }: { size?: number }) {
  return <Skeleton className="rounded-full" style={{ width: size, height: size }} />
}

