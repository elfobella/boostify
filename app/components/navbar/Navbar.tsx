"use client"

import Link from "next/link"
import { ThemeToggle } from "../theme/ThemeToggle"
import { NavItems } from "./NavItems"
import { MobileMenu } from "./MobileMenu"
import { LocaleSelector, CurrencySelector } from "../locale"

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-gray-800 dark:bg-zinc-950/95 dark:supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="mr-6 flex items-center space-x-2 font-bold text-lg bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent"
        >
          <span>Boostify</span>
        </Link>

        <NavItems />

        <div className="flex items-center gap-2">
          <CurrencySelector />
          <LocaleSelector />
          <ThemeToggle />
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}

