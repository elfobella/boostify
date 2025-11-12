# Google Pay Troubleshooting Guide

## Problem: Google Pay Button Not Showing in Chrome

If Google Pay is enabled in Stripe Dashboard but the button doesn't appear, follow these steps:

---

## ✅ Quick Checklist

1. **Browser**: Using Chrome or Edge Chromium (not Safari/Firefox)
2. **Stripe Dashboard**: Google Pay is enabled in Settings → Payment methods
3. **PaymentIntent**: Has `automatic_payment_methods.enabled: true`
4. **PaymentElement**: Has `wallets: { googlePay: 'auto' }`
5. **No Errors**: Check browser console for Stripe errors

---

## 🔍 Step-by-Step Debugging

### Step 1: Verify Stripe Dashboard
1. Go to Stripe Dashboard → **Settings** → **Payment methods**
2. Find **Google Pay** in the list
3. Ensure it shows **"Enabled"** with green badge
4. Check **"All regions"** is selected (or your target region)

### Step 2: Check Browser Console
Open browser console (F12) and look for:

```javascript
[StripeCheckout] ✅ Payment methods check: {
  googlePay: "Available (Chrome/Edge detected)",
  browser: "Chrome",
  troubleshooting: {
    ifNotShowing: [...]
  }
}
```

### Step 3: Verify PaymentIntent
Check server logs for:
```javascript
💰 Payment Intent created: {
  automaticPaymentMethods: true,
  allowsGooglePay: true
}
```

### Step 4: Check PaymentElement
Look for Google Pay button **above** the card form (not in tabs):
- Button should appear at the top of PaymentElement
- It's a green button with Google Pay logo
- May take 1-2 seconds to load

---

## 🐛 Common Issues

### Issue 1: Button Not Appearing Despite Chrome
**Possible Causes:**
- Google Pay not enabled in Stripe Dashboard
- PaymentIntent missing `automatic_payment_methods.enabled: true`
- Browser extension blocking Stripe scripts

**Solutions:**
1. Double-check Stripe Dashboard → Settings → Payment methods
2. Verify PaymentIntent creation logs show `automaticPaymentMethods: true`
3. Disable browser extensions (ad blockers, privacy tools)
4. Try incognito mode

### Issue 2: Button Appears But Doesn't Work
**Possible Causes:**
- Test mode vs Live mode mismatch
- Account not fully activated
- Region restrictions

**Solutions:**
1. Ensure test keys for test mode, live keys for live mode
2. Check Stripe account status
3. Verify region settings in Dashboard

### Issue 3: Button Shows Then Disappears
**Possible Causes:**
- PaymentIntent amount too low
- Currency not supported
- Payment method restrictions

**Solutions:**
1. Test with amount > $0.50
2. Use USD currency (or supported currency)
3. Check PaymentIntent doesn't have `payment_method_types` restriction

---

## 🔧 Manual Verification

### Test PaymentIntent Creation
```bash
# Check if PaymentIntent supports Google Pay
curl -X POST http://localhost:3000/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 10.00, "currency": "usd"}'
```

Look for response:
```json
{
  "clientSecret": "pi_...",
  "paymentIntentId": "pi_..."
}
```

Then check Stripe Dashboard → Payments → Find the payment intent → Check if Google Pay is listed as available payment method.

### Inspect PaymentElement
1. Open browser DevTools (F12)
2. Go to Elements/Inspector tab
3. Find the PaymentElement container
4. Look for Google Pay button element (should be visible in DOM)

---

## 📱 Testing Different Scenarios

### Test 1: Chrome Desktop
- Should show Google Pay button
- Button appears above card form
- Click should open Google Pay flow

### Test 2: Chrome Android
- Should show Google Pay button
- Button may be larger on mobile
- Should open Google Pay app if installed

### Test 3: Edge Chromium
- Should also show Google Pay button
- Works the same as Chrome

### Test 4: Safari
- Google Pay button will NOT appear (expected)
- Only Apple Pay works in Safari

---

## 🚨 If Still Not Working

### Final Steps:
1. **Clear browser cache** and reload
2. **Check Stripe Dashboard → Events** for any errors
3. **Verify environment variables**:
   ```bash
   echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   # Should start with pk_test_ or pk_live_
   ```
4. **Check PaymentIntent in Stripe Dashboard**:
   - Go to Payments
   - Find the payment intent
   - Check "Payment methods" section
   - Google Pay should be listed

### Contact Support
If none of the above works:
1. Check Stripe Dashboard → Support
2. Share PaymentIntent ID
3. Share browser console logs
4. Share network tab (check for failed requests)

---

## 📝 Expected Behavior

### When Google Pay Works:
- ✅ Green Google Pay button appears above card form
- ✅ Button is clickable
- ✅ Clicking opens Google Pay flow
- ✅ Payment completes successfully

### When Google Pay Doesn't Work:
- ❌ No Google Pay button visible
- ❌ Button appears but is disabled
- ❌ Error message when clicking

---

## 🔗 Useful Links

- [Stripe Google Pay Docs](https://stripe.com/docs/google-pay)
- [Payment Element Wallet Methods](https://stripe.com/docs/payments/payment-element/wallet-methods)
- [Stripe Dashboard - Payment Methods](https://dashboard.stripe.com/settings/payment_methods)

