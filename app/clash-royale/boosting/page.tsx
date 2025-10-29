"use client"

import { useState } from "react"
import { Navbar } from "@/app/components/navbar"
import { Footer } from "@/app/components/footer"
import { ServiceCategorySelector, BoostingForm } from "@/app/components/boosting"
import { ServiceCategory } from "@/lib/pricing"
import Image from "next/image"
import { useLocaleContext } from "@/contexts"

export default function ClashRoyaleBoostingPage() {
  const { t } = useLocaleContext()
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('trophy-boosting')
  const [calculatedPrice, setCalculatedPrice] = useState(0)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1 mt-16">
        {/* Hero Section */}
        <section className="relative text-white py-16 overflow-hidden">
          {/* Background Image with Blur */}
          <div className="absolute inset-0">
            <Image
              src="/clash-royale.jpg"
              alt="Clash Royale Background"
              fill
              className="object-cover blur-sm"
              priority
            />
          </div>
          
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/50"></div>
          
          {/* Content */}
          <div className="container px-4 relative z-10">
            <div className="flex items-center gap-6 mb-8">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden ring-4 ring-white/30 shadow-lg">
                <Image
                  src="/clash-royale.jpg"
                  alt="Clash Royale"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2 drop-shadow-lg text-white">{t("clashRoyale.title")}</h1>
                <p className="text-white/90 drop-shadow-md">{t("clashRoyale.subtitle")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Service Categories */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                {t("clashRoyale.selectService")}
              </h2>
              <ServiceCategorySelector
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>

            {/* Form Section */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                {t("clashRoyale.orderDetails")}
              </h2>
              <BoostingForm
                category={selectedCategory}
                onPriceChange={setCalculatedPrice}
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

