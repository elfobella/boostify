-- ⚠️ WARNING: This migration will DROP and recreate the users table
-- This will DELETE ALL USER DATA! Use only for development/testing.
-- In production, backup data first!

-- Step 1: Drop all dependent objects first
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Step 2: Drop indexes
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_provider_id;
DROP INDEX IF EXISTS idx_users_provider;
DROP INDEX IF EXISTS idx_users_role;

-- Step 3: Handle foreign key constraints
-- Check if orders table has foreign key to users
DO $$
BEGIN
    -- Drop foreign key if exists (booster_id in orders)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_booster_id_fkey'
    ) THEN
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_booster_id_fkey;
    END IF;
END $$;

-- Step 4: Drop and recreate users table
DROP TABLE IF EXISTS users CASCADE;

-- Step 5: Create fresh users table with all columns
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  provider TEXT NOT NULL, -- 'discord', 'google', 'email'
  provider_id TEXT, -- OAuth provider user ID
  password_hash TEXT, -- For email/password auth (nullable)
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'booster', 'admin')),
  -- Stripe Connect fields
  stripe_connect_account_id TEXT UNIQUE,
  onboarding_complete BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  charges_enabled BOOLEAN DEFAULT false,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT users_provider_check CHECK (provider IN ('discord', 'google', 'email'))
);

-- Step 6: Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider_id ON users(provider_id);
CREATE INDEX idx_users_provider ON users(provider);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_stripe_connect_account ON users(stripe_connect_account_id) WHERE stripe_connect_account_id IS NOT NULL;

-- Step 7: Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger for auto-update
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 10: Create RLS policies
-- Policy: Users can read their own data (if using Supabase Auth)
CREATE POLICY "Users can view own data" ON users
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- Policy: Service role can do everything (for backend operations)
CREATE POLICY "Service role full access" ON users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Step 11: Re-add foreign key constraint to orders if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        -- First, clean up any orphaned booster_id references (set to NULL if user doesn't exist)
        UPDATE orders 
        SET booster_id = NULL 
        WHERE booster_id IS NOT NULL 
        AND booster_id NOT IN (SELECT id FROM users);
        
        -- Now add the foreign key constraint
        -- Drop existing constraint if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'orders_booster_id_fkey'
        ) THEN
            ALTER TABLE orders DROP CONSTRAINT orders_booster_id_fkey;
        END IF;
        
        -- Add the constraint
        ALTER TABLE orders 
        ADD CONSTRAINT orders_booster_id_fkey 
        FOREIGN KEY (booster_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Step 12: Add comment for documentation
COMMENT ON TABLE users IS 'User accounts with authentication and role management';
COMMENT ON COLUMN users.role IS 'User role: customer (default), booster, or admin';
COMMENT ON COLUMN users.stripe_connect_account_id IS 'Stripe Connect account ID for boosters';
COMMENT ON COLUMN users.onboarding_complete IS 'Whether booster completed Stripe onboarding';
COMMENT ON COLUMN users.payouts_enabled IS 'Whether Stripe has enabled payouts for this account';
COMMENT ON COLUMN users.charges_enabled IS 'Whether Stripe has enabled charges for this account';

