-- Fix RLS Policies for Users Table
-- This ensures service role can insert/update/delete users
-- Run this in Supabase SQL Editor if registration fails with RLS errors

-- Step 1: Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON users;

-- Step 2: Recreate service role policy (MUST be first for insert operations)
-- This policy allows service role to do everything (INSERT, UPDATE, DELETE, SELECT)
CREATE POLICY "Service role full access" ON users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Step 3: Users can view their own data (for regular users)
CREATE POLICY "Users can view own data" ON users
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- Step 4: Verify policies are created
DO $$
BEGIN
  RAISE NOTICE 'RLS Policies created successfully';
  RAISE NOTICE 'Service role should now be able to insert users';
END $$;

