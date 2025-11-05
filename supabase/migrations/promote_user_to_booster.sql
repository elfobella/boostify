-- Promote a user to booster role
-- Replace 'user@example.com' with the actual email address

-- Option 1: Update by email (most common)
UPDATE users
SET role = 'booster',
    updated_at = NOW()
WHERE email = 'user@example.com';

-- Option 2: Update by user ID (if you know the UUID)
-- UPDATE users
-- SET role = 'booster',
--     updated_at = NOW()
-- WHERE id = 'your-user-id-here';

-- Option 3: Update multiple users by email list
-- UPDATE users
-- SET role = 'booster',
--     updated_at = NOW()
-- WHERE email IN ('user1@example.com', 'user2@example.com');

-- Verify the update
SELECT id, email, name, role, updated_at
FROM users
WHERE email = 'user@example.com';

