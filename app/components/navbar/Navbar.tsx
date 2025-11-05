"use client"

import Link from "next/link"
import Image from "next/image"
import { NavItems } from "./NavItems"
import { LocaleCurrencySelector } from "../locale"
import { AuthButton, UserMenu } from "../auth"
import { useSession } from "next-auth/react"
import { useLoginModal } from "@/contexts"
import { AvatarSkeleton, Skeleton } from "@/app/components/ui"

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

        <NavItems />

        <div className="flex items-center gap-1 md:gap-2">
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

