ALTER TABLE orders
ADD COLUMN IF NOT EXISTS addons JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_orders_addons ON orders USING GIN (addons);
