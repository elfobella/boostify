# Testing Stripe Connect Implementation

## Prerequisites

✅ Database migration run in Supabase
✅ Build successful
✅ Server running on http://localhost:3001
✅ Two test users ready (one booster, one customer)

---

## Test Flow Overview

### Phase 1: Booster Onboarding

1. **Login as Booster**
   - Go to http://localhost:3001
   - Login with booster account
   - Navigate to Booster Dashboard

2. **See Onboarding Banner**
   - Banner should appear: "Setup Payment Account Required"
   - Yellow/orange warning box at top of dashboard

3. **Create Stripe Connect Account**
   - Click "Create Stripe Account" button
   - Wait for account creation
   - Banner should update to show onboarding link button

4. **Complete Stripe Onboarding**
   - Click "Complete Onboarding" button
   - Opens Stripe test mode onboarding page in new tab
   - Use test data:
     ```
     First Name: Test
     Last Name: Booster
     Email: booster@test.com
     Date of Birth: 01/01/1990
     Phone: +15551234567
     
     Business Type: Individual
     SSN: 123456789 (for test)
     
     Address: 123 Test St
     City: San Francisco
     State: CA
     ZIP: 94102
     
     Bank Account: 000123456789 (test account)
     Routing: 110000000
     ```

5. **Verify Onboarding Complete**
   - Return to dashboard
   - Banner should disappear
   - Ready to accept orders!

---

### Phase 2: Customer Places Order with Booster

⚠️ **IMPORTANT**: For this test, you need to manually select a booster OR modify the payment flow temporarily to automatically use a booster.

**Current Limitation**: The checkout flow doesn't have booster selection UI yet. Choose one of these options:

#### Option A: Direct API Test (Recommended for Now)

Use Postman/curl to test the payment flow:

```bash
# 1. Get a list of onboarded boosters
curl http://localhost:3001/api/boosters/list

# 2. Create a payment intent with booster
curl -X POST http://localhost:3001/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "usd",
    "boosterId": "BOOSTER_UUID_HERE",
    "orderData": {
      "game": "clash-royale",
      "category": "trophy-push",
      "gameAccount": "test#1234",
      "currentLevel": "3000",
      "targetLevel": "4000"
    },
    "estimatedTime": "24 hours"
  }'
```

#### Option B: Temporarily Auto-Assign a Booster

We can quickly add auto-assignment logic to checkout for testing.

---

### Phase 3: Verify Payment Split

1. **Check Stripe Dashboard**
   - Go to https://dashboard.stripe.com/test/payments
   - Find the payment
   - Should show "Connected account" split
   - Platform receives 50%, Booster receives 50%

2. **Check Database**
   ```sql
   -- Check payment transaction
   SELECT 
     pt.total_amount,
     pt.platform_fee,
     pt.booster_amount,
     pt.payment_status,
     o.status,
     o.booster_id
   FROM payment_transactions pt
   JOIN orders o ON pt.order_id = o.id
   WHERE pt.created_at > NOW() - INTERVAL '1 hour'
   ORDER BY pt.created_at DESC
   LIMIT 5;
   ```

3. **Check Order Status**
   - Order should be `status = 'processing'` (not 'pending')
   - Order should have `booster_id` set
   - Order should have `payment_status = 'captured'`

---

## Manual Testing Checklist

### Booster Onboarding
- [ ] Banner appears for non-onboarded boosters
- [ ] "Create Stripe Account" button works
- [ ] Onboarding link opens in new tab
- [ ] Stripe test onboarding completes successfully
- [ ] Banner disappears after completion
- [ ] Status endpoint returns "complete"

### Payment Flow (with boosterId)
- [ ] PaymentIntent created with `application_fee_amount`
- [ ] PaymentIntent has `transfer_data.destination`
- [ ] Order created with `booster_id`
- [ ] Order status is 'processing' (not 'pending')
- [ ] Payment transaction recorded with split

### Payment Flow (without boosterId)
- [ ] Legacy flow still works
- [ ] Order created without `booster_id`
- [ ] Order status is 'pending' (for claiming)
- [ ] No Connect split in payment

### Error Handling
- [ ] Non-booster can't create Connect account
- [ ] Payment fails if booster not onboarded
- [ ] Error messages are clear

---

## Stripe Test Mode

### Stripe Dashboard Links
- Payments: https://dashboard.stripe.com/test/payments
- Connect Accounts: https://dashboard.stripe.com/test/connect/accounts/overview
- Transfers: https://dashboard.stripe.com/test/connect/transfers
- Webhooks: https://dashboard.stripe.com/test/webhooks

### Stripe Test Cards
```
Successful Payment:
4242 4242 4242 4242
Any future expiry date
Any CVC
Any ZIP

Requires Authentication (3D Secure):
4000 0027 6000 3184
```

### Stripe Test Bank Accounts
```
Routing Number: 110000000
Account Number: 000123456789
```

---

## Quick Debugging

### Check Booster Status
```bash
curl http://localhost:3001/api/boosters/connect/status
```

### Check Available Boosters
```bash
curl http://localhost:3001/api/boosters/list
```

### Check Server Logs
Look for:
- `[Connect] ✅ Created Connect account`
- `[PaymentIntent] Creating split payment`
- `[Orders API] Order created successfully`

---

## Common Issues

### Banner Doesn't Appear
- Check booster is logged in
- Check `fetchConnectStatus()` is called
- Check browser console for errors

### Onboarding Link Fails
- Verify Stripe test mode credentials are set
- Check `.env.local` has `STRIPE_SECRET_KEY`
- Try creating account again

### Payment Split Not Working
- Verify booster completed full onboarding
- Check `charges_enabled` and `payouts_enabled` are both true
- Check logs for validation errors

### Legacy Orders Still Show
- Remember: both flows work side by side
- Orders without `booster_id` use old claim flow
- Orders with `booster_id` are pre-assigned

---

## Next Steps After Testing

Once testing is successful:
1. Add booster selection UI to checkout flow
2. Add status indicators in order lists
3. Add webhook handlers for Connect events
4. Set up production Stripe account
5. Enable Connect in live mode

---

## Quick Test Script

Save this as `test_connect.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3001"

echo "1. Checking boosters list..."
curl -s $BASE_URL/api/boosters/list | jq '.'

echo -e "\n2. Testing payment intent creation..."
curl -s -X POST $BASE_URL/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "usd",
    "orderData": {"game": "clash-royale"},
    "estimatedTime": "24h"
  }' | jq '.'
```

Run: `chmod +x test_connect.sh && ./test_connect.sh`

