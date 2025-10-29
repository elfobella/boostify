"use client"

import { Globe } from "lucide-react"
import { useState } from "react"
import { useLocaleContext } from "@/contexts"

export function LocaleSelector() {
  const { locale, setLocale } = useLocaleContext()
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: 'en' as const, label: 'English', flag: '🇺🇸' },
    { code: 'tr' as const, label: 'Türkçe', flag: '🇹🇷' },
  ]

  const currentLang = languages.find(lang => lang.code === locale) || languages[0]

  const changeLocale = (code: 'en' | 'tr') => {
    setLocale(code)
    setIsOpen(false)
    window.location.reload()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex h-9 w-auto items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 hover:bg-gray-100 dark:border-gray-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Select language"
      >
        <Globe className="h-4 w-4" />
        <span className="text-sm font-medium">{currentLang.flag} {currentLang.label}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-zinc-900 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLocale(lang.code as 'en' | 'tr')}
              className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors ${
                locale === lang.code ? 'bg-blue-50 dark:bg-blue-950' : ''
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

