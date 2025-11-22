-- Make payment_intent_id nullable to support balance payments
-- This allows orders to be created without Stripe payment intent (when paid with balance)

-- Step 1: Drop the unique constraint on payment_intent_id
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_intent_id_key;

-- Step 2: Make payment_intent_id nullable
ALTER TABLE orders ALTER COLUMN payment_intent_id DROP NOT NULL;

-- Step 3: Add a partial unique index that only applies to non-null payment_intent_id values
-- This ensures uniqueness for Stripe payments while allowing multiple null values for balance payments
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_intent_id_unique 
  ON orders(payment_intent_id) 
  WHERE payment_intent_id IS NOT NULL;

-- Step 4: Add payment_method column to track how the order was paid
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stripe' 
  CHECK (payment_method IN ('stripe', 'balance', 'mixed'));

-- Step 5: Add balance_used column to track balance amount used
ALTER TABLE orders ADD COLUMN IF NOT EXISTS balance_used DECIMAL(10, 2) DEFAULT 0.00;

-- Step 6: Add comments
COMMENT ON COLUMN orders.payment_intent_id IS 'Stripe payment intent ID (null for balance-only payments)';
COMMENT ON COLUMN orders.payment_method IS 'Payment method: stripe, balance, or mixed';
COMMENT ON COLUMN orders.balance_used IS 'Amount paid from user balance';

