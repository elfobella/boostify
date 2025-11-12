# Apple Pay & Google Pay Setup Guide

## Overview
This guide ensures Apple Pay and Google Pay are properly configured and working in the Atlas Boost payment flow.

---

## ✅ Prerequisites

### 1. Stripe Account Setup
- [ ] Stripe account is active (test or live mode)
- [ ] Apple Pay is enabled in Stripe Dashboard
- [ ] Google Pay is enabled in Stripe Dashboard
- [ ] Domain is verified for Apple Pay (production only)

### 2. Environment Variables
```bash
# Required
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_...
STRIPE_SECRET_KEY=sk_test_... # or sk_live_...
```

### 3. Browser/Device Requirements
- **Apple Pay**: Safari on macOS/iOS (requires physical device or simulator)
- **Google Pay**: Chrome on Android/Desktop (works in test mode)

---

## 🔧 Stripe Dashboard Configuration

### Step 1: Enable Payment Methods
1. Go to Stripe Dashboard → **Settings** → **Payment methods**
2. Enable **Apple Pay** (if not already enabled)
3. Enable **Google Pay** (if not already enabled)
4. Enable **Link** (optional, but recommended)

### Step 2: Apple Pay Domain Verification (Production Only)
1. Go to Stripe Dashboard → **Settings** → **Payment methods** → **Apple Pay**
2. Click **Add domain**
3. Enter your production domain (e.g., `atlasboost.com`)
4. Download the domain association file
5. Upload it to: `https://yourdomain.com/.well-known/apple-developer-merchantid-domain-association`
6. Wait for verification (usually takes a few minutes)

**Note**: Domain verification is NOT required for test mode or localhost.

### Step 3: Verify Configuration
- Check that payment methods show as "Enabled" in Dashboard
- Verify "All regions" is selected (or your target regions)

---

## 📱 Testing Apple Pay & Google Pay

### Test Mode
Both Apple Pay and Google Pay work in Stripe test mode without special setup.

### Apple Pay Testing
1. **macOS Safari**:
   - Open Safari (not Chrome)
   - Navigate to your payment page
   - Apple Pay button should appear automatically
   - Use test card: Any card in Wallet (or add test card)

2. **iOS Simulator/Device**:
   - Open Safari
   - Navigate to payment page
   - Apple Pay button appears if device has Wallet configured

**Important**: Apple Pay does NOT work in Chrome on macOS.

### Google Pay Testing
1. **Chrome Browser**:
   - Open Chrome (desktop or Android)
   - Navigate to payment page
   - Google Pay button should appear automatically
   - Use test card from Stripe

2. **Android Device**:
   - Open Chrome
   - Google Pay appears if device has Google Pay configured

---

## 🔍 Verification Checklist

### Backend Verification
- [ ] PaymentIntent is created with `automatic_payment_methods.enabled: true`
- [ ] No `payment_method_types` restriction in PaymentIntent
- [ ] `allow_redirects: 'always'` is set
- [ ] Console logs show payment intent creation with wallet support

### Frontend Verification
- [ ] `PaymentElement` has `wallets: { applePay: 'auto', googlePay: 'auto' }`
- [ ] No `paymentMethodTypes` restriction in PaymentElement
- [ ] Browser console shows wallet availability checks
- [ ] Wallet buttons appear when available

### Browser Console Checks
Open browser console and look for:
```
[StripeCheckout] ✅ Payment methods check:
  applePay: Available / Not available
  googlePay: Available / Not available
```

---

## 🐛 Troubleshooting

### Common Warnings (Expected Behavior)

#### ⚠️ "Unrecognized elements.create('payment') parameter: paymentMethodTypes"
**Status**: ✅ Fixed - This parameter has been removed from the code.
**Action**: No action needed, this is already fixed.

#### ⚠️ "Must serve this page over HTTPS"
**Status**: ✅ Handled automatically
**Explanation**: 
- Apple Pay and Google Pay require HTTPS in **production only**
- **Localhost works perfectly in test mode** - no HTTPS needed
- PaymentElement automatically handles this - buttons appear when available

**Solutions**:
- **Development (localhost)**: ✅ Works automatically - no action needed
- **Production (Vercel/deployed)**: ✅ HTTPS is automatic - wallet buttons work automatically
- **No configuration needed** - the code handles environment detection

#### ⚠️ "Domain not registered or verified for Apple Pay"
**Status**: ⚠️ Expected for localhost/test mode
**Explanation**:
- Apple Pay requires domain verification in **production mode only**
- Test mode works without domain verification
- Localhost doesn't need verification

**Solutions**:
- **Test Mode**: Ignore this warning, Apple Pay works in test mode
- **Production**: Follow domain verification steps in this guide
- **Safari on macOS/iOS**: Should still work in test mode despite the warning

#### ⚠️ "Link payment method not activated"
**Status**: ⚠️ Optional - Link is not required
**Explanation**: Link is a Stripe feature that allows saved payment methods. It's optional.

**Solutions**:
- **Option 1**: Enable Link in Stripe Dashboard → Settings → Payment methods
- **Option 2**: Ignore this warning if you don't need Link

### Apple Pay Not Showing
1. **Check Browser**: Must be Safari (not Chrome/Firefox)
2. **Check Device**: Requires macOS/iOS device or simulator
3. **Check Stripe Dashboard**: Apple Pay must be enabled in **Test Mode** (for localhost)
4. **Check Console**: Look for `[StripeCheckout] ✅ Payment methods check` logs
5. **Domain Verification**: Only required for production (not localhost/test)
6. **HTTPS**: ✅ Automatically handled - localhost works in test mode

### Google Pay Not Showing
1. **Check Browser**: Must be Chrome or Edge Chromium (works on desktop)
2. **Check Stripe Dashboard**: Google Pay must be enabled in **Test Mode** (for localhost)
3. **Check Console**: Look for `[StripeCheckout] ✅ Payment methods check` logs
4. **Test Mode**: ✅ Works automatically in test mode without setup
5. **HTTPS**: ✅ Automatically handled - localhost works in test mode
6. **Important**: PaymentElement shows Google Pay button automatically when:
   - Chrome/Edge Chromium browser detected
   - Google Pay enabled in Stripe Dashboard
   - PaymentIntent has `automatic_payment_methods.enabled: true`

### Both Not Showing
1. **Verify Keys**: Check `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is correct
2. **Check PaymentIntent**: Verify `automatic_payment_methods.enabled: true`
3. **Check PaymentElement**: Verify `wallets` configuration
4. **Browser Support**: Test in Safari (Apple Pay) and Chrome (Google Pay)
5. **HTTPS**: For production, ensure site is served over HTTPS

### Common Errors
- **"Payment method not available"**: Payment method not enabled in Dashboard
- **"Domain not verified"**: Production domain needs verification (test mode doesn't require)
- **"Payment failed"**: Check Stripe Dashboard → Events for error details
- **"HTTPS required"**: Use HTTPS in production or localhost for testing

---

## 📊 Monitoring

### Stripe Dashboard
- **Events**: Monitor payment attempts and failures
- **Payment Methods**: Check which methods are being used
- **Logs**: Review API logs for errors

### Application Logs
Check browser console for:
- `[StripeCheckout]` - Frontend wallet checks
- `[PaymentIntent]` - Backend payment creation
- Stripe errors - Payment failures

---

## 🚀 Production Checklist

Before going live:
- [ ] Domain verified for Apple Pay
- [ ] Live mode keys are set
- [ ] Tested in Safari (Apple Pay)
- [ ] Tested in Chrome (Google Pay)
- [ ] Tested on mobile devices
- [ ] Error handling tested
- [ ] Success flow tested

---

## 📚 Resources

- [Stripe Apple Pay Docs](https://stripe.com/docs/apple-pay)
- [Stripe Google Pay Docs](https://stripe.com/docs/google-pay)
- [Stripe Payment Element](https://stripe.com/docs/payments/payment-element)
- [Stripe Testing](https://stripe.com/docs/testing)

---

## ✅ Quick Test

1. Open Safari (for Apple Pay) or Chrome (for Google Pay)
2. Navigate to payment page
3. Check console for wallet availability
4. Look for Apple Pay/Google Pay buttons above card form
5. Complete a test payment

If buttons don't appear, check the troubleshooting section above.

