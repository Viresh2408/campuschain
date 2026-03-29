-- Run this in Supabase SQL Editor to add the token_requests table
-- https://supabase.com/dashboard/project/jcurfdnukfmnviwcjezh/sql/new

CREATE TABLE IF NOT EXISTS token_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  reason TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE token_requests DISABLE ROW LEVEL SECURITY;

SELECT 'token_requests table created!' AS status;
