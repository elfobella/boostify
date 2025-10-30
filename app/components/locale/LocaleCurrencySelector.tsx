"use client"

import { Globe } from "lucide-react"
import { useState } from "react"
import { useLocaleContext, useCurrency } from "@/contexts"

export function LocaleCurrencySelector() {
  const { locale, setLocale } = useLocaleContext()
  const { currency, setCurrency } = useCurrency()
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: 'en' as const, label: 'English', flag: '🇺🇸' },
    { code: 'tr' as const, label: 'Türkçe', flag: '🇹🇷' },
  ]

  const currencies = [
    { code: 'USD' as const, symbol: '$', label: 'USD' },
    { code: 'TRY' as const, symbol: '₺', label: 'TRY' },
  ]

  const currentLang = languages.find(lang => lang.code === locale) || languages[0]
  const currentCurrency = currencies.find(c => c.code === currency) || currencies[0]

  const changeLocale = (code: 'en' | 'tr') => {
    setLocale(code)
    setIsOpen(false)
    window.location.reload()
  }

  const changeCurrency = (code: 'USD' | 'TRY') => {
    setCurrency(code)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex h-9 w-auto items-center justify-center gap-2 rounded-md border border-gray-800 bg-zinc-900 px-3 hover:bg-zinc-800 text-gray-100 transition-colors"
        aria-label="Select language and currency"
      >
        <Globe className="h-4 w-4" />
        <span className="text-sm font-medium">{currentLang.flag} {currentCurrency.symbol}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-md border border-gray-800 bg-zinc-900 shadow-lg z-50">
            {/* Languages Section */}
            <div className="p-2 border-b border-gray-800">
              <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Language
              </div>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLocale(lang.code as 'en' | 'tr')}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-zinc-800 transition-colors ${
                    locale === lang.code ? 'bg-blue-500/20 text-blue-400' : 'text-gray-100'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>

            {/* Currency Section */}
            <div className="p-2">
              <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Currency
              </div>
              {currencies.map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => changeCurrency(curr.code)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-zinc-800 transition-colors ${
                    currency === curr.code ? 'bg-blue-500/20 text-blue-400' : 'text-gray-100'
                  }`}
                >
                  <span className="font-medium">{curr.symbol}</span>
                  <span>{curr.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

