import { loadStripe, Stripe } from '@stripe/stripe-js'

// Validate publishable key
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

if (!publishableKey) {
  console.error('[Stripe] ❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable is required')
}

// Validate key format
if (!publishableKey.startsWith('pk_')) {
  console.warn('[Stripe] ⚠️ Publishable key does not start with "pk_" - may be invalid')
}

// Check if test mode key
const isTestMode = publishableKey.startsWith('pk_test_')
if (isTestMode) {
  console.log('[Stripe] ✅ Test mode detected (pk_test_...)')
} else if (publishableKey.startsWith('pk_live_')) {
  console.warn('[Stripe] ⚠️ Live mode detected (pk_live_...) - ensure you are testing in production environment')
}

export const stripePromise: Promise<Stripe | null> = loadStripe(publishableKey, {
  // Ensure Apple Pay and Google Pay are available
  betas: [],
})

// Verify Stripe is loaded correctly
if (typeof window !== 'undefined') {
  stripePromise.then((stripe) => {
    if (stripe) {
      console.log('[Stripe] ✅ Stripe.js loaded successfully')
    } else {
      console.error('[Stripe] ❌ Failed to load Stripe.js')
    }
  }).catch((error) => {
    console.error('[Stripe] ❌ Error loading Stripe.js:', error)
  })
}

