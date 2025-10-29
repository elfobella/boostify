"use client"

import { Navbar } from "@/app/components/navbar"
import { Footer } from "@/app/components/footer"
import { PopularGames } from "@/app/components/games"
import { ReliabilitySection } from "@/app/components/reliability"
import { useLocaleContext } from "@/contexts"

export default function Home() {
  const { t } = useLocaleContext()
  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden">
      {/* Background Pattern with Light Rays */}
      <div className="fixed inset-0 -z-10">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Light rays from top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-blue-500/20 via-cyan-500/10 to-transparent rounded-full blur-3xl dark:from-blue-500/10 dark:via-cyan-500/5"></div>
        
        {/* Light from bottom right */}
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-t from-blue-400/20 to-transparent rounded-full blur-3xl dark:from-blue-400/10"></div>
      </div>
      
      <Navbar />
      
      <main className="flex-1 relative z-0 mt-16">
        {/* Hero Section */}
        <section className="container px-4 py-24 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              {t("hero.title")}
            </p>
            <p className="mt-6 text-lg leading-8 opacity-70 sm:text-xl">
              {t("hero.subtitle")}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="#games"
                className="rounded-md bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 hover:from-blue-700 hover:to-cyan-700 dark:shadow-blue-400/30 transition-all"
              >
                {t("hero.ctaPrimary")}
              </a>
              <a
                href="#reliability"
                className="text-sm font-semibold leading-6 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                {t("hero.ctaSecondary")} <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </section>

        {/* Popular Games Section */}
        <PopularGames />

        {/* Reliability Section */}
        <ReliabilitySection />
      </main>

      <Footer />
    </div>
  )
}
