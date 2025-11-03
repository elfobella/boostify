# How to Check Escrow System is Working

## Quick Test Query

Run this in **Supabase SQL Editor**:

```sql
-- Check payment_transactions table
SELECT 
  pt.id,
  pt.stripe_payment_intent_id,
  pt.total_amount,
  pt.platform_fee,
  pt.booster_amount,
  pt.payment_status,
  pt.created_at,
  o.status as order_status
FROM payment_transactions pt
JOIN orders o ON pt.order_id = o.id
ORDER BY pt.created_at DESC
LIMIT 10;
```

## What to Look For

✅ **Good Signs:**
- `platform_fee` = 50% of `total_amount`
- `booster_amount` = 50% of `total_amount`
- `payment_status` = 'captured' when order is claimed
- `payment_status` = 'transferred' when customer approves

❌ **Problems:**
- `platform_fee` = 0 or wrong amount
- `booster_amount` = 0 or wrong amount
- No rows in `payment_transactions` after claim

## Expected Flow

1. **Customer Pays** → Order created
2. **Booster Claims** → `payment_transactions` row created with:
   - `platform_fee` = $50 (for $100 order)
   - `booster_amount` = $50
   - `payment_status` = 'captured'
3. **Booster Completes** → Order status = 'awaiting_review'
4. **Customer Approves** → `payment_transactions.payment_status` = 'transferred'

## Note

In **MVP (without Stripe Connect)**, money doesn't actually move in Stripe. 
All funds stay in platform's Stripe account.
The `payment_transactions` table just **tracks** how much belongs to each party.

Real split happens later when you:
- Add Stripe Connect
- Or manually payout boosters from platform account

