"use client"

import Link from "next/link"
import Image from "next/image"
import { LocaleCurrencySelector } from "../locale"
import { AuthButton, UserMenu } from "../auth"
import { useSession } from "next-auth/react"
import { useLoginModal } from "@/contexts"
import { AvatarSkeleton, Skeleton } from "@/app/components/ui"

// Discord Icon SVG Component
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  )
}

export function Navbar() {
  const { data: session, status } = useSession()
  const isAuthenticated = !!session?.user
  const { openModal } = useLoginModal()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-gray-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center space-x-2 flex-shrink-0"
        >
          <Image
            src="/logo.png"
            alt="Atlas Boost"
            width={120}
            height={40}
            className="h-12 w-auto md:h-14"
            priority
          />
        </Link>

        <div className="flex items-center gap-1 md:gap-2">
          {/* Discord Button */}
          <a
            href="https://discord.gg/3mQ4uT2NJj"
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex
              items-center
              justify-center
              w-9
              h-9
              bg-[#5865F2]
              hover:bg-[#4752C4]
              text-white
              rounded-lg
              transition-colors
              duration-200
            "
            aria-label="Join Discord Server"
          >
            <DiscordIcon className="h-5 w-5" />
          </a>

          <LocaleCurrencySelector />

          {status === "loading" ? (
            <div className="flex items-center gap-2">
              <AvatarSkeleton size={24} />
              <Skeleton className="h-9 w-24 hidden md:block" />
            </div>
          ) : isAuthenticated ? (
            <UserMenu />
          ) : (
            <AuthButton onOpenModal={openModal} />
          )}
        </div>
      </div>
    </header>
  )
}

