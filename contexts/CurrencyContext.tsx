"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

type Currency = 'USD' | 'TRY'

interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
  convertPrice: (priceUSD: number) => string
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

const exchangeRates = {
  USD: 1.0,
  TRY: 34.5 // Örnek kur, gerçek kur için API entegrasyonu yapılabilir
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('USD')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load from localStorage
    const savedCurrency = localStorage.getItem('boostify-currency') as Currency
    if (savedCurrency && (savedCurrency === 'USD' || savedCurrency === 'TRY')) {
      setCurrencyState(savedCurrency)
    }
  }, [])

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency)
    localStorage.setItem('boostify-currency', newCurrency)
  }

  const convertPrice = (priceUSD: number): string => {
    const rate = exchangeRates[currency]
    const convertedPrice = priceUSD * rate
    
    if (currency === 'USD') {
      return `$${convertedPrice.toFixed(2)}`
    } else {
      return `₺${convertedPrice.toFixed(2)}`
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}

