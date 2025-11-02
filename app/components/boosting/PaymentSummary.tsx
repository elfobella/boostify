"use client"

import { useState } from "react"
import { CheckCircle2, Shield, Clock, CreditCard, Radio, Users, EyeOff } from "lucide-react"
import { useLocaleContext, useCurrency } from "@/contexts"
import { PaymentModal } from "@/app/components/payment"
import { CardSkeleton } from "@/app/components/ui"

interface OrderData {
  game: string
  category: string
  gameAccount: string
  currentLevel: string
  targetLevel: string
}

interface PaymentSummaryProps {
  price: number
  estimatedTime: string
  isValid: boolean
  onProceed: () => void
  orderData?: OrderData
}

export function PaymentSummary({ price, estimatedTime, isValid, onProceed, orderData }: PaymentSummaryProps) {
  const { convertPrice } = useCurrency()
  const { t } = useLocaleContext()
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isStreamEnabled, setIsStreamEnabled] = useState(false)
  const [isSoloQueueEnabled, setIsSoloQueueEnabled] = useState(false)
  const [isOfflineModeEnabled, setIsOfflineModeEnabled] = useState(false)

  const handleProceedClick = () => {
    if (isValid && price > 0) {
      setIsPaymentModalOpen(true)
    }
  }

  const handlePaymentSuccess = () => {
    console.log("Payment successful!")
    onProceed()
    // Here you can add logic to save the order to database
  }

  return (
    <div className="sticky top-20 bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-gray-800 rounded-xl p-6 shadow-xl">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-gray-800">
        <h3 className="text-xl font-bold text-gray-100 mb-2">Order Summary</h3>
        <p className="text-sm text-gray-400">Review your order details</p>
      </div>

      {/* Price Display */}
      <div className="space-y-6">
        {/* Total Price */}
        {price > 0 ? (
          <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-300">{t("clashRoyale.form.estimatedPrice")}</span>
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {convertPrice(price)}
              </span>
            </div>
            {estimatedTime ? (
              <div className="flex items-center gap-2 text-sm text-cyan-300">
                <Clock className="h-4 w-4" />
                <span>{t("clashRoyale.form.estimatedTime")}: {estimatedTime}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2">
                <div className="h-4 w-4 rounded bg-gray-700/50 animate-pulse" />
                <div className="h-4 w-32 rounded bg-gray-700/50 animate-pulse" />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Fill in the details to see pricing</p>
          </div>
        )}

        {/* Add-ons/Toggles */}
        <div className="space-y-3 border-t border-gray-800 pt-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Add-ons</h4>
          
          {/* Stream Toggle */}
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-colors">
            <div className="flex items-center gap-3">
              <Radio className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-gray-200">Stream</p>
                <p className="text-xs text-gray-500">Watch your boost live</p>
              </div>
            </div>
            <button
              onClick={() => setIsStreamEnabled(!isStreamEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isStreamEnabled ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isStreamEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Solo Queue Toggle */}
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-colors">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm font-medium text-gray-200">Solo Queue</p>
                <p className="text-xs text-gray-500">Play solo matches only</p>
              </div>
            </div>
            <button
              onClick={() => setIsSoloQueueEnabled(!isSoloQueueEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isSoloQueueEnabled ? 'bg-green-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isSoloQueueEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Offline Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-colors">
            <div className="flex items-center gap-3">
              <EyeOff className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-sm font-medium text-gray-200">Offline Mode</p>
                <p className="text-xs text-gray-500">Play without appearing online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOfflineModeEnabled(!isOfflineModeEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isOfflineModeEnabled ? 'bg-purple-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isOfflineModeEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-200">Fast & Secure</p>
              <p className="text-xs text-gray-500">Professional boosters handle your account safely</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-200">Account Guarantee</p>
              <p className="text-xs text-gray-500">Your account is fully protected</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-200">24/7 Support</p>
              <p className="text-xs text-gray-500">Our team is always ready to help</p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleProceedClick}
          disabled={!isValid || price === 0}
          className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-lg font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 disabled:shadow-none"
        >
          {!isValid ? (
            <>
              <span>Complete Form</span>
            </>
          ) : price === 0 ? (
            <>
              <span>Enter Details</span>
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5" />
              <span>{t("clashRoyale.form.proceedPayment")}</span>
            </>
          )}
        </button>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2">
          <Shield className="h-3 w-3" />
          <span>Secure payment powered by Stripe</span>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={price}
        onSuccess={handlePaymentSuccess}
        orderData={orderData}
        estimatedTime={estimatedTime}
      />
    </div>
  )
}

