-- Coupon System Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. COUPONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  min_amount DECIMAL(10, 2) DEFAULT 0, -- Minimum order amount to use coupon
  max_discount DECIMAL(10, 2), -- Maximum discount amount (for percentage discounts)
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  usage_limit INTEGER, -- Total usage limit (NULL = unlimited)
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for coupons
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON coupons(valid_until);

-- ============================================
-- 2. COUPON USAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  payment_transaction_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  original_amount DECIMAL(10, 2) NOT NULL,
  final_amount DECIMAL(10, 2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for coupon_usages
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_id ON coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user_id ON coupon_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_order_id ON coupon_usages(order_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_used_at ON coupon_usages(used_at DESC);

-- ============================================
-- 3. UPDATE PAYMENT_TRANSACTIONS TABLE
-- ============================================
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- Index for coupon_code in payment_transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_coupon_code 
  ON payment_transactions(coupon_code);

-- ============================================
-- 4. UPDATE ORDERS TABLE
-- ============================================
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;

-- ============================================
-- 5. FUNCTIONS
-- ============================================

-- Function to update coupons updated_at
CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_coupons_updated_at();

-- Function to calculate discount amount
CREATE OR REPLACE FUNCTION calculate_discount(
  p_amount DECIMAL,
  p_discount_type VARCHAR,
  p_discount_value DECIMAL,
  p_max_discount DECIMAL DEFAULT NULL
) RETURNS DECIMAL AS $$
DECLARE
  v_discount DECIMAL;
BEGIN
  IF p_discount_type = 'percentage' THEN
    v_discount := p_amount * (p_discount_value / 100);
    -- Apply max discount if specified
    IF p_max_discount IS NOT NULL AND v_discount > p_max_discount THEN
      v_discount := p_max_discount;
    END IF;
  ELSIF p_discount_type = 'fixed' THEN
    v_discount := LEAST(p_discount_value, p_amount); -- Can't discount more than the amount
  ELSE
    v_discount := 0;
  END IF;
  
  RETURN ROUND(v_discount, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================
-- RLS is disabled because we use NextAuth, not Supabase Auth
-- All security is handled by API routes using service_role

ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. SAMPLE COUPONS (Optional - for testing)
-- ============================================
-- Uncomment to create sample coupons for testing

/*
-- 10% off coupon (unlimited uses)
INSERT INTO coupons (code, discount_type, discount_value, valid_until, usage_limit, description)
VALUES ('WELCOME10', 'percentage', 10, NOW() + INTERVAL '1 year', NULL, 'Welcome 10% discount');

-- $5 off coupon (100 uses, minimum $20 order)
INSERT INTO coupons (code, discount_type, discount_value, min_amount, valid_until, usage_limit, description)
VALUES ('SAVE5', 'fixed', 5, 20, NOW() + INTERVAL '6 months', 100, 'Save $5 on orders over $20');

-- 20% off coupon (max $50 discount, 50 uses)
INSERT INTO coupons (code, discount_type, discount_value, max_discount, valid_until, usage_limit, description)
VALUES ('BIG20', 'percentage', 20, 50, NOW() + INTERVAL '3 months', 50, '20% off up to $50');
*/

