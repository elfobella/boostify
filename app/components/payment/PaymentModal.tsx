"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Elements } from "@stripe/react-stripe-js"
import { stripePromise } from "@/lib/stripe"
import { StripeCheckout } from "./StripeCheckout"
import { PaymentModalSkeleton } from "@/app/components/ui"

interface OrderData {
  game: string
  category: string
  gameAccount: string
  currentLevel: string
  targetLevel: string
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  onSuccess: () => void
  orderData?: OrderData
  estimatedTime?: string
}

export function PaymentModal({ isOpen, onClose, amount, onSuccess, orderData, estimatedTime }: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && amount > 0) {
      createPaymentIntent()
    }
  }, [isOpen, amount])

  const createPaymentIntent = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'usd',
          orderData: orderData,
          estimatedTime: estimatedTime,
        }),
      })

      const data = await response.json()
      setClientSecret(data.clientSecret)
    } catch (error) {
      console.error('Error creating payment intent:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const handleSuccess = () => {
    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" style={{ zIndex: 99999, position: 'fixed' }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        style={{ zIndex: 99998 }}
      />
      
      {/* Modal */}
      <div className="relative bg-zinc-900 rounded-2xl shadow-2xl border border-gray-800 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden" style={{ zIndex: 99999 }}>
        {/* Header */}
        <div className="p-6 md:p-8 pb-4 flex-shrink-0 border-b border-gray-800 relative z-50 bg-zinc-900">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors z-[60]"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header Content */}
          <div className="space-y-2 pr-8 relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Complete Payment
            </h2>
            <p className="text-gray-400 text-sm">
              Secure payment powered by Stripe
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 md:py-8 custom-scrollbar relative z-0" style={{ isolation: 'isolate' }}>
          {isLoading ? (
            <PaymentModalSkeleton />
          ) : clientSecret ? (
            <Elements 
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#2563eb',
                  },
                },
                loader: 'auto',
              }}
            >
              <StripeCheckout 
                clientSecret={clientSecret}
                onSuccess={handleSuccess}
                onCancel={onClose}
                paymentIntentId={clientSecret ? clientSecret.split('_secret_')[0] : null}
              />
            </Elements>
          ) : (
            <div className="text-center py-8 text-red-400">
              Failed to load payment form
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
