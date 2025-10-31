"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useLocaleContext, useLoginModal } from "@/contexts"
import { AuthButton, UserMenu } from "../auth"
import { useSession } from "next-auth/react"

const navItems = [
  { href: "/", key: "home" },
  { href: "/about", key: "about" },
  { href: "/services", key: "services" },
  { href: "/contact", key: "contact" },
]

export function MobileMenu() {
  const [isOpen, setIsOpen] = React.useState(false)
  const pathname = usePathname()
  const { t } = useLocaleContext()
  const { data: session } = useSession()
  const { openModal } = useLoginModal()
  const isAuthenticated = !!session?.user

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-800 bg-zinc-900 hover:bg-zinc-800 text-gray-100"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 top-16 z-50 border-b border-gray-800 bg-zinc-950"
          >
            <nav className="flex flex-col p-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-900",
                    pathname === item.href
                      ? "bg-zinc-900 text-blue-400"
                      : "opacity-60 text-gray-100"
                  )}
                >
                  {t(`nav.${item.key}`)}
                </Link>
              ))}
              <div className="pt-2 border-t border-gray-800 mt-2">
                {isAuthenticated ? (
                  <UserMenu />
                ) : (
                  <AuthButton onOpenModal={openModal} />
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

