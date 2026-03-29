import Head from 'next/head';
import { useState } from 'react';
import { CheckCircle, Copy, ExternalLink, Zap, AlertCircle } from 'lucide-react';

const SQL = `-- CampusChain: Run ALL of this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/jcurfdnukfmnviwcjezh/sql/new

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('student','admin','vendor')) NOT NULL DEFAULT 'student',
  student_id TEXT UNIQUE,
  balance NUMERIC(12,2) DEFAULT 0,
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tx_id TEXT UNIQUE NOT NULL,
  block_hash TEXT NOT NULL,
  from_user UUID REFERENCES users(id) ON DELETE SET NULL,
  to_user UUID REFERENCES users(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  type TEXT CHECK (type IN ('fee_payment','p2p_transfer','vendor_payment','event_ticket','mint','burn')) NOT NULL,
  status TEXT CHECK (status IN ('pending','confirmed','failed')) DEFAULT 'confirmed',
  metadata JSONB DEFAULT '{}',
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  venue TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  ticket_price NUMERIC(12,2) NOT NULL,
  total_tickets INTEGER NOT NULL,
  sold_tickets INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_token TEXT UNIQUE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  tx_id TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fraud_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tx_id TEXT,
  reason TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low','medium','high')) DEFAULT 'medium',
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE blocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE ledger DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts DISABLE ROW LEVEL SECURITY;

SELECT 'All tables created successfully!' AS status;`;

export default function SetupPage() {
  const [copied, setCopied] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);
  const [step, setStep] = useState(1);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);

  function copySQL() {
    navigator.clipboard.writeText(SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  async function checkTables() {
    setChecking(true);
    setCheckResult(null);
    const res = await fetch('/api/admin/check-tables').then(r => r.json());
    setCheckResult(res);
    setChecking(false);
    if (res.ok) setStep(2);
  }

  async function runSeed() {
    setSeeding(true);
    const res = await fetch('/api/admin/setup').then(r => r.json());
    setSeedResult(res);
    setSeeding(false);
    if (res.results?.some(r => r.startsWith('✅ user seeded'))) setStep(3);
  }

  return (
    <>
      <Head><title>Setup — CampusChain</title></Head>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 780 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚙️</div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
              <span className="gradient-text">CampusChain</span> Setup
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Initialize your Supabase database in 2 steps</p>
          </div>

          {/* STEP 1 */}
          <div className="card" style={{ padding: 24, marginBottom: 16, border: step === 1 ? '1px solid var(--accent)' : step > 1 ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: step > 1 ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, color: step > 1 ? 'var(--success)' : 'var(--accent)' }}>
                {step > 1 ? '✓' : '1'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>Create Supabase Tables</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Copy the SQL below → paste into Supabase SQL Editor → click Run</div>
              </div>
              <a href="https://supabase.com/dashboard/project/jcurfdnukfmnviwcjezh/sql/new" target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: '0.78rem', flexShrink: 0 }}>
                <ExternalLink size={12} /> Open SQL Editor ↗
              </a>
            </div>

            {/* Inline SQL — copy this! */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <textarea
                readOnly
                value={SQL}
                style={{ width: '100%', height: 220, background: '#050810', border: '1px solid var(--border-bright)', borderRadius: 10, padding: '14px 16px', fontSize: '0.72rem', color: '#6ee7b7', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.7, resize: 'none', outline: 'none' }}
                onClick={e => e.target.select()}
              />
              <button
                className={`btn ${copied ? 'btn-success' : 'btn-primary'}`}
                style={{ position: 'absolute', top: 10, right: 10, padding: '6px 14px', fontSize: '0.78rem' }}
                onClick={copySQL}
              >
                {copied ? <><CheckCircle size={12} /> Copied!</> : <><Copy size={12} /> Copy All SQL</>}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={checkTables} disabled={checking} style={{ fontSize: '0.82rem' }}>
                {checking ? <><div className="spinner" style={{ width: 12, height: 12 }} /> Checking…</> : '✅ I ran the SQL — Verify Tables'}
              </button>
              {checkResult && (
                <div style={{ fontSize: '0.8rem', color: checkResult.ok ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {checkResult.ok ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                  {checkResult.message}
                </div>
              )}
            </div>
          </div>

          {/* STEP 2 */}
          <div className="card" style={{ padding: 24, marginBottom: 16, opacity: step < 2 ? 0.45 : 1, border: step === 2 ? '1px solid var(--accent)' : step > 2 ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--border)', pointerEvents: step < 2 ? 'none' : 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: step > 2 ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, color: step > 2 ? 'var(--success)' : 'var(--accent)' }}>
                {step > 2 ? '✓' : '2'}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>Seed Demo Accounts</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Creates admin, 2 vendors, and 2 student accounts with 500–1200 CC</div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={runSeed} disabled={seeding} style={{ marginBottom: seedResult ? 16 : 0 }}>
              {seeding ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Seeding…</> : <><Zap size={14} /> Seed Database</>}
            </button>
            {seedResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {seedResult.results?.map((r, i) => (
                  <div key={i} style={{ fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace', color: r.startsWith('✅') ? 'var(--success)' : r.startsWith('⚠️') ? 'var(--warning)' : 'var(--danger)' }}>{r}</div>
                ))}
              </div>
            )}
          </div>

          {/* DONE */}
          {step === 3 && (
            <div className="card" style={{ padding: 28, border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.05)', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🎉</div>
              <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1.1rem', marginBottom: 10 }}>Setup Complete!</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                Login with: <code style={{ color: 'var(--accent-bright)', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: 4 }}>admin@campus.edu / admin123</code>
              </div>
              <a href="/auth" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', justifyContent: 'center', padding: '12px 28px' }}>
                Launch CampusChain →
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
