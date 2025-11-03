-- Escrow Payment System Database Schema (MVP Version - Without Stripe Connect)
-- Run this in Supabase SQL Editor
-- This version is for MVP testing without Stripe Connect

-- ============================================
-- 1. PAYMENT TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_charge_id TEXT,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booster_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Will be null when order created
  
  -- Amounts (in USD, stored as decimal)
  total_amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL, -- 50% of total
  booster_amount DECIMAL(10, 2) NOT NULL, -- 50% of total
  currency TEXT NOT NULL DEFAULT 'usd',
  
  -- Transfer tracking (for future Stripe Connect)
  transfer_id TEXT, -- Will be used when Stripe Connect is implemented
  transfer_status TEXT, -- 'pending', 'paid', 'failed' (manual for MVP)
  transfer_paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Payment status
  payment_status TEXT NOT NULL DEFAULT 'captured',
  -- 'captured': Payment held in escrow
  -- 'transferred': Money released (manual payout)
  -- 'refunded': Full refund to customer
  
  -- Timestamps
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  transferred_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT payment_transactions_payment_status_check 
    CHECK (payment_status IN ('captured', 'transferred', 'refunded')),
  CONSTRAINT payment_transactions_transfer_status_check 
    CHECK (transfer_status IN ('pending', 'paid', 'failed', NULL))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id 
  ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_payment_intent 
  ON payment_transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer_id 
  ON payment_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_booster_id 
  ON payment_transactions(booster_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_status 
  ON payment_transactions(payment_status);

-- ============================================
-- 2. UPDATE ORDERS TABLE
-- ============================================
-- Add new columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_approved_at 
  TIMESTAMP WITH TIME ZONE;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_rejected_at 
  TIMESTAMP WITH TIME ZONE;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update status constraint to include new statuses
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN (
    'pending', 
    'processing', 
    'awaiting_review', 
    'completed', 
    'cancelled', 
    'disputed', 
    'refunded'
  ));

-- Add payment status constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
  CHECK (payment_status IN ('pending', 'captured', 'transferred', 'refunded'));

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- ============================================
-- 3. ORDER DISPUTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booster_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Dispute details
  dispute_type TEXT NOT NULL,
  -- 'quality_issue': Service quality problems
  -- 'not_completed': Service not completed
  -- 'scam': Suspected fraud
  -- 'other': Other issues
  
  description TEXT NOT NULL,
  
  -- Resolution
  resolution_status TEXT DEFAULT 'pending',
  -- 'pending': Waiting for admin review
  -- 'resolved': Dispute approved, refund issued
  -- 'dismissed': Dispute rejected, payment released
  
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_disputes_order_id ON order_disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_order_disputes_customer_id ON order_disputes(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_disputes_booster_id ON order_disputes(booster_id);
CREATE INDEX IF NOT EXISTS idx_order_disputes_resolution_status ON order_disputes(resolution_status);

-- ============================================
-- 4. PAYMENT AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS payment_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES payment_transactions(id),
  order_id UUID REFERENCES orders(id),
  
  -- Audit details
  action TEXT NOT NULL,
  -- 'capture': Payment captured
  -- 'transfer': Money transferred to booster
  -- 'refund': Refund issued
  -- 'dispute_created': Dispute filed
  -- 'dispute_resolved': Dispute resolved
  
  actor_id UUID REFERENCES users(id),
  old_status TEXT,
  new_status TEXT,
  metadata JSONB, -- Flexible metadata storage
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_audit_log_transaction_id 
  ON payment_audit_log(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_log_order_id 
  ON payment_audit_log(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_log_created_at 
  ON payment_audit_log(created_at DESC);

-- ============================================
-- 5. FUNCTIONS FOR UPDATED_AT
-- ============================================

-- Update trigger for payment_transactions
CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payment_transactions_updated_at 
  ON payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_transactions_updated_at();

-- Update trigger for order_disputes
CREATE OR REPLACE FUNCTION update_order_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_order_disputes_updated_at 
  ON order_disputes;
CREATE TRIGGER update_order_disputes_updated_at
  BEFORE UPDATE ON order_disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_order_disputes_updated_at();

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS) - DISABLED FOR MVP
-- ============================================
-- NOTE: RLS is disabled because we use NextAuth, not Supabase Auth
-- All security is handled by API routes using service_role

ALTER TABLE payment_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_disputes DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_audit_log DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Function to calculate platform fee
CREATE OR REPLACE FUNCTION calculate_platform_fee(
  total_amount DECIMAL,
  commission_rate DECIMAL DEFAULT 0.5
) RETURNS DECIMAL AS $$
BEGIN
  RETURN total_amount * commission_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate booster amount
CREATE OR REPLACE FUNCTION calculate_booster_amount(
  total_amount DECIMAL,
  commission_rate DECIMAL DEFAULT 0.5
) RETURNS DECIMAL AS $$
BEGIN
  RETURN total_amount * (1 - commission_rate);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. VIEWS FOR REPORTING
-- ============================================

-- View: Recent payment transactions with details
CREATE OR REPLACE VIEW v_payment_transactions_with_details AS
SELECT 
  pt.id,
  pt.order_id,
  pt.stripe_payment_intent_id,
  pt.total_amount,
  pt.platform_fee,
  pt.booster_amount,
  pt.payment_status,
  pt.transfer_status,
  pt.created_at,
  pt.captured_at,
  pt.transferred_at,
  pt.refunded_at,
  o.status as order_status,
  c.name as customer_name,
  c.email as customer_email,
  b.name as booster_name,
  b.email as booster_email
FROM payment_transactions pt
LEFT JOIN orders o ON pt.order_id = o.id
LEFT JOIN users c ON pt.customer_id = c.id
LEFT JOIN users b ON pt.booster_id = b.id;

-- View: Platform revenue summary
CREATE OR REPLACE VIEW v_platform_revenue_summary AS
SELECT 
  DATE_TRUNC('day', captured_at) as date,
  COUNT(*) as total_transactions,
  SUM(total_amount) as total_revenue,
  SUM(platform_fee) as total_platform_fee,
  SUM(CASE WHEN payment_status = 'transferred' THEN booster_amount ELSE 0 END) as total_paid_to_boosters,
  SUM(CASE WHEN payment_status = 'refunded' THEN total_amount ELSE 0 END) as total_refunded
FROM payment_transactions
GROUP BY DATE_TRUNC('day', captured_at)
ORDER BY date DESC;

-- View: Pending disbursements (orders awaiting customer approval)
CREATE OR REPLACE VIEW v_pending_disbursements AS
SELECT 
  pt.id,
  pt.order_id,
  pt.booster_id,
  pt.booster_amount,
  pt.created_at,
  o.status as order_status,
  b.name as booster_name,
  b.email as booster_email
FROM payment_transactions pt
JOIN orders o ON pt.order_id = o.id
LEFT JOIN users b ON pt.booster_id = b.id
WHERE pt.payment_status = 'captured'
  AND o.status = 'awaiting_review'
ORDER BY pt.created_at ASC;

