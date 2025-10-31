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
      viewPrices: "View Prices",
      comingSoon: "Coming Soon",
      codMobileDesc: "Rank boosting services coming soon",
      pubgMobileDesc: "Boosting services coming soon"
    },
    reliability: {
      title: "Why Boostify?",
      subtitle: "Secure, fast and guaranteed boosting service with professional players",
      fastCompletionTitle: "Fast Completion",
      fastCompletionDesc: "Get your order completed in the shortest time",
      fastCompletionFeature1: "24/7 Professional boosters",
      fastCompletionFeature2: "Average 2-6 hour completion",
      fastCompletionFeature3: "Priority queue for VIP",
      secureTitle: "Safe & Secure",
      secureDesc: "Your account security is our top priority",
      secureFeature1: "No VPN needed",
      secureFeature2: "Account guarantee",
      secureFeature3: "SSL encrypted platform",
      privacyTitle: "Privacy Protected",
      privacyDesc: "Your personal information is always private",
      privacyFeature1: "Secure payment methods",
      privacyFeature2: "GDPR compliant",
      privacyFeature3: "No account sharing",
      competitivePricingTitle: "Competitive Pricing",
      competitivePricingDesc: "Best prices in the market",
      competitivePricingFeature1: "Transparent pricing",
      competitivePricingFeature2: "No hidden fees",
      competitivePricingFeature3: "Money-back guarantee"
    },
    footer: {
      copyright: "All rights reserved"
    },
    auth: {
      signIn: "Sign In",
      signUp: "Sign Up",
      welcomeBack: "Welcome Back!",
      welcome: "Welcome!",
      signInDiscord: "Continue with Discord",
      signInGoogle: "Continue with Google",
      signOut: "Sign Out",
      profile: "Profile",
      loading: "Connecting...",
      error: "Authentication failed",
      terms: "By continuing, you agree to our Terms of Service and Privacy Policy",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      name: "Name",
      signInWithEmail: "Sign In with Email",
      signUpWithEmail: "Sign Up with Email",
      dontHaveAccount: "Don't have an account?",
      haveAccount: "Already have an account?",
      createAccount: "Create Account",
      orContinueWith: "Or continue with",
      forgotPassword: "Forgot Password?",
      emailRequired: "Email is required",
      passwordRequired: "Password is required",
      passwordTooShort: "Password must be at least 6 characters",
      passwordsDoNotMatch: "Passwords do not match",
      nameRequired: "Name is required"
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
    },
    profile: {
      pleaseSignIn: "Please Sign In",
      signInDescription: "You need to be logged in to view your profile.",
      user: "User",
      notSet: "Not set",
      memberSince: "Member since 2024",
      verifiedAccount: "Verified Account",
      totalOrders: "Total Orders",
      totalSpent: "Total Spent",
      activeServices: "Active Services",
      accountDetails: "Account Details",
      fullName: "Full Name",
      emailAddress: "Email Address",
      accountStatus: "Account Status",
      verified: "Verified",
      recentOrders: "Recent Orders",
      noOrdersYet: "No orders yet",
      ordersDescription: "Your boosting orders will appear here"
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
      viewPrices: "Fiyatları Görüntüle",
      comingSoon: "Yakında",
      codMobileDesc: "Sıralama yükseltme hizmetleri yakında",
      pubgMobileDesc: "Boosting hizmetleri yakında"
    },
    reliability: {
      title: "Neden Boostify?",
      subtitle: "Profesyonel oyuncularımızla güvenli, hızlı ve garantili boosting hizmeti",
      fastCompletionTitle: "Hızlı Tamamlama",
      fastCompletionDesc: "Siparişinizin en kısa sürede tamamlanması",
      fastCompletionFeature1: "7/24 Profesyonel boostlar",
      fastCompletionFeature2: "Ortalama 2-6 saat tamamlama",
      fastCompletionFeature3: "VIP için öncelikli kuyruk",
      secureTitle: "Güvenli",
      secureDesc: "Hesap güvenliğiniz bizim önceliğimiz",
      secureFeature1: "VPN gerekmez",
      secureFeature2: "Hesap garantisi",
      secureFeature3: "SSL şifreli platform",
      privacyTitle: "Gizlilik Korunur",
      privacyDesc: "Kişisel bilgileriniz her zaman özeldir",
      privacyFeature1: "Güvenli ödeme yöntemleri",
      privacyFeature2: "GDPR uyumlu",
      privacyFeature3: "Hesap paylaşımı yok",
      competitivePricingTitle: "Rekabetçi Fiyatlandırma",
      competitivePricingDesc: "Piyasadaki en iyi fiyatlar",
      competitivePricingFeature1: "Şeffaf fiyatlandırma",
      competitivePricingFeature2: "Gizli ücret yok",
      competitivePricingFeature3: "Para iade garantisi"
    },
    footer: {
      copyright: "Tüm hakları saklıdır"
    },
    auth: {
      signIn: "Giriş Yap",
      signUp: "Kayıt Ol",
      welcomeBack: "Tekrar Hoş Geldiniz!",
      welcome: "Hoş Geldiniz!",
      signInDiscord: "Discord ile Devam Et",
      signInGoogle: "Google ile Devam Et",
      signOut: "Çıkış Yap",
      profile: "Profil",
      loading: "Bağlanıyor...",
      error: "Giriş başarısız",
      terms: "Devam ederek Hizmet Şartlarımızı ve Gizlilik Politikamızı kabul etmiş olursunuz",
      email: "E-posta",
      password: "Şifre",
      confirmPassword: "Şifre Tekrar",
      name: "Ad",
      signInWithEmail: "E-posta ile Giriş Yap",
      signUpWithEmail: "E-posta ile Kayıt Ol",
      dontHaveAccount: "Hesabınız yok mu?",
      haveAccount: "Zaten hesabınız var mı?",
      createAccount: "Hesap Oluştur",
      orContinueWith: "Veya şununla devam edin",
      forgotPassword: "Şifrenizi mi unuttunuz?",
      emailRequired: "E-posta gereklidir",
      passwordRequired: "Şifre gereklidir",
      passwordTooShort: "Şifre en az 6 karakter olmalıdır",
      passwordsDoNotMatch: "Şifreler eşleşmiyor",
      nameRequired: "Ad gereklidir"
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
    },
    profile: {
      pleaseSignIn: "Lütfen Giriş Yapın",
      signInDescription: "Profilinizi görüntülemek için giriş yapmanız gerekiyor.",
      user: "Kullanıcı",
      notSet: "Ayarlanmamış",
      memberSince: "2024'ten beri üye",
      verifiedAccount: "Doğrulanmış Hesap",
      totalOrders: "Toplam Sipariş",
      totalSpent: "Toplam Harcama",
      activeServices: "Aktif Hizmetler",
      accountDetails: "Hesap Detayları",
      fullName: "Ad Soyad",
      emailAddress: "E-posta Adresi",
      accountStatus: "Hesap Durumu",
      verified: "Doğrulandı",
      recentOrders: "Son Siparişler",
      noOrdersYet: "Henüz sipariş yok",
      ordersDescription: "Boosting siparişleriniz burada görünecek"
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

