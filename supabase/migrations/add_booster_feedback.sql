-- Booster Feedback System
-- Run this migration in Supabase SQL Editor

-- ============================================
-- 1. BOOSTER FEEDBACK TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS booster_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  booster_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating SMALLINT,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT booster_feedback_rating_check CHECK (
    rating IS NULL OR rating BETWEEN 1 AND 5
  )
);

-- Each order can only have one feedback entry
CREATE UNIQUE INDEX IF NOT EXISTS idx_booster_feedback_order_id
  ON booster_feedback(order_id);

CREATE INDEX IF NOT EXISTS idx_booster_feedback_booster_id
  ON booster_feedback(booster_id);

CREATE INDEX IF NOT EXISTS idx_booster_feedback_customer_id
  ON booster_feedback(customer_id);

-- ============================================
-- 2. TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_booster_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_booster_feedback_updated_at
  ON booster_feedback;

CREATE TRIGGER update_booster_feedback_updated_at
  BEFORE UPDATE ON booster_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_booster_feedback_updated_at();

-- ============================================
-- 3. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE booster_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own feedback" ON booster_feedback;
CREATE POLICY "Customers can view own feedback"
  ON booster_feedback FOR SELECT
  USING (customer_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Boosters can view feedback on their orders" ON booster_feedback;
CREATE POLICY "Boosters can view feedback on their orders"
  ON booster_feedback FOR SELECT
  USING (booster_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Customers can insert feedback" ON booster_feedback;
CREATE POLICY "Customers can insert feedback"
  ON booster_feedback FOR INSERT
  WITH CHECK (customer_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Customers can update own feedback" ON booster_feedback;
CREATE POLICY "Customers can update own feedback"
  ON booster_feedback FOR UPDATE
  USING (customer_id::text = auth.uid()::text)
  WITH CHECK (customer_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Service role full access to feedback" ON booster_feedback;
CREATE POLICY "Service role full access to feedback"
  ON booster_feedback FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- 4. VERIFICATION QUERIES
-- ============================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'booster_feedback';

SELECT indexname, tablename
FROM pg_indexes
WHERE tablename = 'booster_feedback'
ORDER BY indexname;


