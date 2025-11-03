-- RLS Policy Fix for Service Role
-- If service role is not working, run these commands in Supabase SQL Editor

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;

-- Recreate with proper syntax
CREATE POLICY "Service role full access" ON users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Users can view their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- Optional: Temporarily disable RLS for testing (NOT recommended for production)
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

