"use client"

import { useState } from "react"
import { Navbar } from "@/app/components/navbar"
import { Footer } from "@/app/components/footer"
import { ServiceCategorySelector, BoostingForm, PaymentSummary } from "@/app/components/boosting"
import { ServiceCategory, getEstimatedTime } from "@/lib/pricing"
import Image from "next/image"
import { useLocaleContext } from "@/contexts"

export default function ClashRoyaleBoostingPage() {
  const { t } = useLocaleContext()
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('trophy-boosting')
  const [calculatedPrice, setCalculatedPrice] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState("")
  const [isFormValid, setIsFormValid] = useState(false)
  const [currentLevel, setCurrentLevel] = useState("")
  const [targetLevel, setTargetLevel] = useState("")
  const [gameAccount, setGameAccount] = useState("")

  const handlePriceChange = (price: number) => {
    setCalculatedPrice(price)
    // Calculate time based on current values
    if (currentLevel && targetLevel) {
      const current = parseFloat(currentLevel)
      const target = parseFloat(targetLevel)
      if (!isNaN(current) && !isNaN(target)) {
        setEstimatedTime(getEstimatedTime(current, target, selectedCategory))
      }
    }
  }

  const handleProceed = () => {
    // Handle payment logic here
    console.log("Proceeding to payment...")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1 mt-16">
        {/* Hero Section */}
        <section className="relative text-white py-12 md:py-16 overflow-hidden">
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
            <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden ring-2 md:ring-4 ring-white/30 shadow-lg">
                <Image
                  src="/clash-royale.jpg"
                  alt="Clash Royale"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2 drop-shadow-lg text-white">{t("clashRoyale.title")}</h1>
                <p className="text-sm md:text-base text-white/90 drop-shadow-md">{t("clashRoyale.subtitle")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container px-4 py-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Service Categories */}
                <div className="bg-zinc-900 rounded-xl p-4 md:p-6 border border-gray-800">
                  <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-100">
                    {t("clashRoyale.selectService")}
                  </h2>
                  <ServiceCategorySelector
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                  />
                </div>

                {/* Form Section */}
                <div className="bg-zinc-900 rounded-xl p-4 md:p-6 border border-gray-800">
                  <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-100">
                    {t("clashRoyale.orderDetails")}
                  </h2>
                  <BoostingForm
                    category={selectedCategory}
                    onPriceChange={handlePriceChange}
                    onFormChange={setIsFormValid}
                    onFormDataChange={(data) => {
                      setGameAccount(data.gameAccount)
                      setCurrentLevel(data.currentLevel)
                      setTargetLevel(data.targetLevel)
                    }}
                  />
                </div>
              </div>

              {/* Right Column - Payment Summary */}
              <div className="lg:col-span-1">
                <PaymentSummary
                  price={calculatedPrice}
                  estimatedTime={estimatedTime}
                  isValid={isFormValid}
                  onProceed={handleProceed}
                  orderData={{
                    game: 'clash-royale',
                    category: selectedCategory,
                    gameAccount,
                    currentLevel,
                    targetLevel,
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
