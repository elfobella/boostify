-- Comprehensive RLS Policy Fix for Users Table
-- This ensures service role can read/write users table
-- Run this in Supabase SQL Editor to fix RLS issues

-- Step 1: Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON users;
DROP POLICY IF EXISTS "Service role bypass RLS" ON users;

-- Step 2: Create service role policy with multiple detection methods
-- Method 1: Check auth.role() (standard method)
-- Method 2: Check JWT claims (more reliable)
-- Method 3: Check if request is from service role (bypass all RLS)
CREATE POLICY "Service role full access" ON users
  FOR ALL
  USING (
    -- Standard method: Check auth.role()
    auth.role() = 'service_role'
    OR
    -- Alternative method: Check JWT claims
    (current_setting('request.jwt.claims', true)::json->>'role')::text = 'service_role'
    OR
    -- Fallback: Check if role claim exists and is service_role
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR
    (current_setting('request.jwt.claims', true)::json->>'role')::text = 'service_role'
    OR
    (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- Step 3: Users can view their own data (for authenticated users via Supabase Auth)
-- This allows users to see their own row when authenticated through Supabase Auth
CREATE POLICY "Users can view own data" ON users
  FOR SELECT
  USING (
    -- User can view their own row if auth.uid() matches id
    auth.uid()::text = id::text
    OR
    -- Also allow if provider_id matches (for email users)
    provider_id::text = auth.uid()::text
  );

-- Step 4: Verify policies
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'users';
  
  RAISE NOTICE 'Total policies on users table: %', policy_count;
  
  IF policy_count >= 2 THEN
    RAISE NOTICE '✅ RLS policies created successfully';
  ELSE
    RAISE WARNING '⚠️ Expected 2+ policies, found %', policy_count;
  END IF;
END $$;

-- Step 5: Test query (optional - uncomment to test)
-- This should return all users when run with service role key
-- SELECT COUNT(*) FROM users;

