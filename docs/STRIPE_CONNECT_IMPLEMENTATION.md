# Stripe Connect Implementation for Automatic Split

## 🔴 Problem with Current Flow

**Current flow:**
1. Customer creates order + pays → No booster yet
2. Booster claims order → PaymentIntent already created
3. Can't modify PaymentIntent after creation to add Connect split

**Solution:**
We need to change the flow so booster is assigned BEFORE payment.

---

## 🎯 New Flow Design

### Option 1: Pre-assign Booster (Recommended for Connect)

```
1. Customer selects service
2. Customer selects a booster OR system auto-assigns
3. Customer pays with Connect split already applied
4. Order created → already has booster_id
5. Work starts immediately
```

### Option 2: Claim Then Pay

```
1. Customer creates "purchase intent"
2. Boosters see intent, one claims it
3. Customer pays ONLY after booster assigned
4. PaymentIntent created with Connect split
5. Order created
```

### Option 3: Standalone Charges After Claim

```
1. Current flow stays same (customer pays to platform)
2. After booster claims, create NEW charge to booster
3. Refund original charge
   ⚠️ Complex, messy, bad UX
```

---

## ✅ Recommended: Option 1 (Pre-assign Booster)

### Why?
- Stripe Connect works best when destination known upfront
- Better UX (customer knows who's working)
- Simpler payment flow
- No refunds needed

### Implementation Steps

#### Step 1: Add Connect Fields to Users Table

```sql
-- Add Stripe Connect fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS payouts_enabled BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_stripe_connect_account 
  ON users(stripe_connect_account_id);
```

#### Step 2: Create Booster Onboarding API

```typescript
// app/api/boosters/connect/onboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/app/api/auth/[...nextauth]/route'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('email', session.user.email)
      .single()

    if (!userData || userData.role !== 'booster') {
      return NextResponse.json(
        { error: 'Only boosters can create Connect accounts' },
        { status: 403 }
      )
    }

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // TODO: Get from user profile
      email: userData.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })

    console.log('[Connect] ✅ Created Connect account:', account.id)

    // Update user with Connect account ID
    await supabaseAdmin
      .from('users')
      .update({ stripe_connect_account_id: account.id })
      .eq('id', userData.id)

    return NextResponse.json({ accountId: account.id })
  } catch (error: any) {
    console.error('[Connect] Error creating account:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

#### Step 3: Create Onboarding Link API

```typescript
// app/api/boosters/connect/onboard-link/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@/app/api/auth/[...nextauth]/route'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, stripe_connect_account_id')
      .eq('email', session.user.email)
      .single()

    if (!userData?.stripe_connect_account_id) {
      return NextResponse.json(
        { error: 'No Connect account found' },
        { status: 404 }
      )
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: userData.stripe_connect_account_id,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/booster/dashboard`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/booster/dashboard?onboarded=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error: any) {
    console.error('[Connect] Error creating link:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

#### Step 4: Update Order Flow - Pre-select Booster

**Current:** Customer pays → Booster claims  
**New:** Customer selects booster → Customer pays with split → Order created

##### 4a. Update Checkout to Include Booster Selection

```typescript
// app/checkout/page.tsx
// Add booster selection before payment
const [selectedBooster, setSelectedBooster] = useState<string | null>(null)

// Show list of available boosters when order created
// Customer must pick one before payment
```

##### 4b. Update PaymentIntent Creation

```typescript
// app/api/create-payment-intent/route.ts
export async function POST(req: NextRequest) {
  const { amount, currency = 'usd', orderData, boosterId } = await req.json()
  // ... existing code ...

  // Get booster's Connect account
  const { data: booster } = await supabaseAdmin
    .from('users')
    .select('stripe_connect_account_id, onboarding_complete')
    .eq('id', boosterId)
    .single()

  if (!booster?.stripe_connect_account_id || !booster.onboarding_complete) {
    return NextResponse.json(
      { error: 'Booster must complete Stripe onboarding first' },
      { status: 400 }
    )
  }

  // Calculate split
  const totalAmount = Math.round(amount * 100)
  const platformFee = Math.floor(totalAmount * 0.5) // 50%
  const boosterAmount = totalAmount - platformFee

  // Create PaymentIntent with Connect split
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount,
    currency: currency,
    application_fee_amount: platformFee,
    transfer_data: {
      destination: booster.stripe_connect_account_id,
    },
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      ...metadata,
      booster_id: boosterId,
    },
  })

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
  })
}
```

##### 4c. Update Order Creation

```typescript
// app/api/orders/create/route.ts
// Now order should include booster_id from the start
const orderData = {
  user_id: userId,
  booster_id: metadata.booster_id, // Now we have it from the start
  payment_intent_id: paymentIntentId,
  // ... rest of fields
  status: 'processing', // Not pending anymore, already assigned
}

// Create payment_transactions with split info
await supabaseAdmin.from('payment_transactions').insert({
  order_id: newOrder.id,
  stripe_payment_intent_id: paymentIntentId,
  customer_id: userId,
  booster_id: metadata.booster_id,
  total_amount: paymentIntent.amount / 100,
  platform_fee: (paymentIntent.application_fee_amount || 0) / 100,
  booster_amount: (paymentIntent.amount - (paymentIntent.application_fee_amount || 0)) / 100,
  payment_status: 'captured',
})
```

#### Step 5: Remove Claim Flow

- Boosters can't claim existing orders anymore
- Orders are pre-assigned
- Remove `/api/orders/claim/route.ts` endpoint
- Or keep it for admin manual assignments

---

## 🔄 Migration Strategy

### For Existing Data:

1. Keep old flow for pending orders
2. New orders use new flow
3. Gradually phase out claim system

### Database Migration:

```sql
-- Run this migration
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS payouts_enabled BOOLEAN DEFAULT FALSE;
```

---

## 📋 Testing Checklist

- [ ] Create Connect account for booster
- [ ] Generate onboarding link
- [ ] Complete onboarding flow
- [ ] Check `charges_enabled` and `payouts_enabled` are true
- [ ] Customer selects booster before checkout
- [ ] PaymentIntent created with `application_fee_amount` and `transfer_data`
- [ ] Payment succeeds, funds split automatically
- [ ] Platform receives 50%, booster receives 50%
- [ ] Order created with `booster_id` from start

---

## ⚠️ Important Notes

1. **Booster onboarding is required** - No Connect account = can't take orders
2. **Flow changes completely** - Old claim flow removed
3. **Existing orders** - Handle separately
4. **UI changes needed** - Booster selection before payment
5. **Stripe fees** - Platform pays fee on application_fee, booster pays on their portion

---

## 🎯 Next Steps

1. Decide: Pre-assign or keep claim flow?
2. If pre-assign: Implement all steps above
3. If keep claim: Use Transfer API after claim (complex)
4. Test thoroughly in Stripe test mode
5. Enable Connect in production

---

## 📚 Resources

- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Express Accounts](https://stripe.com/docs/connect/express-accounts)
- [Application Fees](https://stripe.com/docs/connect/charges)
- [Testing Connect](https://stripe.com/docs/connect/testing)

