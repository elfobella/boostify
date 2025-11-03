# Manual Payout Guide (MVP)

## How to Pay Boosters Manually

Since we're not using Stripe Connect in MVP, you need to manually pay boosters. Here are your options:

---

## Method 1: Stripe Dashboard (Easiest for Testing)

### Steps:

1. **Go to Stripe Dashboard** → [Transactions](https://dashboard.stripe.com/test/transactions)
2. **Find the payment** from the customer
3. **Get booster's payment info** from database:
   ```sql
   -- Get approved orders waiting for payout
   SELECT 
     pt.id,
     pt.stripe_payment_intent_id,
     pt.total_amount,
     pt.platform_fee,
     pt.booster_amount,
     pt.created_at,
     b.name as booster_name,
     b.email as booster_email
   FROM payment_transactions pt
   JOIN users b ON pt.booster_id = b.id
   JOIN orders o ON pt.order_id = o.id
   WHERE pt.payment_status = 'transferred'
     AND o.status = 'completed'
   ORDER BY pt.transferred_at DESC;
   ```

4. **Send money to booster** using:
   - PayPal
   - Bank Transfer
   - Cash App
   - Venmo
   - Crypto wallet
   - Or any other method you prefer

5. **Mark as paid** in your system (optional):
   ```sql
   UPDATE payment_transactions
   SET transfer_status = 'paid',
       transfer_paid_at = NOW()
   WHERE id = 'transaction-id-here';
   ```

---

## Method 2: External Payment Services (Recommended)

### Use services that allow sending money:

1. **PayPal** - Free between accounts, instant
2. **Venmo** - Free, instant
3. **Cash App** - Free, instant
4. **Wise** - Low fees, international transfers
5. **Bank Transfer** - Traditional wire/ACH

**Steps:**
1. Get booster's payment info from database
2. Send amount = `booster_amount`
3. Keep `platform_fee` in Stripe

**Pros:** 
- Fast and easy
- Low/no fees
- Boosters get money quickly

**Cons:** 
- Not tracked in Stripe
- Manual record keeping needed

---

## Method 3: Admin Dashboard (Future)

Build an admin panel to:
- List unpaid boosters
- Show pending amounts
- Mark as paid
- Integration with Stripe transfers API

### Example Admin Query:

```sql
-- View pending payouts
SELECT 
  pt.id as transaction_id,
  pt.booster_amount,
  pt.transferred_at,
  b.name as booster_name,
  b.email as booster_email,
  o.id as order_id,
  o.amount as order_total
FROM payment_transactions pt
JOIN orders o ON pt.order_id = o.id
JOIN users b ON pt.booster_id = b.id
WHERE pt.payment_status = 'transferred'
  AND pt.transfer_status IS NULL
  AND o.status = 'completed'
ORDER BY pt.transferred_at ASC;
```

---

## Recommended Workflow (MVP)

### Weekly Payout Process:

1. **Monday Morning:**
   - Run query to get all unpaid boosters
   - Calculate total amount needed
   
2. **Prepare Payouts:**
   - Batch payments by platform fee vs booster amount
   - Keep platform fee, send booster amount
   
3. **Send Money:**
   - PayPal/Venmo for small amounts
   - Bank transfer for large amounts
   
4. **Track:**
   - Update `transfer_status = 'paid'` in database
   - Keep records for accounting

---

## Example SQL Queries

### Weekly Payout Summary:

```sql
-- Total amounts for completed orders this week
SELECT 
  DATE_TRUNC('week', pt.transferred_at) as week,
  COUNT(*) as completed_orders,
  SUM(pt.total_amount) as total_revenue,
  SUM(pt.platform_fee) as platform_earnings,
  SUM(pt.booster_amount) as total_booster_payouts_needed
FROM payment_transactions pt
JOIN orders o ON pt.order_id = o.id
WHERE pt.payment_status = 'transferred'
  AND o.status = 'completed'
GROUP BY DATE_TRUNC('week', pt.transferred_at)
ORDER BY week DESC;
```

### List Boosters Waiting for Payment:

```sql
-- Booster payout queue
SELECT 
  b.name,
  b.email,
  COUNT(*) as pending_orders,
  SUM(pt.booster_amount) as total_pending_amount
FROM payment_transactions pt
JOIN users b ON pt.booster_id = b.id
JOIN orders o ON pt.order_id = o.id
WHERE pt.payment_status = 'transferred'
  AND pt.transfer_status IS NULL
  AND o.status = 'completed'
GROUP BY b.id, b.name, b.email
ORDER BY total_pending_amount DESC;
```

---

## Important Notes

⚠️ **Security:**
- Never store booster payment info in plain text
- Use encrypted payment methods
- Keep audit trail of all payouts

⚠️ **Accounting:**
- Platform keeps `platform_fee`
- Booster gets `booster_amount`
- Track all transfers in `payment_transactions.transfer_status`

⚠️ **Scale Warning:**
- Manual payout doesn't scale
- Consider Stripe Connect for production
- Max recommended: ~20 boosters before automation

---

## Transition to Stripe Connect

When ready for production:
1. Set up Stripe Connect account
2. Implement booster onboarding
3. Use automatic transfers
4. Migrate historical data

See: `docs/ESCROW_PAYMENT_SYSTEM.md` for full implementation guide.

