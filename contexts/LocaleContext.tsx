"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'

type Locale = 'en' | 'tr'

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

const translations = {
  en: {
    nav: {
      home: "Home",
      about: "About",
      services: "Services",
      contact: "Contact"
    },
    hero: {
      title: "Take your games to the top, discover competitive level",
      subtitle: "Fast and secure boosting service with professional players. Level up your rankings, reach your goals.",
      ctaPrimary: "Discover Services",
      ctaSecondary: "How It Works?"
    },
    games: {
      title: "Games We Provide Boosting For",
      subtitle: "Rank boosting and progression services for your favorite games",
      clashRoyaleDesc: "Level up your arena, upgrade your cards to legendary. Safe and fast boosting up to Arena 16.",
      viewPrices: "View Prices"
    },
    reliability: {
      title: "Why Boostify?",
      subtitle: "Secure, fast and guaranteed boosting service with professional players"
    },
    footer: {
      copyright: "All rights reserved"
    },
    clashRoyale: {
      title: "Clash Royale Boosting",
      subtitle: "Professional boosting services for all game modes",
      selectService: "Select Service",
      orderDetails: "Order Details",
      categories: {
        trophy: "Trophy Boosting",
        pathOfLegends: "Path of Legends",
        ucMedals: "UC Medals",
        mergeTactics: "Merge Tactics",
        challenges: "Challenges",
        passRoyale: "Pass Royale",
        crowns: "Crowns",
        tournament: "Tournament",
        customRequest: "Custom Request"
      },
      form: {
        gameAccount: "Game Account (Player Tag)",
        currentArena: "Current Arena",
        targetArena: "Target Arena",
        currentAmount: "Current Amount",
        targetAmount: "Target Amount",
        currentLevel: "Current Level",
        targetLevel: "Target Level",
        estimatedPrice: "Estimated Price",
        estimatedTime: "Estimated time",
        proceedPayment: "Proceed to Payment"
      }
    }
  },
  tr: {
    nav: {
      home: "Ana Sayfa",
      about: "Hakkımızda",
      services: "Hizmetler",
      contact: "İletişim"
    },
    hero: {
      title: "Oyunlarınızı zirveye taşıyın, rekabetçi seviyeyi keşfedin",
      subtitle: "Profesyonel oyuncularımızla hızlı ve güvenli boosting hizmeti. Sıralamalarınızı yükseltin, hedeflerinize ulaşın.",
      ctaPrimary: "Hizmetleri Keşfet",
      ctaSecondary: "Nasıl Çalışır?"
    },
    games: {
      title: "Boosting Hizmeti Sunan Oyunlar",
      subtitle: "Favori oyunlarınızda sıralama yükseltme ve ilerleme hizmetleri",
      clashRoyaleDesc: "Arena seviyenizi yükseltin, kartlarınızı efsaneye çıkarın. Arena 16'ya kadar güvenli ve hızlı boosting.",
      viewPrices: "Fiyatları Görüntüle"
    },
    reliability: {
      title: "Neden Boostify?",
      subtitle: "Profesyonel oyuncularımızla güvenli, hızlı ve garantili boosting hizmeti"
    },
    footer: {
      copyright: "Tüm hakları saklıdır"
    },
    clashRoyale: {
      title: "Clash Royale Boosting",
      subtitle: "Tüm oyun modları için profesyonel boosting hizmetleri",
      selectService: "Hizmet Seçin",
      orderDetails: "Sipariş Detayları",
      categories: {
        trophy: "Kupa Artırma",
        pathOfLegends: "Efsane Yolu",
        ucMedals: "UC Madalya",
        mergeTactics: "Birleştirme Taktikleri",
        challenges: "Meydan Okumalar",
        passRoyale: "Kraliyet Geçişi",
        crowns: "Taç",
        tournament: "Turnuva",
        customRequest: "Özel İstek"
      },
      form: {
        gameAccount: "Oyun Hesabı (Oyuncu Tag)",
        currentArena: "Mevcut Arena",
        targetArena: "Hedef Arena",
        currentAmount: "Mevcut Miktar",
        targetAmount: "Hedef Miktar",
        currentLevel: "Mevcut Seviye",
        targetLevel: "Hedef Seviye",
        estimatedPrice: "Tahmini Fiyat",
        estimatedTime: "Tahmini süre",
        proceedPayment: "Ödemeye Geç"
      }
    }
  }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedLocale = localStorage.getItem('boostify-locale') as Locale
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'tr')) {
      setLocaleState(savedLocale)
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('boostify-locale', newLocale)
  }

  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations[locale]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    return value || key
  }

  if (!mounted) {
    return null
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocaleContext() {
  const context = useContext(LocaleContext)
  if (context === undefined) {
    throw new Error('useLocaleContext must be used within a LocaleProvider')
  }
  return context
}

