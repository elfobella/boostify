"use client"

import { Zap, Shield, Lock, Rocket } from "lucide-react"
import { ReliabilityCard } from "./ReliabilityCard"
import { useLocaleContext } from "@/contexts"

export function ReliabilitySection() {
  const { t } = useLocaleContext()
  const features = [
    {
      icon: Zap,
      title: "Hızlı Tamamlama",
      description: "Profesyonel oyuncularımızla sıralama artışınızı hızla tamamlayın. 24-48 saat içinde sonuç.",
      featuresList: [
        "Hızlı teslimat garantisi",
        "Deneyimli boosterlar",
        "Anında başlangıç"
      ]
    },
    {
      icon: Shield,
      title: "100% Güvenli",
      description: "Hesabınız tamamen güvenli. Ban koruması ve geri ödeme garantisi ile sorunsuz deneyim.",
      featuresList: [
        "Ban koruması",
        "VPN + Güvenli cihazlar",
        "7/24 destek"
      ]
    },
    {
      icon: Lock,
      title: "Gizlilik Garantisi",
      description: "Hesap bilgileriniz tamamen güvende. Ödeme şifreniz asla paylaşılmaz.",
      featuresList: [
        "Güvenli ödeme",
        "Şifre koruması",
        "Veri güvenliği"
      ]
    },
    {
      icon: Rocket,
      title: "Rekabetçi Fiyatlar",
      description: "En iyi fiyat-kalite oranı. Uygun fiyatlarla zirveye ulaşın.",
      featuresList: [
        "Uygun fiyatlandırma",
        "Toplu sipariş indirimleri",
        "Garantili sonuç"
      ]
    }
  ]

  return (
    <section id="reliability" className="container px-4 py-16 md:py-24 relative">
      {/* Decorative gradient blob */}
      <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-[100px] dark:from-blue-500/20 dark:to-cyan-500/20"></div>
      
      <div className="relative mx-auto max-w-2xl text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
          {t("reliability.title")}
        </h2>
        <p className="mt-4 text-lg opacity-70">
          {t("reliability.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto relative z-10">
        {features.map((feature, index) => (
          <ReliabilityCard key={index} {...feature} />
        ))}
      </div>
    </section>
  )
}

