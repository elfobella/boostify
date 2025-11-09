"use client"

import Link from "next/link"
import Image from "next/image"
import { FooterLinks } from "./FooterLinks"
import { useLocaleContext } from "@/contexts"

export function Footer() {
  const currentYear = new Date().getFullYear()
  const { t } = useLocaleContext()

  return (
    <footer className="border-t border-gray-800 bg-zinc-950 relative z-0" style={{ zIndex: 0, isolation: 'isolate' }}>
      <div className="container px-4 py-12 md:py-16">
        <FooterLinks />
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm opacity-60 text-center md:text-left">
              © {currentYear} Atlas Boost. {t("footer.copyright")}.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center"
              >
                <Image
                  src="/logo.png"
                  alt="Atlas Boost"
                  width={100}
                  height={33}
                  className="h-10 w-auto"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

