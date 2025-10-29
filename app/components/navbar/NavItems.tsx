"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useLocaleContext } from "@/contexts"

const navItems = [
  { href: "/", key: "home" },
  { href: "/about", key: "about" },
  { href: "/services", key: "services" },
  { href: "/contact", key: "contact" },
]

export function NavItems() {
  const pathname = usePathname()
  const { t } = useLocaleContext()

  return (
    <nav className="hidden md:flex items-center gap-8">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:opacity-80",
            pathname === item.href
              ? "text-blue-600 dark:text-blue-400"
              : "opacity-60 hover:text-blue-600 dark:hover:text-blue-400"
          )}
        >
          {t(`nav.${item.key}`)}
        </Link>
      ))}
    </nav>
  )
}

