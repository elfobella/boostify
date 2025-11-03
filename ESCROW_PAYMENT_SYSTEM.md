# Escrow Payment System Design

## Overview
This document outlines the technical design for implementing an escrow payment system where customer payments are held until service completion approval or refund.

---

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Architecture Overview](#architecture-overview)
3. [Stripe Connect Integration](#stripe-connect-integration)
4. [Database Schema](#database-schema)
5. [Payment Flow](#payment-flow)
6. [Order States](#order-states)
7. [API Endpoints](#api-endpoints)
8. [Webhook Handlers](#webhook-handlers)
9. [Dispute & Refund Process](#dispute--refund-process)
10. [Security Considerations](#security-considerations)

---

## System Requirements

### Functional Requirements
1. **Payment Hold**: Customer payment must be held in escrow until completion
2. **Commission Split**: Platform takes 50%, booster receives 50% on approval
3. **Approval Required**: Money only moves when customer approves completion
4. **Refund Capability**: Payment returns to customer if order is rejected/cancelled
5. **Dispute Handling**: Platform can mediate and decide on disputes

### Non-Functional Requirements
1. **Security**: All payment operations must be PCI compliant via Stripe
2. **Reliability**: Payment transfers must be atomic and idempotent
3. **Auditability**: Complete transaction history and logging
4. **Compliance**: Follow Stripe's marketplace regulations

---

## Architecture Overview

### High-Level Flow

```
┌─────────────┐
│  Customer   │ Pays $100
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Stripe Connect                     │
│  - PaymentIntent captured           │
│  - $100 held in escrow              │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Database                           │
│  - Order: pending_customer_review   │
│  - Payment: captured                │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────┐
│  Booster    │ Completes service
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Customer Approval                  │
│  - Approves → $50 to platform       │
│              → $50 to booster       │
│  - Rejects  → $100 refunded         │
└─────────────────────────────────────┘
```

---

## Stripe Connect Integration

### Why Stripe Connect?
Stripe Connect is designed for marketplace platforms where funds need to be distributed to multiple parties. It supports:

- **Connect Accounts**: Each booster needs a Stripe Connect account
- **Application Fees**: Platform can take a fixed commission
- **Hold & Release**: Funds can be held and released based on conditions
- **Direct Charges**: Customer can pay directly to the marketplace

### Setup Steps

#### 1. Create Stripe Connect Account

```bash
# Stripe CLI command (for development)
stripe connect onbaording links create
```

Or via Dashboard:
1. Go to Stripe Dashboard → Connect → Settings
2. Enable platform features
3. Configure Connect settings

#### 2. Connect Account Creation for Boosters

Each booster must create a Stripe Connect account:

```typescript
// app/api/boosters/connect/setup/route.ts
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const session = await auth()
  const { boosterId } = await req.json()
  
  // Create Stripe Connect account for booster
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'US', // or appropriate country
    email: booster.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })
  
  // Store Connect account ID in database
  await supabaseAdmin
    .from('users')
    .update({ stripe_connect_account_id: account.id })
    .eq('id', boosterId)
    
  return NextResponse.json({ accountId: account.id })
}
```

#### 3. Charge with Application Fee

```typescript
// Create charge with platform fee
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000, // $100.00 in cents
  currency: 'usd',
  application_fee_amount: 5000, // $50.00 platform fee (50%)
  transfer_data: {
    destination: booster.stripe_connect_account_id, // $50.00 to booster
  },
  metadata: {
    order_id: order.id,
    customer_id: customer.id,
    booster_id: booster.id,
  },
})
```

---

## Database Schema

### New Tables

#### 1. `payment_transactions` Table

```sql
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_charge_id TEXT,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booster_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Amounts
  total_amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL, -- 50% of total
  booster_amount DECIMAL(10, 2) NOT NULL, -- 50% of total
  currency TEXT NOT NULL DEFAULT 'usd',
  
  -- Transfer tracking
  transfer_id TEXT, -- Stripe transfer ID for booster
  transfer_status TEXT, -- 'pending', 'paid', 'failed'
  transfer_paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  payment_status TEXT NOT NULL DEFAULT 'captured', 
  -- 'captured', 'transferred', 'refunded'
  
  -- Tracking
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  transferred_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT payment_transactions_status_check 
    CHECK (payment_status IN ('captured', 'transferred', 'refunded')),
  CONSTRAINT payment_transactions_transfer_status_check 
    CHECK (transfer_status IN ('pending', 'paid', 'failed'))
);

CREATE INDEX idx_payment_transactions_order_id 
  ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_stripe_payment_intent 
  ON payment_transactions(stripe_payment_intent_id);
```

#### 2. `booster_connect_accounts` Table

```sql
CREATE TABLE IF NOT EXISTS booster_connect_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booster_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_connect_account_id TEXT UNIQUE NOT NULL,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  payouts_enabled BOOLEAN DEFAULT FALSE,
  charges_enabled BOOLEAN DEFAULT FALSE,
  
  -- Account info
  country TEXT,
  email TEXT,
  business_type TEXT, -- 'individual', 'company'
  
  -- Onboarding
  onboarding_started_at TIMESTAMP WITH TIME ZONE,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_booster_connect_accounts_booster_id 
  ON booster_connect_accounts(booster_id);
```

#### 3. Update `orders` Table

Add new statuses and payment tracking:

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT 
  DEFAULT 'pending';

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_approved_at 
  TIMESTAMP WITH TIME ZONE;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_rejected_at 
  TIMESTAMP WITH TIME ZONE;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'processing', 'awaiting_review', 'completed', 'cancelled', 'disputed', 'refunded'));

ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
  CHECK (payment_status IN ('pending', 'captured', 'transferred', 'refunded'));
```

---

## Payment Flow

### Flow 1: Payment Creation (Customer Pays)

```typescript
// app/api/payments/create/route.ts
export async function POST(req: NextRequest) {
  const { orderId, boosterId } = await req.json()
  const session = await auth()
  
  // Get order and booster info
  const order = await getOrder(orderId)
  const booster = await getBooster(boosterId)
  
  // Ensure booster has Stripe Connect account
  const connectAccount = await getConnectAccount(booster.id)
  if (!connectAccount || !connectAccount.charges_enabled) {
    throw new Error('Booster must complete Stripe onboarding')
  }
  
  // Calculate amounts
  const totalAmount = order.amount * 100 // Convert to cents
  const platformFee = Math.floor(totalAmount * 0.5) // 50%
  const boosterAmount = totalAmount - platformFee // 50%
  
  // Create PaymentIntent with application fee
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount,
    currency: 'usd',
    application_fee_amount: platformFee,
    transfer_data: {
      destination: booster.stripe_connect_account_id,
    },
    metadata: {
      order_id: orderId,
      customer_id: session.user.id,
      booster_id: boosterId,
    },
    capture_method: 'manual', // IMPORTANT: Hold payment
  })
  
  // Store transaction
  await supabaseAdmin.from('payment_transactions').insert({
    order_id: orderId,
    stripe_payment_intent_id: paymentIntent.id,
    customer_id: session.user.id,
    booster_id: boosterId,
    total_amount: order.amount,
    platform_fee: platformFee / 100,
    booster_amount: boosterAmount / 100,
    payment_status: 'captured', // Captured but not transferred
  })
  
  return NextResponse.json({ 
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id 
  })
}
```

### Flow 2: Capture Payment (After Card Confirmation)

```typescript
// Webhook: payment_intent.succeeded
export async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent
  
  // Update order status
  await supabaseAdmin
    .from('orders')
    .update({ 
      status: 'pending',
      payment_status: 'captured' 
    })
    .eq('payment_intent_id', paymentIntent.id)
    
  // Log transaction
  console.log('✅ Payment captured and held in escrow:', {
    orderId: paymentIntent.metadata.order_id,
    amount: paymentIntent.amount,
  })
}
```

### Flow 3: Customer Approves Order

```typescript
// app/api/orders/approve/route.ts
export async function POST(req: NextRequest) {
  const { orderId } = await req.json()
  const session = await auth()
  
  // Verify customer owns this order
  const order = await getOrder(orderId)
  if (order.user_id !== session.user.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    )
  }
  
  if (order.status !== 'awaiting_review') {
    return NextResponse.json(
      { error: 'Order is not awaiting review' },
      { status: 400 }
    )
  }
  
  // Get payment transaction
  const transaction = await getPaymentTransaction(orderId)
  
  // Create transfer to booster (Stripe handles this automatically with Connect)
  // For manual transfers, we use:
  const transfer = await stripe.transfers.create({
    amount: transaction.booster_amount * 100,
    currency: 'usd',
    destination: transaction.booster.stripe_connect_account_id,
    transfer_group: orderId,
  })
  
  // Update transaction and order
  await supabaseAdmin.from('payment_transactions').update({
    transfer_id: transfer.id,
    transfer_status: 'paid',
    transfer_paid_at: new Date().toISOString(),
    payment_status: 'transferred',
    transferred_at: new Date().toISOString(),
  }).eq('order_id', orderId)
  
  await supabaseAdmin.from('orders').update({
    status: 'completed',
    payment_status: 'transferred',
    customer_approved_at: new Date().toISOString(),
  }).eq('id', orderId)
  
  return NextResponse.json({ 
    success: true,
    message: 'Payment transferred to booster' 
  })
}
```

### Flow 4: Customer Rejects/Booster Refund

```typescript
// app/api/orders/reject/route.ts
export async function POST(req: NextRequest) {
  const { orderId, reason } = await req.json()
  const session = await auth()
  
  const order = await getOrder(orderId)
  if (order.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  const transaction = await getPaymentTransaction(orderId)
  
  // Refund full amount to customer
  const refund = await stripe.refunds.create({
    payment_intent: transaction.stripe_payment_intent_id,
    amount: transaction.total_amount * 100, // Full refund
    reason: 'requested_by_customer',
    metadata: {
      order_id: orderId,
      rejection_reason: reason,
    },
  })
  
  // Update database
  await supabaseAdmin.from('payment_transactions').update({
    payment_status: 'refunded',
    refunded_at: new Date().toISOString(),
  }).eq('order_id', orderId)
  
  await supabaseAdmin.from('orders').update({
    status: 'refunded',
    payment_status: 'refunded',
    customer_rejected_at: new Date().toISOString(),
    rejection_reason: reason,
  }).eq('id', orderId)
  
  return NextResponse.json({ 
    success: true,
    message: 'Payment refunded' 
  })
}
```

### Flow 5: Booster Cancels Order

```typescript
// app/api/orders/booster-cancel/route.ts
export async function POST(req: NextRequest) {
  const { orderId, reason } = await req.json()
  const session = await auth()
  
  // Verify user is booster
  const user = await getUser(session.user.id)
  if (user.role !== 'booster') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  const order = await getOrder(orderId)
  if (order.booster_id !== user.id) {
    return NextResponse.json({ error: 'Not your order' }, { status: 403 })
  }
  
  // Same refund logic as customer rejection
  const transaction = await getPaymentTransaction(orderId)
  
  const refund = await stripe.refunds.create({
    payment_intent: transaction.stripe_payment_intent_id,
    amount: transaction.total_amount * 100,
    reason: 'requested_by_customer', // Can be 'duplicate' or 'fraudulent'
  })
  
  // Update order
  await supabaseAdmin.from('orders').update({
    status: 'refunded',
    payment_status: 'refunded',
    booster_id: null, // Release order
    booster_canceled_at: new Date().toISOString(),
    rejection_reason: reason,
  }).eq('id', orderId)
  
  return NextResponse.json({ success: true })
}
```

---

## Order States

### State Diagram

```
pending
  ↓ (booster claims)
processing
  ↓ (booster marks complete)
awaiting_review
  ↓                    ↓
  ├─ approved       ├─ rejected
  ↓                    ↓
completed           refunded
  (payment             (refund to
   released)            customer)
```

### State Descriptions

| State | Payment Status | Description |
|-------|---------------|-------------|
| `pending` | `captured` | Order created, payment captured, waiting for booster |
| `processing` | `captured` | Booster working on order |
| `awaiting_review` | `captured` | Order complete, waiting for customer approval |
| `completed` | `transferred` | Customer approved, money released |
| `cancelled` | `refunded` | Order cancelled before completion |
| `refunded` | `refunded` | Customer rejected, refund processed |
| `disputed` | `captured` | Under dispute resolution |

---

## API Endpoints

### Payment Endpoints

#### `POST /api/payments/create`
Create payment with escrow hold.

**Request:**
```json
{
  "orderId": "uuid",
  "boosterId": "uuid"
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

#### `POST /api/payments/capture`
Manually capture payment (alternative flow).

#### `GET /api/payments/transaction/:orderId`
Get payment transaction details.

---

### Order Review Endpoints

#### `POST /api/orders/approve`
Customer approves order completion.

**Request:**
```json
{
  "orderId": "uuid"
}
```

#### `POST /api/orders/reject`
Customer rejects order completion.

**Request:**
```json
{
  "orderId": "uuid",
  "reason": "Service not completed as specified"
}
```

#### `POST /api/orders/booster-cancel`
Booster cancels order.

**Request:**
```json
{
  "orderId": "uuid",
  "reason": "Unable to complete"
}
```

---

### Order Status Endpoints

#### `POST /api/orders/:orderId/mark-complete`
Booster marks order as complete.

**Request:**
```json
{
  "completionNotes": "Reached target level successfully"
}
```

#### `POST /api/orders/:orderId/dispute`
Customer disputes order quality.

**Request:**
```json
{
  "reason": "Service quality issue",
  "description": "Details..."
}
```

---

## Webhook Handlers

### Stripe Webhooks

```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!
  
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  
  console.log('📥 Webhook received:', event.type)
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event)
      break
      
    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event)
      break
      
    case 'transfer.created':
      await handleTransferCreated(event)
      break
      
    case 'transfer.paid':
      await handleTransferPaid(event)
      break
      
    case 'refund.created':
      await handleRefundCreated(event)
      break
      
    default:
      console.log('Unhandled event type:', event.type)
  }
  
  return NextResponse.json({ received: true })
}
```

### Webhook Handler Functions

```typescript
async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent
  const orderId = paymentIntent.metadata.order_id
  
  // Update order to processing (if not already)
  await supabaseAdmin
    .from('orders')
    .update({ 
      payment_status: 'captured',
      status: 'processing' 
    })
    .eq('payment_intent_id', paymentIntent.id)
    
  console.log('✅ Payment captured for order:', orderId)
}

async function handleTransferPaid(event: Stripe.Event) {
  const transfer = event.data.object as Stripe.Transfer
  const orderId = transfer.transfer_group // Set during transfer creation
  
  // Update transaction
  await supabaseAdmin
    .from('payment_transactions')
    .update({
      transfer_status: 'paid',
      transfer_paid_at: new Date().toISOString(),
      payment_status: 'transferred',
    })
    .eq('transfer_id', transfer.id)
    
  console.log('✅ Transfer completed for order:', orderId)
}

async function handleRefundCreated(event: Stripe.Event) {
  const refund = event.data.object as Stripe.Refund
  const orderId = refund.metadata.order_id
  
  await supabaseAdmin
    .from('payment_transactions')
    .update({
      payment_status: 'refunded',
      refunded_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', refund.payment_intent)
    
  await supabaseAdmin
    .from('orders')
    .update({
      status: 'refunded',
      payment_status: 'refunded',
    })
    .eq('id', orderId)
    
  console.log('✅ Refund processed for order:', orderId)
}
```

---

## Dispute & Refund Process

### Dispute Flow

```
Customer disputes order
  ↓
Create dispute record
  ↓
Admin reviews dispute
  ↓
├─ Approve dispute → Full refund
├─ Reject dispute → Release payment
└─ Partial refund → Negotiate amount
```

### Database Schema for Disputes

```sql
CREATE TABLE IF NOT EXISTS order_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booster_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  dispute_type TEXT NOT NULL,
  -- 'quality_issue', 'not_completed', 'scam', 'other'
  
  description TEXT NOT NULL,
  resolution_status TEXT DEFAULT 'pending',
  -- 'pending', 'resolved', 'dismissed'
  
  admin_response TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT order_disputes_type_check 
    CHECK (dispute_type IN ('quality_issue', 'not_completed', 'scam', 'other')),
  CONSTRAINT order_disputes_resolution_check 
    CHECK (resolution_status IN ('pending', 'resolved', 'dismissed'))
);

CREATE INDEX idx_order_disputes_order_id ON order_disputes(order_id);
CREATE INDEX idx_order_disputes_status ON order_disputes(resolution_status);
```

### Dispute Resolution API

```typescript
// app/api/disputes/resolve/route.ts (Admin only)
export async function POST(req: NextRequest) {
  const { disputeId, resolution, refundAmount } = await req.json()
  const session = await auth()
  
  // Verify admin
  const user = await getUser(session.user.id)
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }
  
  const dispute = await getDispute(disputeId)
  const order = await getOrder(dispute.order_id)
  const transaction = await getPaymentTransaction(dispute.order_id)
  
  if (resolution === 'approve') {
    // Full or partial refund
    const refund = await stripe.refunds.create({
      payment_intent: transaction.stripe_payment_intent_id,
      amount: refundAmount || transaction.total_amount * 100,
    })
    
    // Update dispute and order
    await supabaseAdmin.from('order_disputes').update({
      resolution_status: 'resolved',
      admin_response: dispute.resolution_note,
      resolved_at: new Date().toISOString(),
      resolved_by: session.user.id,
    }).eq('id', disputeId)
    
    await supabaseAdmin.from('orders').update({
      status: 'refunded',
      payment_status: 'refunded',
    }).eq('id', dispute.order_id)
  }
  
  return NextResponse.json({ success: true })
}
```

---

## Security Considerations

### 1. PCI Compliance
- All card data handled by Stripe
- No storage of sensitive payment information
- HTTPS only for all payment flows

### 2. Authentication & Authorization
- Verify user ownership of orders
- Role-based access control (customer, booster, admin)
- Session validation on all payment endpoints

### 3. Idempotency
- Use Stripe's idempotency keys
- Track transaction states to prevent duplicate transfers

```typescript
const transfer = await stripe.transfers.create({
  // ... transfer params
}, {
  idempotencyKey: `transfer-${orderId}-${Date.now()}`
})
```

### 4. Rate Limiting
- Prevent payment abuse
- Limit approval/rejection requests
- Webhook retry handling

### 5. Audit Logging

```sql
CREATE TABLE IF NOT EXISTS payment_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES payment_transactions(id),
  order_id UUID REFERENCES orders(id),
  action TEXT NOT NULL,
  -- 'capture', 'transfer', 'refund', 'dispute_created'
  actor_id UUID REFERENCES users(id),
  old_status TEXT,
  new_status TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Environment Variables

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Platform Fee (default 50%)
PLATFORM_COMMISSION_RATE=0.5

# Connect
STRIPE_CONNECT_CLIENT_ID=ca_...
```

---

## Testing Strategy

### Unit Tests
- Commission calculation logic
- State transition validation
- Amount calculations

### Integration Tests
- End-to-end payment flows
- Webhook processing
- Error handling

### Test Scenarios
1. ✅ Successful payment capture
2. ✅ Customer approval → transfer
3. ✅ Customer rejection → refund
4. ✅ Booster cancellation → refund
5. ✅ Dispute resolution
6. ✅ Partial refund
7. ✅ Failed transfer handling
8. ✅ Webhook retries

---

## Migration Plan

### Phase 1: Setup Stripe Connect
1. Create Stripe Connect platform account
2. Set up webhook endpoint
3. Create database tables

### Phase 2: Booster Onboarding
1. Implement onboarding flow
2. Collect booster KYC information
3. Store Connect account IDs

### Phase 3: Payment Integration
1. Implement escrow payment creation
2. Add approval/rejection flows
3. Set up webhook handlers

### Phase 4: Testing & Rollout
1. Test with sandbox mode
2. Beta test with select boosters
3. Gradual rollout to all users

---

## Monitoring & Alerts

### Key Metrics
- Payment success rate
- Average time to approval/rejection
- Refund rate
- Dispute rate
- Transfer success rate

### Alerts
- Failed payment captures
- Failed transfers
- Unresponsive webhooks
- Dispute escalation threshold

---

## Cost Considerations

### Stripe Fees
- 2.9% + $0.30 per transaction
- No additional fee for Connect
- Platform fee is separate

### Example Calculation
- Customer pays: $100
- Stripe fee: $3.20 (2.9% + $0.30)
- Net after Stripe: $96.80
- Platform (50%): $48.40
- Booster (50%): $48.40
- Final Stripe fee split between parties

---

## Future Enhancements

1. **Auto-Release**: Auto-release after X days if no action
2. **Partial Approval**: Allow partial payment releases
3. **Milestone Payments**: Split payments by milestones
4. **Multi-Party Escrow**: Support multiple boosters per order
5. **Smart Contracts**: Blockchain-based escrow (advanced)

---

## References

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe Marketplace Guide](https://stripe.com/docs/connect/marketplaces-and-platforms)
- [Stripe Escrow Pattern](https://stripe.com/docs/connect/application-fees)
- [PCI Compliance Guide](https://stripe.com/docs/security/guide)

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-26  
**Author:** System Architecture Team

