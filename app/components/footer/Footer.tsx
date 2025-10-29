"use client"

import Link from "next/link"
import { FooterLinks } from "./FooterLinks"
import { useLocaleContext } from "@/contexts"

export function Footer() {
  const currentYear = new Date().getFullYear()
  const { t } = useLocaleContext()

  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-zinc-950">
      <div className="container px-4 py-12 md:py-16">
        <FooterLinks />
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm opacity-60 text-center md:text-left">
              © {currentYear} Boostify. {t("footer.copyright")}.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent"
              >
                Boostify
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

