-- Check user role in database
-- Replace 'user@example.com' with the actual email address

-- Option 1: Check by email
SELECT 
  id,
  email,
  name,
  role,
  provider,
  provider_id,
  created_at,
  updated_at,
  last_login
FROM users
WHERE email = 'user@example.com';

-- Option 2: Check by user ID
-- SELECT 
--   id,
--   email,
--   name,
--   role,
--   provider,
--   provider_id,
--   created_at,
--   updated_at,
--   last_login
-- FROM users
-- WHERE id = 'your-user-id-here';

-- Option 3: List all users with their roles
-- SELECT 
--   id,
--   email,
--   name,
--   role,
--   provider,
--   created_at,
--   updated_at
-- FROM users
-- ORDER BY updated_at DESC
-- LIMIT 20;

