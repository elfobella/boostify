"use client"

import * as React from "react"
import { Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useLoginModal } from "@/contexts"
import { AuthButton, UserMenu } from "../auth"
import { useSession } from "next-auth/react"

export function MobileMenu() {
  const [isOpen, setIsOpen] = React.useState(false)
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

