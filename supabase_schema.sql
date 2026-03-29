-- =========================================
-- CampusChain Supabase SQL Schema
-- Run this in: https://supabase.com/dashboard/project/jcurfdnukfmnviwcjezh/sql
-- =========================================

-- 1. Users / Wallets
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('student', 'admin', 'vendor')) NOT NULL DEFAULT 'student',
  student_id TEXT UNIQUE,
  balance NUMERIC(12, 2) DEFAULT 0,
  avatar_url TEXT,
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Blockchain Ledger
CREATE TABLE IF NOT EXISTS ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tx_id TEXT UNIQUE NOT NULL,
  block_hash TEXT NOT NULL,
  from_user UUID REFERENCES users(id) ON DELETE SET NULL,
  to_user UUID REFERENCES users(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  type TEXT CHECK (type IN ('fee_payment','p2p_transfer','vendor_payment','event_ticket','mint','burn')) NOT NULL,
  status TEXT CHECK (status IN ('pending','confirmed','failed')) DEFAULT 'confirmed',
  metadata JSONB DEFAULT '{}',
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Blocks
CREATE TABLE IF NOT EXISTS blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  block_number INTEGER UNIQUE NOT NULL,
  block_hash TEXT UNIQUE NOT NULL,
  prev_hash TEXT NOT NULL,
  merkle_root TEXT NOT NULL,
  tx_count INTEGER DEFAULT 0,
  nonce INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Events
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  venue TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  ticket_price NUMERIC(12, 2) NOT NULL,
  total_tickets INTEGER NOT NULL,
  sold_tickets INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Event Tickets (NFT-like tokens)
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_token TEXT UNIQUE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  tx_id TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Fraud Alerts
CREATE TABLE IF NOT EXISTS fraud_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tx_id TEXT,
  reason TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low','medium','high')) DEFAULT 'medium',
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- SEED DATA (Demo accounts)
-- Password for all: admin123
-- Hash: $2b$10$YKpYQ2pqbLoF6wGFQmZHXuUJLBxX9b4.iP8a4.XxMqbLt3kxJkFCe
-- =========================================

INSERT INTO users (name, email, password_hash, role, balance, student_id)
VALUES 
  ('Admin', 'admin@campus.edu', '$2b$10$YKpYQ2pqbLoF6wGFQmZHXuUJLBxX9b4.iP8a4.XxMqbLt3kxJkFCe', 'admin', 99999, 'ADM001'),
  ('Campus Cafeteria', 'cafeteria@campus.edu', '$2b$10$YKpYQ2pqbLoF6wGFQmZHXuUJLBxX9b4.iP8a4.XxMqbLt3kxJkFCe', 'vendor', 0, 'VND001'),
  ('Campus Store', 'store@campus.edu', '$2b$10$YKpYQ2pqbLoF6wGFQmZHXuUJLBxX9b4.iP8a4.XxMqbLt3kxJkFCe', 'vendor', 0, 'VND002'),
  ('Rahul Sharma', 'rahul@campus.edu', '$2b$10$YKpYQ2pqbLoF6wGFQmZHXuUJLBxX9b4.iP8a4.XxMqbLt3kxJkFCe', 'student', 500, 'STU001'),
  ('Priya Singh', 'priya@campus.edu', '$2b$10$YKpYQ2pqbLoF6wGFQmZHXuUJLBxX9b4.iP8a4.XxMqbLt3kxJkFCe', 'student', 1200, 'STU002')
ON CONFLICT (email) DO NOTHING;

-- Genesis Block
INSERT INTO blocks (block_number, block_hash, prev_hash, merkle_root, nonce)
VALUES (0, '0000000000000000000000000000000000000000000000000000000000000000', 'GENESIS', 'GENESIS_MERKLE_ROOT', 0)
ON CONFLICT (block_number) DO NOTHING;

-- Sample events
INSERT INTO events (title, description, venue, event_date, ticket_price, total_tickets, created_by)
SELECT 
  'Tech Fest 2024', 
  'Annual technology festival with hackathons, workshops, and keynote speakers.', 
  'Main Auditorium',
  NOW() + INTERVAL '7 days',
  50,
  200,
  id
FROM users WHERE role = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO events (title, description, venue, event_date, ticket_price, total_tickets, created_by)
SELECT 
  'Cultural Night', 
  'A spectacular evening of music, dance, and performances by students.', 
  'Open Air Theatre',
  NOW() + INTERVAL '14 days',
  25,
  500,
  id
FROM users WHERE role = 'admin' LIMIT 1
ON CONFLICT DO NOTHING;

-- =========================================
-- DISABLE Row Level Security for prototype
-- (Enable & configure for production)
-- =========================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE ledger DISABLE ROW LEVEL SECURITY;
ALTER TABLE blocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts DISABLE ROW LEVEL SECURITY;
