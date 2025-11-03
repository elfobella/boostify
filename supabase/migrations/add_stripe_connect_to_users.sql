-- Add Stripe Connect fields to users table
-- Run this in Supabase SQL Editor

-- Add Connect-related columns
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS payouts_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS charges_enabled BOOLEAN DEFAULT FALSE;

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_connect_account 
  ON users(stripe_connect_account_id);

-- Add comments for documentation
COMMENT ON COLUMN users.stripe_connect_account_id IS 'Stripe Connect account ID for boosters';
COMMENT ON COLUMN users.onboarding_complete IS 'Whether booster completed Stripe onboarding';
COMMENT ON COLUMN users.payouts_enabled IS 'Whether Stripe has enabled payouts for this account';
COMMENT ON COLUMN users.charges_enabled IS 'Whether Stripe has enabled charges for this account';

-- Add constraint to ensure connect account is unique
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_stripe_connect_account_id_unique'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_stripe_connect_account_id_unique 
        UNIQUE (stripe_connect_account_id);
    END IF;
END $$;

