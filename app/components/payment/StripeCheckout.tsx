"use client"

import { useState, useEffect, useMemo } from "react"
import {
  PaymentElement,
  PaymentRequestButtonElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js"
import { useSession } from "next-auth/react"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import type {
  PaymentRequest as StripePaymentRequest,
  PaymentRequestPaymentMethodEvent,
} from "@stripe/stripe-js"

interface StripeCheckoutProps {
  clientSecret: string
  onSuccess: () => void
  onCancel: () => void
  paymentIntentId?: string | null
  amount?: number // Amount in dollars for PaymentRequest
  currency?: string // Currency code, default 'usd'
}

export function StripeCheckout({ clientSecret, onSuccess, onCancel, paymentIntentId, amount, currency = 'usd' }: StripeCheckoutProps) {
  const stripe = useStripe()
  const elements = useElements()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [walletAvailability, setWalletAvailability] = useState<{
    applePay: boolean | null
    googlePay: boolean | null
  }>({ applePay: null, googlePay: null })
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentRequest, setPaymentRequest] = useState<StripePaymentRequest | null>(null)
  const [canMakePayment, setCanMakePayment] = useState<{
    googlePay: boolean
    applePay: boolean
  } | null>(null)
  
  // Environment detection (available throughout component)
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  const protocol = typeof window !== 'undefined' ? window.location.protocol : ''
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')
  const isHttps = protocol === 'https:'
  const isNgrok = hostname.includes('ngrok.io') || 
                  hostname.includes('ngrok-free.app') || 
                  hostname.includes('ngrok-free.de') ||
                  hostname.includes('ngrok.app') ||
                  hostname.match(/^[a-z0-9-]+\.ngrok/)
  
  // Browser detection
  const userAgent = typeof window !== 'undefined' ? navigator.userAgent : ''
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent) && !/Chromium/.test(userAgent)
  const isChrome = /Chrome/.test(userAgent) && !/Edg/.test(userAgent) && !isSafari

  // Create PaymentRequest and check canMakePayment for Google Pay / Apple Pay
  useEffect(() => {
    if (!stripe || !amount || !clientSecret) {
      console.log('[StripeCheckout] PaymentRequest: Waiting for stripe, amount, or clientSecret', {
        hasStripe: !!stripe,
        hasAmount: !!amount,
        hasClientSecret: !!clientSecret,
      })
      return
    }

    // Environment check: Allow HTTPS (including ngrok), localhost, but block local network IPs
    // Note: hostname, protocol, isLocalhost, isHttps, isNgrok are now in component scope
    
    // Only block local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    // Allow: localhost, HTTPS (including ngrok), and any HTTPS domain
    const isLocalNetwork = /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    const isAllowed = isLocalhost || isHttps || isNgrok
    
    // Block only local network IPs on HTTP (not HTTPS)
    if (isLocalNetwork && !isHttps && !isLocalhost) {
      console.warn('[StripeCheckout] ⚠️ PaymentRequest blocked: Local network IPs (192.168.x.x) on HTTP are not allowed. Use localhost, HTTPS, or ngrok.')
      setCanMakePayment({ googlePay: false, applePay: false })
      return
    }

    console.log('[StripeCheckout] Creating PaymentRequest...', {
      amount,
      currency,
      hostname,
      protocol,
      isLocalhost,
      isHttps,
      isNgrok,
      isAllowed,
      environment: isNgrok ? 'ngrok (HTTPS tunnel)' : isHttps ? 'HTTPS' : isLocalhost ? 'localhost' : 'other',
    })

    // Create PaymentRequest for wallet buttons
    let pr: StripePaymentRequest
    try {
      pr = stripe.paymentRequest({
        country: 'US',
        currency: currency.toLowerCase(),
        total: {
          label: 'Atlas Boost',
          amount: Math.round(amount * 100), // Convert to cents
        },
        requestPayerName: false,
        requestPayerEmail: false,
        requestPayerPhone: false,
      })
      console.log('[StripeCheckout] PaymentRequest created successfully')
    } catch (error: any) {
      console.error('[StripeCheckout] Error creating PaymentRequest:', error)
      setCanMakePayment({ googlePay: false, applePay: false })
      return
    }

    // Check if payment methods are available (with timeout and retry)
    // Increased retries for HTTPS/ngrok to handle network latency
    let checkAttempts = 0
    const maxAttempts = (isHttps || isNgrok) ? 5 : 3
    const checkCanMakePayment = () => {
      checkAttempts++
      
      console.log(`[StripeCheckout] Checking canMakePayment (attempt ${checkAttempts}/${maxAttempts})...`, {
        hostname,
        protocol,
        isHttps,
        isNgrok,
        isLocalhost,
      })
      
      pr.canMakePayment()
        .then((result: any) => {
          // Log the FULL result object for debugging
          console.log('[StripeCheckout] canMakePayment result (full object):', {
            result: result,
            resultType: typeof result,
            resultIsNull: result === null,
            resultIsUndefined: result === undefined,
            resultKeys: result ? Object.keys(result) : [],
            resultStringified: JSON.stringify(result, null, 2),
          })
          
          if (result) {
            const googlePayAvailable = !!result.googlePay
            const applePayAvailable = !!result.applePay
            
            // Also check for other wallet indicators
            const hasGooglePay = googlePayAvailable || result.googlePay !== undefined
            const hasApplePay = applePayAvailable || result.applePay !== undefined
            
            console.log('[StripeCheckout] Wallet availability check:', {
              googlePayAvailable,
              applePayAvailable,
              hasGooglePay,
              hasApplePay,
              resultGooglePay: result.googlePay,
              resultApplePay: result.applePay,
            })
            
            setCanMakePayment({
              googlePay: hasGooglePay,
              applePay: hasApplePay,
            })
            
            setPaymentRequest(pr)
            
            console.log('[StripeCheckout] ✅ PaymentRequest canMakePayment SUCCESS:', {
              googlePay: hasGooglePay,
              applePay: hasApplePay,
              fullResult: result,
              environment: {
                hostname,
                protocol,
                isLocalhost,
                isHttps,
                isNgrok,
                isLocalNetwork,
                allowed: isLocalhost || isHttps || isNgrok,
                environment: isNgrok ? 'ngrok (HTTPS tunnel)' : isHttps ? 'HTTPS' : isLocalhost ? 'localhost' : 'other',
              },
              troubleshooting: {
                ifGooglePayNotShowing: [
                  '1. Verify Chrome browser (not Safari/Firefox)',
                  '2. Check Stripe Dashboard → Settings → Payment methods → Google Pay → TEST MODE enabled',
                  '3. Ensure test keys (pk_test_) are being used',
                  '4. Check browser console for Stripe.js errors',
                ],
                ifApplePayNotShowing: [
                  '1. Verify Safari browser (not Chrome/Firefox)',
                  '2. Check Stripe Dashboard → Settings → Payment methods → Apple Pay → TEST MODE enabled',
                  '3. Ensure test keys (pk_test_) are being used',
                  '4. Domain verification NOT required in test mode',
                ],
              },
            })
          } else {
            // Result is null/undefined - wallet methods not available
            console.warn(`[StripeCheckout] ⚠️ PaymentRequest canMakePayment returned null/undefined (attempt ${checkAttempts}/${maxAttempts})`, {
              result: result,
              hostname,
              protocol,
              isHttps,
              isNgrok,
              isLocalhost,
              possibleReasons: [
                '1. Wallet methods not enabled in Stripe Dashboard (TEST MODE)',
                '2. Browser does not support Payment Request API',
                '3. Network connectivity issues to Stripe API',
                '4. Test mode keys (pk_test_) not being used',
                '5. Payment Request API blocked by browser security',
              ],
            })
            
            // Retry if first attempt failed (network might be slow) - retry for localhost, HTTPS, and ngrok
            if (checkAttempts < maxAttempts && (isLocalhost || isHttps || isNgrok)) {
              const retryDelay = (isHttps || isNgrok) ? 1500 : 1000
              console.log(`[StripeCheckout] Retrying canMakePayment in ${retryDelay}ms... (attempt ${checkAttempts}/${maxAttempts})`, {
                hostname,
                protocol,
                isHttps,
                isNgrok,
                isLocalhost,
                note: isNgrok 
                  ? 'Wallet methods may take longer to initialize on ngrok HTTPS tunnel. Retrying...'
                  : 'Wallet methods may take longer to initialize on HTTPS. Retrying...',
              })
              setTimeout(checkCanMakePayment, retryDelay)
            } else {
              // All retries exhausted - wallet methods not available via PaymentRequest API
              // Note: In Safari, canMakePayment() may return null even if Apple Pay is available
              // PaymentElement will still show Apple Pay button if enabled in Stripe Dashboard
              const safariNote = isSafari 
                ? 'Note: Safari may return null for canMakePayment() even when Apple Pay is available. PaymentElement will show Apple Pay button if enabled in Stripe Dashboard.'
                : ''
              
              setCanMakePayment({ googlePay: false, applePay: false })
              
              // In local/test environments this is expected, so log as warning instead of error
              const logMessage = isSafari 
                ? '[StripeCheckout] ⚠️ PaymentRequest canMakePayment: null in Safari (expected - PaymentElement will still show Apple Pay)'
                : '[StripeCheckout] ⚠️ PaymentRequest canMakePayment unavailable after retries (wallet buttons may still appear in PaymentElement)'
              
              console.warn(logMessage, {
                attempts: checkAttempts,
                hostname,
                protocol,
                isHttps,
                isNgrok,
                isLocalhost,
                isSafari,
                isChrome,
                safariNote,
                troubleshooting: (isHttps || isNgrok)
                  ? [
                      isSafari 
                        ? 'Safari: PaymentRequest canMakePayment() may return null, but PaymentElement will show Apple Pay if enabled.'
                        : 'HTTPS/ngrok is active but wallet methods not available via PaymentRequest API.',
                      '1. Verify Stripe Dashboard → Settings → Payment methods → Apple Pay/Google Pay → TEST MODE toggle is ON',
                      isSafari
                        ? '2. Safari: Apple Pay button will appear in PaymentElement (not PaymentRequestButtonElement)'
                        : '2. Check browser: Chrome for Google Pay, Safari for Apple Pay',
                      '3. Verify test keys (pk_test_) in environment variables',
                      '4. PaymentElement automatically shows wallet buttons if enabled in Stripe Dashboard',
                      isSafari
                        ? '5. This is expected behavior in Safari - PaymentElement handles Apple Pay'
                        : '5. Try refreshing the page (hard refresh: Cmd+Shift+R)',
                    ]
                  : [
                      'This may be due to network issues or Stripe API connectivity.',
                      'Try HTTPS/ngrok or check network connectivity.',
                      'PaymentElement will still show wallet buttons if enabled in Stripe Dashboard',
                    ],
              })
            }
          }
        })
        .catch((error: any) => {
          console.error('[StripeCheckout] ❌ Error checking canMakePayment:', {
            error: error,
            errorMessage: error.message,
            errorStack: error.stack,
            errorName: error.name,
            hostname,
            protocol,
            isHttps,
            isNgrok,
            isLocalhost,
            attempt: checkAttempts,
          })
          
          // Retry on network errors (for localhost, HTTPS, and ngrok)
          const isNetworkError = error.message?.includes('fetch') || 
                                error.message?.includes('network') || 
                                error.message?.includes('Failed to fetch') ||
                                error.name === 'NetworkError' ||
                                error.name === 'TypeError'
          
          if (checkAttempts < maxAttempts && (isNetworkError || isHttps || isNgrok || isLocalhost)) {
            const retryDelay = (isHttps || isNgrok) ? 2500 : 2000
            console.log(`[StripeCheckout] Network/error detected, retrying in ${retryDelay}ms... (attempt ${checkAttempts}/${maxAttempts})`, {
              hostname,
              protocol,
              isHttps,
              isNgrok,
              errorType: error.name,
              errorMessage: error.message,
              isNetworkError,
              note: isNgrok 
                ? 'Network latency may occur on ngrok HTTPS tunnel. Retrying...'
                : 'Network latency may occur on HTTPS. Retrying...',
            })
            setTimeout(checkCanMakePayment, retryDelay)
          } else {
            setCanMakePayment({ googlePay: false, applePay: false })
            console.error('[StripeCheckout] ❌ PaymentRequest canMakePayment FAILED after all retries:', {
              error: error.message,
              errorName: error.name,
              attempts: checkAttempts,
              hostname,
              protocol,
              isHttps,
              isNgrok,
              isLocalhost,
              troubleshooting: (isHttps || isNgrok)
                ? [
                    'HTTPS/ngrok is active but wallet methods unavailable.',
                    '1. Check Stripe Dashboard → Settings → Payment methods → Apple Pay/Google Pay → TEST MODE enabled',
                    '2. Verify browser: Chrome for Google Pay, Safari for Apple Pay',
                    '3. Ensure test keys (pk_test_) are being used',
                    '4. Check browser console for Stripe.js errors',
                    '5. PaymentElement will still show wallet buttons if enabled in Stripe Dashboard',
                  ]
                : [
                    'This may be due to network issues or Stripe API connectivity.',
                    'Check browser console for FetchError.',
                    'PaymentElement will still show wallet buttons if enabled in Stripe Dashboard',
                  ],
            })
          }
        })
    }

    // Initial check with a small delay to ensure Stripe is fully loaded
    // Longer delay for HTTPS/ngrok to ensure network connectivity is established
    const initialDelay = (isHttps || isNgrok) ? 1000 : 500
    setTimeout(checkCanMakePayment, initialDelay)

    // Handle payment request events (set up even if canMakePayment fails initially)
    // This allows the button to work if the network issue resolves
    pr.on('paymentmethod', async (ev: PaymentRequestPaymentMethodEvent) => {
      if (!stripe || !clientSecret) {
        ev.complete('fail')
        return
      }

      try {
        setIsLoading(true)
        
        // Confirm payment with the payment method from PaymentRequest
        const { error: confirmError, paymentIntent: confirmedPaymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: ev.paymentMethod.id,
          },
          { handleActions: false }
        )

        if (confirmError) {
          ev.complete('fail')
          setPaymentError(confirmError.message || 'Payment failed')
          setIsLoading(false)
        } else if (confirmedPaymentIntent) {
          if (confirmedPaymentIntent.status === 'succeeded') {
            ev.complete('success')
            // Don't set loading to false - we're redirecting
            await handlePaymentSuccess(confirmedPaymentIntent)
          } else if (confirmedPaymentIntent.status === 'requires_action') {
            // Handle 3D Secure
            const { error: actionError, paymentIntent: actionPaymentIntent } = await stripe.confirmCardPayment(
              clientSecret,
              { payment_method: ev.paymentMethod.id }
            )
            
            if (actionError) {
              ev.complete('fail')
              setPaymentError(actionError.message || 'Authentication failed')
              setIsLoading(false)
            } else if (actionPaymentIntent?.status === 'succeeded') {
              ev.complete('success')
              await handlePaymentSuccess(actionPaymentIntent)
            } else {
              ev.complete('fail')
              setPaymentError(`Payment status: ${actionPaymentIntent?.status}`)
              setIsLoading(false)
            }
          } else {
            ev.complete('fail')
            setPaymentError(`Payment status: ${confirmedPaymentIntent.status}`)
            setIsLoading(false)
          }
        }
      } catch (error: any) {
        console.error('[StripeCheckout] PaymentRequest paymentmethod error:', error)
        ev.complete('fail')
        setPaymentError(error.message || 'Payment failed')
        setIsLoading(false)
      }
    })

    // Store paymentRequest even if canMakePayment fails initially
    // This allows retry later if network issue resolves
    setPaymentRequest(pr)

    return () => {
      // Cleanup - but keep paymentRequest in state for potential retries
      // The component will handle cleanup on unmount
    }
  }, [stripe, amount, currency, clientSecret])

  // Legacy wallet availability check (for display purposes)
  useEffect(() => {
    if (stripe && elements) {
      const checkWalletAvailability = async () => {
        try {
          await elements.fetchUpdates()
          
          const userAgent = typeof window !== 'undefined' ? navigator.userAgent : ''
          const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent) && !/Chromium/.test(userAgent)
          const isChrome = /Chrome/.test(userAgent) && !/Edg/.test(userAgent) && !isSafari
          const isEdgeChromium = /Edg/.test(userAgent) && /Chrome/.test(userAgent)
          
          setWalletAvailability({
            applePay: isSafari,
            googlePay: isChrome || isEdgeChromium,
          })
        } catch (error) {
          console.error('[StripeCheckout] Error checking wallet availability:', error)
        }
      }

      checkWalletAvailability()
    }
  }, [stripe, elements])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      setPaymentError('Stripe is not initialized. Please refresh the page.')
      return
    }

    setIsLoading(true)
    setPaymentError(null)

    try {
      // Submit the form first to validate
      const { error: submitError } = await elements.submit()
      
      if (submitError) {
        console.error('[StripeCheckout] Form submission error:', submitError)
        setPaymentError(submitError.message || 'Please check your payment details')
        setIsLoading(false)
        return
      }

      // Get user email from session (required when billing_details.email is set to 'never' in PaymentElement)
      const userEmail = session?.user?.email
      
      if (!userEmail) {
        setPaymentError('Email is required for payment. Please ensure you are logged in.')
        setIsLoading(false)
        return
      }
      
      // Confirm payment - this works with all payment methods including Apple Pay/Google Pay
      // Note: We must provide billing_details.email since fields.billingDetails.email is set to 'never'
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required', // Works with Payment Request API (Apple Pay/Google Pay)
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
          payment_method_data: {
            billing_details: {
              email: userEmail,
            },
          },
        },
      })

      if (error) {
        console.error('[StripeCheckout] Payment confirmation error:', {
          type: error.type,
          code: error.code,
          message: error.message,
          decline_code: (error as any).decline_code,
        })
        setPaymentError(error.message || 'Payment failed. Please try again.')
      } else if (paymentIntent) {
        console.log('[StripeCheckout] Payment intent status:', paymentIntent.status)
        
        if (paymentIntent.status === 'succeeded') {
          await handlePaymentSuccess(paymentIntent)
          return // Success - don't set loading to false as we're redirecting
        } else if (paymentIntent.status === 'requires_action') {
          // Handle 3D Secure or other actions
          console.log('[StripeCheckout] Payment requires additional action')
          setPaymentError('Please complete the additional authentication step.')
        } else {
          setPaymentError(`Payment status: ${paymentIntent.status}. Please try again.`)
        }
      }
    } catch (error: any) {
      console.error('[StripeCheckout] Unexpected error:', error)
      setPaymentError(error.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentSuccess = async (paymentIntent: any) => {
    const piId = paymentIntent.id || paymentIntentId
    console.log('✅ Payment successful!', {
      id: piId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      metadata: paymentIntent.metadata,
      hasPaymentIntentId: !!paymentIntentId,
    })
    
    // Always check if this is a balance deposit by calling server
    // This is more reliable than checking metadata client-side
    if (piId) {
      try {
        // Check if this payment intent is a deposit
        const checkResponse = await fetch(`/api/balance/check-deposit?paymentIntentId=${piId}`)
        if (checkResponse.ok) {
          const checkData = await checkResponse.json()
          console.log('[StripeCheckout] Deposit check result:', checkData)
          
          if (checkData.isDeposit) {
            // Handle balance deposit
            console.log('[StripeCheckout] Processing balance deposit...')
            const depositResponse = await fetch('/api/balance/deposit-success', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                paymentIntentId: piId,
              }),
            })

            if (depositResponse.ok) {
              const depositData = await depositResponse.json()
              console.log('✅ Balance deposit processed:', depositData)
              // Redirect to balance page to show updated balance
              window.location.href = `/balance?deposit=success`
              onSuccess()
              return
            } else {
              const errorText = await depositResponse.text()
              console.error('❌ Failed to process deposit:', errorText)
              try {
                const errorData = JSON.parse(errorText)
                alert(`Payment successful but failed to update balance: ${errorData.error || 'Unknown error'}. Please contact support.`)
              } catch {
                alert('Payment successful but failed to update balance. Please contact support.')
              }
              // Still redirect but show error
              window.location.href = `/balance?deposit=error`
              return
            }
          } else {
            console.log('[StripeCheckout] Not a balance deposit, processing as regular order')
          }
        } else {
          console.warn('[StripeCheckout] Failed to check if deposit:', await checkResponse.text())
        }
      } catch (error) {
        console.error('[StripeCheckout] Error checking deposit:', error)
        // Don't block regular order flow if check fails
      }
    }
    
    // Also check metadata as fallback
    const metadata = paymentIntent.metadata || {}
    if (metadata.type === 'balance_deposit') {
      console.log('[StripeCheckout] Found deposit in metadata, processing...')
      try {
        const depositResponse = await fetch('/api/balance/deposit-success', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: piId,
          }),
        })

        if (depositResponse.ok) {
          const depositData = await depositResponse.json()
          console.log('✅ Balance deposit processed:', depositData)
          window.location.href = `/balance?deposit=success`
          onSuccess()
          return
        } else {
          const errorText = await depositResponse.text()
          console.error('Failed to process deposit:', errorText)
        }
      } catch (error) {
        console.error('Error processing deposit:', error)
      }
    }
    
    // Save order to database (for regular orders)
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative z-0">
      {/* Wallet Availability Info - Only show when wallet is actually available */}
      {walletAvailability.applePay && (
        <div className="flex items-center gap-2 text-green-400 text-xs">
          <CheckCircle2 className="h-3 w-3" />
          <span>Apple Pay button will appear above the payment form</span>
        </div>
      )}
      {walletAvailability.googlePay && (
        <div className="flex items-center gap-2 text-green-400 text-xs">
          <CheckCircle2 className="h-3 w-3" />
          <span>Google Pay button will appear above the payment form</span>
        </div>
      )}

      {/* Payment Error Display */}
      {paymentError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-400">{paymentError}</p>
        </div>
      )}

      {/* PaymentRequestButtonElement - Google Pay / Apple Pay buttons */}
      {/* IMPORTANT: Only mount PaymentRequestButtonElement AFTER canMakePayment() has been called and resolved */}
      {/* Stripe requires canMakePayment() to be checked before mounting the element */}
      {/* Note: In Safari, canMakePayment() may return null, but PaymentElement will show Apple Pay */}
      {paymentRequest && canMakePayment !== null && (canMakePayment.googlePay || canMakePayment.applePay) && (
        <div className="space-y-2">
          <div className="text-xs text-gray-400 mb-2">Pay with wallet</div>
          <div className="relative">
            <PaymentRequestButtonElement
              options={{
                paymentRequest,
                style: {
                  paymentRequestButton: {
                    theme: 'dark',
                    height: '48px',
                  },
                },
              }}
            />
          </div>
          <div className="text-xs text-gray-500 text-center">
            {canMakePayment.googlePay && canMakePayment.applePay && 'Google Pay or Apple Pay'}
            {canMakePayment.googlePay && !canMakePayment.applePay && 'Google Pay'}
            {!canMakePayment.googlePay && canMakePayment.applePay && 'Apple Pay'}
          </div>
        </div>
      )}
      
      {/* Safari-specific note: PaymentElement will show Apple Pay even if PaymentRequestButtonElement doesn't */}
      {isSafari && paymentRequest && canMakePayment !== null && !canMakePayment.applePay && (
        <div className="text-xs text-gray-500 text-center mb-2">
          <span className="text-green-400">✓</span> Apple Pay will appear in the payment form below
        </div>
      )}
      
      {/* Show loading state while checking wallet availability */}
      {paymentRequest && canMakePayment === null && (isHttps || isNgrok || isLocalhost) && (
        <div className="space-y-2">
          <div className="text-xs text-gray-400 mb-2">Pay with wallet</div>
          <div className="relative h-12 bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-xs text-gray-500">Checking wallet availability...</div>
          </div>
        </div>
      )}

      {/* Fallback message when wallet methods are not available */}
      {canMakePayment !== null && (!canMakePayment.googlePay && !canMakePayment.applePay) && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-300">
              <p className="font-medium">Wallet payment not available</p>
              <p className="text-xs text-amber-400/80 mt-1">
                {typeof window !== 'undefined' && (() => {
                  const hostname = window.location.hostname
                  const protocol = window.location.protocol
                  const isLocalNetwork = /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
                  const isHttps = protocol === 'https:'
                  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
                  const isNgrok = hostname.includes('ngrok.io') || 
                                  hostname.includes('ngrok-free.app') || 
                                  hostname.includes('ngrok-free.de') ||
                                  hostname.includes('ngrok.app') ||
                                  hostname.match(/^[a-z0-9-]+\.ngrok/)
                  
                  if (isLocalNetwork && !isHttps) {
                    return 'Local network IPs on HTTP are not supported. Please use localhost, HTTPS, or ngrok tunnel.'
                  } else if (isNgrok) {
                    return 'ngrok HTTPS tunnel is active but wallet methods unavailable. Check: 1) Stripe Dashboard → Settings → Payment methods → Apple Pay/Google Pay enabled in TEST MODE, 2) Browser supports Apple Pay (Safari) or Google Pay (Chrome), 3) Test mode keys (pk_test_) are being used, 4) Check browser console for detailed error messages.'
                  } else if (isHttps) {
                    return 'HTTPS is active but wallet methods unavailable. Check: 1) Stripe Dashboard → Settings → Payment methods → Apple Pay/Google Pay enabled in TEST MODE, 2) Browser supports Apple Pay (Safari) or Google Pay (Chrome), 3) Check browser console for detailed error messages.'
                  } else if (isLocalhost && protocol === 'http:') {
                    return 'Stripe API connection failed. This may be due to network issues. Check browser console for FetchError. Try refreshing the page or using HTTPS/ngrok (see docs/LOCALHOST_HTTPS_SETUP.md).'
                  } else {
                    return 'Google Pay and Apple Pay require HTTPS, ngrok tunnel, or localhost. Please use a secure connection or test on localhost.'
                  }
                })()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Element - This includes Apple Pay, Google Pay, Link automatically */}
      <div className="relative z-0" style={{ isolation: 'isolate' }}>
        <PaymentElement 
          options={{
            // Explicitly enable wallet methods - Google Pay should appear above card form
            wallets: {
              applePay: 'auto', // Automatically shows when available (Safari)
              googlePay: 'auto', // Automatically shows when available (Chrome/Edge)
            },
            business: {
              name: 'Atlas Boost',
            },
            // Fields configuration - ensure all payment methods are available
            fields: {
              billingDetails: {
                email: 'never', // Email is collected separately
                phone: 'auto',
                address: 'auto',
              },
            },
            // Note: appearance is set at Elements level (in PaymentModal.tsx)
            // Do NOT specify appearance here - it causes "Unrecognized parameter" warning
            // Note: Do NOT specify paymentMethodTypes - let automatic_payment_methods handle it
            // This allows all payment methods enabled in Stripe Dashboard
            // Note: Google Pay button appears at the TOP of PaymentElement, above card form
          }}
          onChange={(event) => {
            // Clear errors when user changes payment method
            if (event.complete) {
              setPaymentError(null)
            }
            
            // Debug: Log payment method changes
            if (event.value?.type) {
              console.log('[StripeCheckout] Payment method changed:', event.value.type)
            }
          }}
          onReady={(event) => {
            // Debug: Log when PaymentElement is ready and what payment methods are available
            console.log('[StripeCheckout] ✅ PaymentElement ready:', {
              environment: {
                hostname,
                protocol,
                isHttps,
                isNgrok,
                isLocalhost,
              },
              note: 'PaymentElement automatically shows Google Pay (Chrome) and Apple Pay (Safari) if enabled in Stripe Dashboard TEST MODE',
              wallets: {
                googlePay: 'auto - appears in Chrome/Edge',
                applePay: 'auto - appears in Safari',
              },
              troubleshooting: {
                ifButtonsNotShowing: [
                  '1. Verify Stripe Dashboard → Settings → Payment methods → TEST MODE → Google Pay/Apple Pay enabled',
                  '2. Use Chrome for Google Pay, Safari for Apple Pay',
                  '3. Ensure test keys (pk_test_) are being used',
                  '4. Check browser console for Stripe.js errors',
                ],
              },
            })
            
            // Check if Google Pay button is actually rendered - check multiple times
            const checkGooglePayButton = (attempt = 1, maxAttempts = 5) => {
              if (typeof window !== 'undefined' && attempt <= maxAttempts) {
                // Look for Google Pay button in DOM with multiple selectors
                const selectors = [
                  '[data-testid="google-pay-button"]',
                  '[aria-label*="Google Pay"]',
                  '[aria-label*="google pay"]',
                  'button[class*="GooglePay"]',
                  'button[class*="google-pay"]',
                  'iframe[src*="google.com/pay"]',
                  'iframe[src*="googleapis.com"]',
                  // Stripe PaymentElement internal structure
                  'div[class*="PaymentRequestButton"]',
                  'div[class*="GooglePayButton"]',
                ]
                
                let googlePayButton: HTMLElement | null = null
                for (const selector of selectors) {
                  const found = document.querySelector(selector) as HTMLElement | null
                  if (found) {
                    googlePayButton = found
                    break
                  }
                }
                
                // PaymentElement can be in various places - check all possible selectors
                const paymentElementSelectors = [
                  '[data-testid="payment-element"]',
                  '[id*="payment-element"]',
                  '[class*="PaymentElement"]',
                  '[class*="payment-element"]',
                  'form[class*="Stripe"]',
                  'div[class*="StripeElement"]',
                  // Stripe PaymentElement usually renders in a specific container
                  'div[class*="Stripe"]',
                  // Check iframe sources
                  'iframe[src*="js.stripe.com"]',
                  'iframe[src*="hooks.stripe.com"]',
                ]
                
                let paymentElement = null
                for (const selector of paymentElementSelectors) {
                  paymentElement = document.querySelector(selector)
                  if (paymentElement) {
                    console.log(`[StripeCheckout] PaymentElement found with selector: ${selector}`)
                    break
                  }
                }
                
                // Also check all iframes for Stripe content
                const iframes = Array.from(document.querySelectorAll('iframe'))
                const stripeIframes = iframes.filter(iframe => {
                  const src = iframe.getAttribute('src') || ''
                  return src.includes('stripe.com') || src.includes('js.stripe') || src.includes('hooks.stripe')
                })
                
                let googlePayInIframe = false
                let iframeDetails: any[] = []
                
                stripeIframes.forEach(iframe => {
                  const src = iframe.getAttribute('src') || ''
                  iframeDetails.push({
                    src: src.substring(0, 100), // Truncate for logging
                    width: iframe.offsetWidth,
                    height: iframe.offsetHeight,
                    visible: iframe.offsetWidth > 0 && iframe.offsetHeight > 0,
                  })
                  
                  try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
                    if (iframeDoc) {
                      const iframeButton = iframeDoc.querySelector('button[class*="Google"], button[aria-label*="Google"], button[class*="google"], [class*="GooglePayButton"]')
                      if (iframeButton) {
                        googlePayInIframe = true
                        console.log('[StripeCheckout] Google Pay button found inside iframe!')
                      }
                    }
                  } catch (e) {
                    // Cross-origin iframe, can't access - this is normal for Stripe
                    // Stripe PaymentElement is in a cross-origin iframe for security
                  }
                })
                
                // Check if PaymentElement is actually rendered (even if we can't find it with selectors)
                // PaymentElement renders visible content (email field, card form) so we can detect it
                const hasVisiblePaymentContent = !!(
                  document.querySelector('input[type="email"]') || // Email field
                  document.querySelector('input[placeholder*="card"]') || // Card input
                  document.querySelector('input[placeholder*="Card"]') ||
                  document.querySelector('[class*="CardElement"]') ||
                  document.querySelector('[class*="card"]') ||
                  document.querySelector('iframe[src*="stripe"]') // Stripe iframe
                )
                
                console.log(`[StripeCheckout] Google Pay button check (attempt ${attempt}/${maxAttempts}):`, {
                  googlePayButtonFound: !!googlePayButton || googlePayInIframe,
                  googlePayButtonElement: googlePayButton ? {
                    tagName: googlePayButton.tagName,
                    className: googlePayButton.className,
                    ariaLabel: googlePayButton.getAttribute('aria-label'),
                    visible: googlePayButton.offsetWidth > 0 && googlePayButton.offsetHeight > 0,
                  } : null,
                  googlePayInIframe,
                  paymentElementFound: !!paymentElement,
                  hasVisiblePaymentContent, // PaymentElement is rendering (we can see email/card fields)
                  stripeIframesCount: stripeIframes.length,
                  totalIframesCount: iframes.length,
                  stripeIframeDetails: iframeDetails,
                  allButtons: Array.from(document.querySelectorAll('button'))
                    .slice(0, 10)
                    .map(btn => {
                      const button = btn as HTMLElement
                      return {
                        text: button.textContent?.substring(0, 30),
                        className: button.className?.substring(0, 50),
                        ariaLabel: button.getAttribute('aria-label'),
                        visible: button.offsetWidth > 0 && button.offsetHeight > 0,
                      }
                    }),
                  troubleshooting: {
                    ifButtonNotFound: [
                      '1. Verify Google Pay is enabled in Stripe Dashboard → Settings → Payment methods',
                      '2. Ensure you are using Chrome or Edge Chromium (not Safari/Firefox)',
                      '3. Check that PaymentIntent has automatic_payment_methods.enabled: true',
                      '4. Try refreshing the page or clearing browser cache',
                      '5. Check browser console for Stripe errors',
                      '6. Verify test mode keys match (pk_test_ for test mode)',
                    ],
                    ifButtonFoundButNotVisible: [
                      '1. Check CSS z-index - button may be hidden behind other elements',
                      '2. Check if button has display: none or visibility: hidden',
                      '3. Verify PaymentElement container has proper dimensions',
                    ],
                  },
                })
                
                // If button not found and we haven't reached max attempts, check again
                if (!googlePayButton && !googlePayInIframe && attempt < maxAttempts) {
                  setTimeout(() => checkGooglePayButton(attempt + 1, maxAttempts), 1000)
                } else if (attempt === maxAttempts && !googlePayButton && !googlePayInIframe) {
                  console.warn('[StripeCheckout] ⚠️ Google Pay button not found after multiple checks.', {
                    diagnosis: {
                      paymentElementRendering: hasVisiblePaymentContent 
                        ? '✅ PaymentElement IS rendering (email/card fields visible)' 
                        : '❌ PaymentElement NOT rendering',
                      googlePayNotShowing: hasVisiblePaymentContent 
                        ? '⚠️ PaymentElement works but Google Pay button not visible - likely Stripe Dashboard configuration issue'
                        : '❌ PaymentElement not rendering at all',
                    },
                    possibleCauses: [
                      '1. Google Pay not enabled in Stripe Dashboard → Settings → Payment methods → Google Pay (CHECK TEST MODE)',
                      '2. PaymentIntent missing automatic_payment_methods.enabled: true (check server logs)',
                      '3. Browser not supported (needs Chrome/Edge Chromium - you are using Chrome ✅)',
                      '4. Test mode keys mismatch (ensure pk_test_ for test mode)',
                      '5. Google Pay domain verification required (only for production, not localhost)',
                    ],
                    action: [
                      '1. Go to Stripe Dashboard → Settings → Payment methods',
                      '2. Ensure TEST MODE toggle is ON (top left)',
                      '3. Find Google Pay and click "Enable"',
                      '4. Check "All regions" is selected',
                      '5. Refresh this page and try again',
                    ],
                  })
                }
                
                // Also check PaymentElement's internal state
                if (elements) {
                  const paymentElementInstance = elements.getElement('payment')
                  if (paymentElementInstance) {
                    console.log('[StripeCheckout] PaymentElement instance:', {
                      elementType: 'payment',
                      mounted: true,
                      note: 'Check Stripe Dashboard → Settings → Payment methods → Google Pay is enabled',
                    })
                  }
                }
              }
            }
            
            // Start checking immediately, then retry after delays
            checkGooglePayButton(1, 5)
          }}
        />
      </div>
      
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 border border-gray-800 text-gray-300 rounded-lg font-semibold hover:bg-zinc-800 transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || isLoading}
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

