-- Run this in Supabase SQL Editor to create the vendor items catalog

CREATE TABLE IF NOT EXISTS vendor_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vendor_items DISABLE ROW LEVEL SECURITY;

SELECT 'vendor_items table created perfectly!' AS status;
