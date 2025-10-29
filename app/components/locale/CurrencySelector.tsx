"use client"

import { useState } from "react"
import { useCurrency } from "@/contexts"

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency()
  const [isOpen, setIsOpen] = useState(false)

  const currencies = [
    { code: 'USD' as const, symbol: '$', label: 'USD' },
    { code: 'TRY' as const, symbol: '₺', label: 'TRY' },
  ]

  const currentCurrency = currencies.find(c => c.code === currency) || currencies[0]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex h-9 w-auto items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 hover:bg-gray-100 dark:border-gray-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Select currency"
      >
        <span className="text-sm font-medium">{currentCurrency.symbol} {currentCurrency.label}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-32 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-zinc-900 z-50">
            {currencies.map((curr) => (
              <button
                key={curr.code}
                onClick={() => {
                  setCurrency(curr.code)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors ${
                  currency === curr.code ? 'bg-blue-50 dark:bg-blue-950' : ''
                }`}
              >
                <span className="font-medium">{curr.symbol}</span>
                <span>{curr.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

