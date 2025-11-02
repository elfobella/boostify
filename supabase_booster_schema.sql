    -- Add role column to users table
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';

    -- Add constraint for role
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'booster', 'admin'));

    -- Add booster fields to orders table
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS booster_id UUID REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP WITH TIME ZONE;

    -- Create index for booster_id
    CREATE INDEX IF NOT EXISTS idx_orders_booster_id ON orders(booster_id);

    -- Create index for available orders (status = pending and booster_id is null)
    CREATE INDEX IF NOT EXISTS idx_orders_available ON orders(status, booster_id) WHERE status = 'pending' AND booster_id IS NULL;

    -- Update RLS policies for orders
    -- Drop existing policy if exists
    DROP POLICY IF EXISTS "Users can view own orders" ON orders;
    DROP POLICY IF EXISTS "Service role full access" ON orders;

    -- Users can view their own orders (as customer)
    CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT
    USING (
        auth.uid()::text = user_id::text 
        OR auth.uid()::text = booster_id::text
        OR user_id IS NULL
    );

    -- Boosters can view available orders (pending and not claimed)
    CREATE POLICY "Boosters can view available orders" ON orders
    FOR SELECT
    USING (
        status = 'pending' 
        AND booster_id IS NULL
        AND EXISTS (
        SELECT 1 FROM users 
        WHERE users.id::text = auth.uid()::text 
        AND users.role = 'booster'
        )
    );

    -- Boosters can update orders they claimed
    CREATE POLICY "Boosters can update claimed orders" ON orders
    FOR UPDATE
    USING (
        booster_id::text = auth.uid()::text
        AND EXISTS (
        SELECT 1 FROM users 
        WHERE users.id::text = auth.uid()::text 
        AND users.role = 'booster'
        )
    )
    WITH CHECK (
        booster_id::text = auth.uid()::text
    );

    -- Service role can do everything (for backend operations)
    CREATE POLICY "Service role full access" ON orders
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

