import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Hexagon, ArrowRight, Shield, Zap, BarChart2, Cpu, Globe, Lock } from 'lucide-react';

const FEATURES = [
  { icon: Shield, title: 'Smart Contracts', desc: 'Every transaction auto-executed by immutable contract logic — no middlemen.', color: '#6366f1' },
  { icon: Zap, title: 'Instant Settlements', desc: 'CampusCoin (CC) transfers settle in milliseconds on the permissioned ledger.', color: '#06b6d4' },
  { icon: Lock, title: 'Fraud Detection', desc: 'Rule-based anomaly engine flags suspicious activity in real-time.', color: '#f59e0b' },
  { icon: BarChart2, title: 'Spending Analytics', desc: 'Visualize spending patterns, daily volume, and top recipients.', color: '#10b981' },
  { icon: Cpu, title: 'Simulated Blockchain', desc: 'SHA-256 tx hashes, Merkle trees, block mining — without gas fees.', color: '#ec4899' },
  { icon: Globe, title: 'Multi-Role Ecosystem', desc: 'Student, Vendor, and Admin roles with isolated permissions and dashboards.', color: '#8b5cf6' },
];

export default function Landing() {
  const [ccPrice, setCcPrice] = useState(null);
  const [stats, setStats] = useState({ txCount: 0, userCount: 0, totalVolume: 0 });

  useEffect(() => {
    // Live CC token price from CoinGecko (using ETH as proxy since CC is simulated)
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr,usd')
      .then(r => r.json())
      .then(d => setCcPrice({ inr: 0.85, usd: 0.01 })) // Fixed CC price for prototype
      .catch(() => setCcPrice({ inr: 0.85, usd: 0.01 }));
  }, []);

  return (
    <>
      <Head>
        <title>CampusChain — Blockchain Campus Financial OS</title>
        <meta name="description" content="A permissioned blockchain-based campus financial ecosystem with CampusCoin tokens, smart contracts, and real-time analytics." />
      </Head>
      <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 60px', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(5,8,16,0.8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#6366f1,#06b6d4)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Hexagon size={20} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}><span className="gradient-text">Campus</span>Chain</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/auth"><button className="btn btn-secondary">Login</button></Link>
            <Link href="/auth?mode=register"><button className="btn btn-primary">Get Started <ArrowRight size={14} /></button></Link>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '100px 40px 80px', maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: 'rgba(99,102,241,0.1)', border: '1px solid var(--border-bright)', marginBottom: 32, fontSize: '0.8rem', color: 'var(--accent-bright)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulse-glow 1.5s ease infinite' }} />
            Powered by Simulated Permissioned Blockchain
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-2px' }}>
            The Future of<br />
            <span className="gradient-text">Campus Finance</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.7 }}>
            CampusChain is a closed-loop financial ecosystem where fees, cafeteria, events, and P2P transfers all run through <strong style={{ color: 'var(--text-primary)' }}>smart contracts</strong> on a tokenized ledger.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth?mode=register"><button className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1rem' }}>Launch App <ArrowRight size={16} /></button></Link>
            <Link href="/auth"><button className="btn btn-secondary" style={{ padding: '14px 32px', fontSize: '1rem' }}>Sign In</button></Link>
          </div>

          {/* CC Token price ticker */}
          <div style={{ marginTop: 48, display: 'inline-flex', gap: 24, padding: '12px 28px', borderRadius: 14, background: 'rgba(99,102,241,0.06)', border: '1px solid var(--border)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>CC / INR</div>
              <div className="gold-text" style={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: 'JetBrains Mono' }}>₹{ccPrice?.inr ?? '...'}</div>
            </div>
            <div style={{ width: 1, background: 'var(--border)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>CC / USD</div>
              <div className="gradient-text" style={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: 'JetBrains Mono' }}>${ccPrice?.usd ?? '...'}</div>
            </div>
            <div style={{ width: 1, background: 'var(--border)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Token</div>
              <div style={{ fontWeight: 700, color: 'var(--cyan)', fontSize: '1.1rem' }}>CC</div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={{ padding: '60px 60px', maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: 48 }}>
            <span className="gradient-text">Production-Grade</span> Features
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card" style={{ padding: 24 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, border: `1px solid ${color}33` }}>
                  <Icon size={20} color={color} />
                </div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Flow diagram */}
        <section style={{ padding: '40px 60px 80px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 36 }}>How It Works</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            {['User Action', 'API Layer', 'Smart Contract', 'Blockchain Ledger', 'Analytics'].map((step, i, arr) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(99,102,241,0.1)', border: '1px solid var(--border-bright)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-bright)' }}>{step}</div>
                {i < arr.length - 1 && <ArrowRight size={14} color="var(--text-muted)" />}
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer style={{ padding: '24px 60px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <div>© 2024 CampusChain — Blockchain Campus Financial OS</div>
          <div>Built with Next.js + Supabase + Simulated Blockchain</div>
        </footer>
      </div>
    </>
  );
}
