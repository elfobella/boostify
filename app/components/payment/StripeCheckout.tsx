"use client"

import { useState } from "react"
import {
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js"
import { Loader2 } from "lucide-react"

interface StripeCheckoutProps {
  clientSecret: string
  onSuccess: () => void
  onCancel: () => void
  paymentIntentId?: string | null
}

export function StripeCheckout({ clientSecret, onSuccess, onCancel, paymentIntentId }: StripeCheckoutProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/payment/success`,
      },
    })

    setIsLoading(false)

    if (error) {
      console.error('Payment error:', error.message)
      alert(`Payment failed: ${error.message}`)
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      console.log('✅ Payment successful!', {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      })
      
      // Save order to database
      try {
        const orderResponse = await fetch('/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
          }),
        })

        if (orderResponse.ok) {
          const orderData = await orderResponse.json()
          console.log('✅ Order saved to database:', orderData.orderId)
        } else {
          console.error('Failed to save order:', await orderResponse.text())
        }
      } catch (error) {
        console.error('Error saving order:', error)
      }

      // Redirect to success page
      window.location.href = `/payment/success?payment_intent=${paymentIntent.id}`
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative z-0">
      <div className="relative z-0" style={{ isolation: 'isolate' }}>
        <PaymentElement 
          options={{
            layout: 'tabs'
          }}
        />
      </div>
      
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 border border-gray-800 text-gray-300 rounded-lg font-semibold hover:bg-zinc-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isLoading}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </button>
      </div>
    </form>
  )
}

