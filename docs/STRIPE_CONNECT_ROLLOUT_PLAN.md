# 🚀 Stripe Connect Automatic Split - Full Implementation Plan

## 📋 Executive Summary

**Goal:** Implement Stripe Connect for automatic 50/50 split payments  
**Impact:** Enables scaling to hundreds of concurrent orders  
**Timeline:** 2-3 days implementation + testing  
**Breaking Change:** Yes - order flow completely changes

---

## 🎯 Current vs New Flow

### Current Flow (Manual Payout)
```
1. Customer pays $100 → Platform holds all
2. Booster claims order → Chat created
3. Booster completes → Order awaiting review
4. Customer approves → Manual payout required
5. Platform pays booster $50 manually
```

### New Flow (Automatic Split)
```
1. Customer selects booster → Booster must be onboarded
2. Customer pays $100 with split:
   ├─ $50 to platform (automatic)
   └─ $50 to booster (automatic)
3. Order created → Already has booster_id
4. Booster completes → Order awaiting review
5. Customer approves → Money already transferred! ✅
```

---

## 📦 What We Need to Build

### Phase 1: Database & Backend Infrastructure

#### 1.1 Database Migration
```sql
-- Add Connect fields to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS payouts_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS charges_enabled BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_stripe_connect_account 
  ON users(stripe_connect_account_id);
```

**File:** `supabase/migrations/add_stripe_connect_to_users.sql`

#### 1.2 API Routes to Create

**A) Booster Onboarding APIs**
- `POST /api/boosters/connect/create-account` - Create Stripe Connect account
- `POST /api/boosters/connect/onboard-link` - Generate onboarding link
- `GET /api/boosters/connect/status` - Check onboarding status
- `GET /api/boosters/list` - List available boosters for selection

**B) Payment APIs**
- `POST /api/create-payment-intent` - ⚠️ MODIFY to accept boosterId
- `POST /api/orders/create` - ⚠️ MODIFY to create with booster_id

**C) Webhook Handler**
- `POST /api/webhooks/stripe` - Handle Connect events
  - `account.updated` - Update onboarding status
  - `transfer.created` - Log automatic transfers

#### 1.3 Frontend Components to Create

**A) Booster Onboarding**
- `app/booster/connect/setup/page.tsx` - Start onboarding
- `app/booster/connect/onboarding/page.tsx` - Stripe hosted page
- `app/components/booster/ConnectStatus.tsx` - Show onboarding status

**B) Booster Selection (Critical!)**
- `app/components/checkout/BoosterSelector.tsx` - Customer picks booster
- Update existing checkout flow to include booster selection

**C) Dashboard Updates**
- Remove "Claim Order" from booster dashboard
- Add "Available Boosters" list
- Update order cards to show assigned booster

---

## 🔧 Implementation Checklist

### Step 1: Database Setup ⏱️ 15 min
- [ ] Create migration file
- [ ] Run in Supabase SQL Editor
- [ ] Verify fields added to users table

### Step 2: Booster Onboarding APIs ⏱️ 2 hours
- [ ] Create Connect account endpoint
- [ ] Create onboarding link endpoint  
- [ ] Create status check endpoint
- [ ] Add error handling
- [ ] Test with Stripe test mode

### Step 3: List Boosters API ⏱️ 1 hour
- [ ] Create boosters list endpoint
- [ ] Filter by onboarding status
- [ ] Include availability indicators
- [ ] Add pagination

### Step 4: Update Checkout Flow ⏱️ 3 hours
- [ ] Create BoosterSelector component
- [ ] Add to checkout page
- [ ] Update payment intent creation to require boosterId
- [ ] Add validation
- [ ] Error handling for non-onboarded boosters

### Step 5: Update Order Creation ⏱️ 1 hour
- [ ] Modify order creation to set booster_id upfront
- [ ] Update payment_transactions creation
- [ ] Change order status from 'pending' to 'processing'
- [ ] Remove chat auto-creation (no longer needed on claim)

### Step 6: Stripe Webhooks ⏱️ 2 hours
- [ ] Create webhook endpoint
- [ ] Handle account.updated events
- [ ] Handle transfer.created events
- [ ] Test with Stripe CLI

### Step 7: Frontend UI Updates ⏱️ 4 hours
- [ ] Booster onboarding pages
- [ ] Connect status indicators
- [ ] Update booster dashboard
- [ ] Update customer order views
- [ ] Remove claim buttons

### Step 8: Testing & Migration ⏱️ 4 hours
- [ ] Test full flow end-to-end
- [ ] Handle existing pending orders
- [ ] Create migration guide for existing users
- [ ] Update documentation

### Step 9: Stripe Dashboard Setup ⏱️ 1 hour
- [ ] Enable Connect in Stripe Dashboard
- [ ] Configure Connect settings
- [ ] Test in live mode
- [ ] Set up monitoring

---

## 🎨 UI/UX Changes Required

### For Boosters

**Before onboarding:**
```
[Booster Dashboard]
⚠️ You need to complete payment setup to start receiving orders
[Connect Stripe Account] button
```

**After onboarding:**
```
[Booster Dashboard]
✅ Payment setup complete - You can receive orders
Available Orders section removed (no claiming)
My Orders shows pre-assigned work
```

### For Customers

**Old checkout:**
```
[Service Selection]
[Game Details]
[Payment Info]
[Pay Now]
```

**New checkout:**
```
[Service Selection]
[Game Details]
[Select a Booster] ← NEW!
  - Show available boosters
  - Display ratings/availability
  - Require selection
[Payment Info]
[Pay Now]
```

---

## 🔐 Security & Compliance

### Required Checks

1. **Booster Verification**
   - Only onboarded boosters appear in selection
   - Check `onboarding_complete = true`
   - Check `charges_enabled = true` and `payouts_enabled = true`

2. **Payment Validation**
   - Verify booster has active Connect account
   - Validate application_fee_amount is correct
   - Ensure transfer_data.destination is valid

3. **Stripe Events**
   - Verify webhook signatures
   - Idempotent event handling
   - Audit logging

4. **Data Privacy**
   - Don't expose Connect account IDs to customers
   - Secure webhook endpoint
   - Rate limiting on onboarding endpoints

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **Onboarding**
   - Boosters who completed onboarding
   - Onboarding completion rate
   - Average time to complete

2. **Payments**
   - Automatic split success rate
   - Transfer failures
   - Application fee collection

3. **Orders**
   - Orders with successful Connect splits
   - Orders failing due to onboarding issues
   - Average time from payment to transfer

### Stripe Dashboard

Monitor in Stripe Dashboard:
- Connect → Express accounts
- Payments → Filter by application_fee_amount
- Transfers → Automatic transfers

---

## 🚨 Risk Mitigation

### Potential Issues

1. **Boosters not onboarding**
   - Risk: No boosters available for selection
   - Mitigation: Offer onboarding incentive, make it easy

2. **Onboarding failures**
   - Risk: Booster gets stuck in setup
   - Mitigation: Clear error messages, support docs, retry logic

3. **Payment failures**
   - Risk: Transfer fails but payment succeeded
   - Mitigation: Webhook monitoring, manual intervention process

4. **Existing orders**
   - Risk: Pending orders with old flow
   - Mitigation: Keep claim system for legacy orders, gradual migration

---

## 🔄 Migration Strategy

### For Existing Boosters

1. **Communication**
   - Email all boosters
   - Announce new system
   - Provide onboarding link

2. **Grace Period**
   - Keep old claim system for 30 days
   - New orders require Connect
   - Legacy orders can still be claimed

3. **Onboarding Campaign**
   - Step-by-step guide
   - Video tutorial
   - Support assistance

### For Existing Pending Orders

```sql
-- Keep old flow for orders without booster_id
-- New flow for orders with booster_id

-- Query to identify:
SELECT * FROM orders 
WHERE booster_id IS NULL 
AND status = 'pending'
```

---

## 📝 Files to Create/Modify

### New Files
```
app/api/boosters/
├── connect/
│   ├── create-account/route.ts
│   ├── onboard-link/route.ts
│   ├── status/route.ts
│   └── webhook/route.ts
├── list/route.ts

app/booster/connect/
├── setup/page.tsx
└── onboarding/page.tsx

app/components/
├── booster/
│   ├── ConnectStatus.tsx
│   ├── OnboardingButton.tsx
│   └── BoosterCard.tsx
├── checkout/
│   ├── BoosterSelector.tsx
│   └── BoosterList.tsx

supabase/migrations/
└── add_stripe_connect_to_users.sql

docs/
├── STRIPE_CONNECT_SETUP.md
├── BOOSTER_ONBOARDING_GUIDE.md
└── MIGRATION_GUIDE.md
```

### Modified Files
```
app/api/
├── create-payment-intent/route.ts ⚠️ MAJOR CHANGE
└── orders/
    └── create/route.ts ⚠️ MODIFY

app/components/
├── payment/
│   └── PaymentModal.tsx ⚠️ ADD booster selection
└── payment/
    └── StripeCheckout.tsx ⚠️ PASSTHROUGH boosterId

app/
├── booster/dashboard/page.tsx ⚠️ REMOVE claim, ADD onboarding
├── profile/page.tsx ⚠️ SHOW assigned booster
└── checkout/page.tsx ⚠️ ADD booster selector
```

---

## ✅ Success Criteria

The implementation is successful when:

1. ✅ New boosters can complete Stripe onboarding
2. ✅ Customers can select a booster before payment
3. ✅ Payment automatically splits 50/50
4. ✅ Boosters receive money without manual intervention
5. ✅ Platform receives commission automatically
6. ✅ Old claim flow still works for legacy orders
7. ✅ Zero payment losses or mismatches
8. ✅ All webhook events processed correctly

---

## 📚 Resources

- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Express Accounts](https://stripe.com/docs/connect/express-accounts)
- [Testing Connect](https://stripe.com/docs/connect/testing)
- [Application Fees](https://stripe.com/docs/connect/charges)
- [Webhooks](https://stripe.com/docs/webhooks)

---

## 🚀 Let's Start!

Next step: Begin with **Step 1: Database Setup**

