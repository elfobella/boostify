"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Tag, Check, XCircle, Loader2, ArrowLeft } from "lucide-react"
import { Elements } from "@stripe/react-stripe-js"
import { stripePromise } from "@/lib/stripe"
import { StripeCheckout } from "./StripeCheckout"
import { PaymentMethodSelector, PaymentMethod } from "./PaymentMethodSelector"
import { PaymentModalSkeleton } from "@/app/components/ui"

interface OrderData {
  game: string
  category: string
  gameAccount: string
  currentLevel: string
  targetLevel: string
  addons?: {
    stream: boolean
    soloQueue: boolean
    offlineMode: boolean
  }
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
  const [couponCode, setCouponCode] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [finalAmount, setFinalAmount] = useState(amount)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [couponStatus, setCouponStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [couponError, setCouponError] = useState<string | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen && amount > 0) {
      // Reset coupon state when modal opens
      setCouponCode('')
      setDiscountAmount(0)
      setFinalAmount(amount)
      setCouponStatus('idle')
      setCouponError(null)
      setAppliedCoupon(null)
      setSelectedPaymentMethod(null)
      setClientSecret(null)
      // Don't create payment intent until payment method is selected
    }
  }, [isOpen, amount])

  const validateCoupon = async (code: string) => {
    if (!code.trim()) {
      setCouponStatus('idle')
      setDiscountAmount(0)
      setFinalAmount(amount)
      setCouponError(null)
      setAppliedCoupon(null)
      // Recreate payment intent with original amount
      createPaymentIntent(amount)
      return
    }

    setIsValidatingCoupon(true)
    setCouponError(null)

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
          amount: amount,
        }),
      })

      const data = await response.json()

      if (data.valid) {
        setCouponStatus('valid')
        setDiscountAmount(data.discountAmount)
        setFinalAmount(data.finalAmount)
        setCouponError(null)
        setAppliedCoupon(data.coupon)
        // Recreate payment intent with discounted amount
        createPaymentIntent(data.finalAmount, code.trim(), selectedPaymentMethod || undefined)
      } else {
        setCouponStatus('invalid')
        setCouponError(data.error || 'Invalid coupon code')
        setDiscountAmount(0)
        setFinalAmount(amount)
        setAppliedCoupon(null)
        // Recreate payment intent with original amount
        createPaymentIntent(amount, undefined, selectedPaymentMethod || undefined)
      }
    } catch (error) {
      console.error('Error validating coupon:', error)
      setCouponStatus('invalid')
      setCouponError('Failed to validate coupon')
      setDiscountAmount(0)
      setFinalAmount(amount)
      setAppliedCoupon(null)
      createPaymentIntent(amount)
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  useEffect(() => {
    if (couponCode.trim()) {
      const timeoutId = setTimeout(() => {
        validateCoupon(couponCode)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponCode])

  const handleCouponCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value
    setCouponCode(code)
    if (!code.trim()) {
      validateCoupon('')
    }
  }

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    validateCoupon(couponCode)
  }

  const removeCoupon = () => {
    setCouponCode('')
    validateCoupon('')
  }

  const createPaymentIntent = async (paymentAmount: number, couponCodeParam?: string, paymentMethod?: PaymentMethod) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentAmount,
          currency: 'usd',
          orderData: orderData,
          estimatedTime: estimatedTime,
          couponCode: couponCodeParam || couponCode || undefined,
          paymentMethod: paymentMethod || 'card',
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

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method)
    // Create payment intent when method is selected
    createPaymentIntent(finalAmount, couponCode || undefined, method)
  }

  const handleBackToPaymentMethods = () => {
    setSelectedPaymentMethod(null)
    setClientSecret(null)
  }

  if (!isOpen || !mounted) return null

  const handleSuccess = () => {
    onSuccess()
    onClose()
  }

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4" 
      data-payment-modal="true"
      style={{ 
        zIndex: 2147483647, // Max z-index for Safari compatibility
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        isolation: 'isolate',
      }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        style={{ zIndex: 999998 }}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-zinc-900 rounded-2xl shadow-2xl border border-gray-800 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden" 
        style={{ 
          zIndex: 2147483647, // Max z-index for Safari compatibility
          position: 'relative',
          isolation: 'isolate',
        }}
      >
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
          {/* Payment Method Selection - Always show first */}
          {!selectedPaymentMethod && (
            <div className="mb-6">
              <PaymentMethodSelector
                selectedMethod={selectedPaymentMethod}
                onMethodSelect={handlePaymentMethodSelect}
              />
            </div>
          )}

          {/* Coupon Code Section - Only show after payment method is selected */}
          {selectedPaymentMethod && (
            <div className="mb-6 space-y-3">
            <form onSubmit={handleCouponSubmit} className="space-y-2">
              <label htmlFor="coupon-code" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Coupon Code
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    id="coupon-code"
                    type="text"
                    value={couponCode}
                    onChange={handleCouponCodeChange}
                    onBlur={() => validateCoupon(couponCode)}
                    placeholder="Enter coupon code"
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isValidatingCoupon || isLoading}
                  />
                  {isValidatingCoupon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                  {couponStatus === 'valid' && !isValidatingCoupon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                  {couponStatus === 'invalid' && !isValidatingCoupon && couponCode && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <XCircle className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                </div>
                {couponStatus === 'valid' && appliedCoupon && (
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="px-4 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              {couponError && (
                <p className="text-sm text-red-400">{couponError}</p>
              )}
              {couponStatus === 'valid' && appliedCoupon && (
                <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-green-400">
                      {appliedCoupon.discountType === 'percentage' 
                        ? `${appliedCoupon.discountValue}% off` 
                        : `$${appliedCoupon.discountValue} off`}
                    </p>
                    {appliedCoupon.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{appliedCoupon.description}</p>
                    )}
                  </div>
                </div>
              )}
            </form>

            {/* Price Summary */}
            <div className="pt-3 border-t border-gray-800 space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Subtotal</span>
                <span>${amount.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-400">
                  <span>Discount</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-gray-800">
                <span>Total</span>
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  ${finalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          )}

          {/* Show payment form only if method is selected */}
          {selectedPaymentMethod && (
            <>
              {/* Back Button */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleBackToPaymentMethods}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to payment methods</span>
                </button>
              </div>

              {/* Selected Payment Method Display */}
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Selected Payment Method</p>
                    <p className="text-sm font-medium text-white">
                      {selectedPaymentMethod === 'card' && 'Debit/Credit Cards'}
                      {selectedPaymentMethod === 'apple_pay' && 'Apple Pay'}
                      {selectedPaymentMethod === 'google_pay' && 'Google Pay'}
                      {selectedPaymentMethod === 'link' && 'Link by Stripe'}
                      {selectedPaymentMethod === 'crypto' && 'Crypto'}
                      {selectedPaymentMethod === 'paysafe' && 'Paysafe Card'}
                      {selectedPaymentMethod === 'skrill' && 'Skrill'}
                    </p>
                  </div>
                </div>
              </div>

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
                    colorBackground: '#18181b', // zinc-900
                    colorText: '#f4f4f5', // zinc-100
                    colorDanger: '#ef4444',
                    fontFamily: 'system-ui, sans-serif',
                    spacingUnit: '4px',
                    borderRadius: '8px',
                  },
                },
                loader: 'auto',
                // Note: Do NOT specify paymentMethodTypes - let automatic_payment_methods handle it
                // Link payment method warning is expected in test mode if not activated
              }}
            >
              <StripeCheckout 
                clientSecret={clientSecret}
                onSuccess={handleSuccess}
                onCancel={onClose}
                paymentIntentId={clientSecret ? clientSecret.split('_secret_')[0] : null}
                amount={finalAmount}
                currency="usd"
              />
            </Elements>
              ) : (
                <div className="text-center py-8 text-red-400">
                  Failed to load payment form
                </div>
              )}
            </>
          )}

          {/* Show message if no payment method selected */}
          {!selectedPaymentMethod && !isLoading && (
            <div className="text-center py-4 text-gray-400 text-sm">
              Please select a payment method above
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
