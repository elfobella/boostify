-- Add balance and cashback system to users table
-- This migration adds balance, cashback fields and creates balance_transactions table

-- Step 1: Add balance and cashback columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS balance DECIMAL(10, 2) DEFAULT 0.00 CHECK (balance >= 0),
  ADD COLUMN IF NOT EXISTS cashback DECIMAL(10, 2) DEFAULT 0.00 CHECK (cashback >= 0);

-- Step 2: Create balance_transactions table to track all balance operations
CREATE TABLE IF NOT EXISTS balance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'payment', 'cashback', 'refund')),
  amount DECIMAL(10, 2) NOT NULL,
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  cashback_amount DECIMAL(10, 2) DEFAULT 0.00,
  description TEXT,
  -- For deposits: Stripe payment intent ID
  -- For payments: Order ID
  reference_id TEXT,
  reference_type TEXT CHECK (reference_type IN ('payment_intent', 'order', 'manual')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT balance_transactions_type_check 
    CHECK (transaction_type IN ('deposit', 'withdrawal', 'payment', 'cashback', 'refund'))
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_balance_transactions_user_id 
  ON balance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_created_at 
  ON balance_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_type 
  ON balance_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_reference 
  ON balance_transactions(reference_type, reference_id);

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE balance_transactions ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
-- Policy: Users can view their own balance transactions
CREATE POLICY "Users can view own balance transactions" ON balance_transactions
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Policy: Service role can do everything (for backend operations)
CREATE POLICY "Service role full access" ON balance_transactions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Step 6: Add comments for documentation
COMMENT ON COLUMN users.balance IS 'User account balance in USD';
COMMENT ON COLUMN users.cashback IS 'Total cashback earned by user';
COMMENT ON TABLE balance_transactions IS 'Tracks all balance-related transactions (deposits, withdrawals, payments, cashback)';
COMMENT ON COLUMN balance_transactions.transaction_type IS 'Type: deposit, withdrawal, payment, cashback, refund';
COMMENT ON COLUMN balance_transactions.reference_id IS 'External reference ID (payment_intent_id for deposits, order_id for payments)';
COMMENT ON COLUMN balance_transactions.reference_type IS 'Type of reference: payment_intent, order, or manual';

