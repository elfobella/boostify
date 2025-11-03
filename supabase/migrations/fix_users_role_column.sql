-- Fix users table to ensure role column exists
-- This is a safe migration that checks and adds role column if missing

-- Step 1: Check if role column exists, if not add it
DO $$ 
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role'
    ) THEN
        -- Column doesn't exist, add it
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'customer';
        RAISE NOTICE 'Added role column to users table';
    ELSE
        RAISE NOTICE 'Role column already exists in users table';
    END IF;
END $$;

-- Step 2: Ensure all existing users have a role
UPDATE users SET role = 'customer' WHERE role IS NULL;

-- Step 3: Set role as NOT NULL if it isn't already
DO $$ 
BEGIN
    -- Check if role is nullable
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role'
        AND is_nullable = 'YES'
    ) THEN
        -- Make it NOT NULL with default
        ALTER TABLE users ALTER COLUMN role SET DEFAULT 'customer';
        ALTER TABLE users ALTER COLUMN role SET NOT NULL;
        RAISE NOTICE 'Set role column to NOT NULL';
    ELSE
        RAISE NOTICE 'Role column is already NOT NULL';
    END IF;
END $$;

-- Step 4: Add constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'users_role_check' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('customer', 'booster', 'admin'));
        RAISE NOTICE 'Added role check constraint';
    ELSE
        RAISE NOTICE 'Role check constraint already exists';
    END IF;
END $$;

-- Step 5: Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Step 6: Verify the final state
DO $$ 
DECLARE
    role_exists BOOLEAN;
    role_not_null BOOLEAN;
    constraint_exists BOOLEAN;
    index_exists BOOLEAN;
BEGIN
    -- Check column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) INTO role_exists;
    
    -- Check NOT NULL
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role' 
        AND is_nullable = 'NO'
    ) INTO role_not_null;
    
    -- Check constraint
    SELECT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE constraint_name = 'users_role_check' AND table_name = 'users'
    ) INTO constraint_exists;
    
    -- Check index
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' AND indexname = 'idx_users_role'
    ) INTO index_exists;
    
    -- Report results
    RAISE NOTICE '=== USERS ROLE COLUMN STATUS ===';
    RAISE NOTICE 'Column exists: %', role_exists;
    RAISE NOTICE 'Column is NOT NULL: %', role_not_null;
    RAISE NOTICE 'Constraint exists: %', constraint_exists;
    RAISE NOTICE 'Index exists: %', index_exists;
    
    IF role_exists AND role_not_null AND constraint_exists THEN
        RAISE NOTICE '✅ Role column is properly configured';
    ELSE
        RAISE WARNING '⚠️ Role column configuration incomplete';
    END IF;
END $$;

