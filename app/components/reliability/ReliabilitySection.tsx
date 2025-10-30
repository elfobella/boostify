"use client"

import { Zap, Shield, Lock, Rocket } from "lucide-react"
import { ReliabilityCard } from "./ReliabilityCard"
import { useLocaleContext } from "@/contexts"

export function ReliabilitySection() {
  const { t } = useLocaleContext()
  const features = [
    {
      icon: Zap,
      title: t("reliability.fastCompletionTitle"),
      description: t("reliability.fastCompletionDesc"),
      featuresList: [
        t("reliability.fastCompletionFeature1"),
        t("reliability.fastCompletionFeature2"),
        t("reliability.fastCompletionFeature3")
      ]
    },
    {
      icon: Shield,
      title: t("reliability.secureTitle"),
      description: t("reliability.secureDesc"),
      featuresList: [
        t("reliability.secureFeature1"),
        t("reliability.secureFeature2"),
        t("reliability.secureFeature3")
      ]
    },
    {
      icon: Lock,
      title: t("reliability.privacyTitle"),
      description: t("reliability.privacyDesc"),
      featuresList: [
        t("reliability.privacyFeature1"),
        t("reliability.privacyFeature2"),
        t("reliability.privacyFeature3")
      ]
    },
    {
      icon: Rocket,
      title: t("reliability.competitivePricingTitle"),
      description: t("reliability.competitivePricingDesc"),
      featuresList: [
        t("reliability.competitivePricingFeature1"),
        t("reliability.competitivePricingFeature2"),
        t("reliability.competitivePricingFeature3")
      ]
    }
  ]

  return (
    <section id="reliability" className="container px-4 py-16 md:py-24 relative">
      {/* Decorative gradient blob */}
      <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-[100px] dark:from-blue-500/20 dark:to-cyan-500/20"></div>
      
      <div className="relative mx-auto max-w-2xl text-center mb-12">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
          {t("reliability.title")}
        </h2>
        <p className="mt-4 text-lg md:text-xl opacity-70">
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

