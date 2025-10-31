"use client"

import Link from "next/link"
import { NavItems } from "./NavItems"
import { LocaleCurrencySelector } from "../locale"
import { AuthButton, UserMenu } from "../auth"
import { useSession } from "next-auth/react"
import { useLoginModal } from "@/contexts"

export function Navbar() {
  const { data: session } = useSession()
  const isAuthenticated = !!session?.user
  const { openModal } = useLoginModal()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-gray-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center space-x-2 font-bold text-lg md:text-2xl bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent flex-shrink-0"
        >
          <span>Boostify</span>
        </Link>

        <NavItems />

        <div className="flex items-center gap-1 md:gap-2">
          <LocaleCurrencySelector />
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <AuthButton onOpenModal={openModal} />
          )}
        </div>
      </div>
    </header>
  )
}

