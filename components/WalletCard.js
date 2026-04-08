import { TrendingUp, TrendingDown, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export default function WalletCard({ balance = 0, user, ccPrice = 0.85 }) {
  const [hidden, setHidden] = useState(false);
  const inrValue = (balance * ccPrice).toFixed(2);

  return (
    <div style={{ background: 'rgba(38, 38, 38, 0.4)', backdropFilter: 'blur(24px)', border: '1px solid var(--border-bright)', borderRadius: 24, padding: 32, position: 'relative', overflow: 'hidden' }}
      className="animate-pulse-glow hover:scale-[1.02] transition-transform">
      {/* Background decoration */}
      <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(199, 153, 255, 0.2) 0%, transparent 70%)', filter: 'blur(30px)' }} />
      <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74, 248, 227, 0.15) 0%, transparent 70%)', filter: 'blur(30px)' }} />

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, position: 'relative' }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4, fontFamily: 'Inter' }}>Kinetic Token Core</div>
          <div style={{ fontSize: '0.9rem', color: '#ffffff', fontFamily: 'Space Grotesk' }}>{user?.name}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'Space Grotesk' }}>{user?.student_id}</div>
        </div>
        <button onClick={() => setHidden(h => !h)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', color: 'var(--text-muted)', padding: 8, backdropFilter: 'blur(10px)' }}>
          {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Balance */}
      <div style={{ marginBottom: 24, position: 'relative' }}>
        <div style={{ fontSize: '3.5rem', fontWeight: 700, letterSpacing: '-2px', lineHeight: 1, fontFamily: 'Space Grotesk' }}>
          {hidden ? '••••••' : <><span className="gradient-text">{balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span><span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginLeft: 8, fontWeight: 500 }}>CC</span></>}
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 8, fontFamily: 'Inter' }}>
          ≈ ₹{hidden ? '••••' : inrValue} <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>(@ ₹{ccPrice}/CC)</span>
        </div>
      </div>

      {/* Role badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <span className={`badge badge-${user?.role === 'admin' ? 'yellow' : user?.role === 'vendor' ? 'cyan' : 'blue'}`} style={{ fontFamily: 'Space Grotesk' }}>
          {user?.role}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success)', fontSize: '0.75rem', fontFamily: 'Inter', fontWeight: 500, background: 'rgba(74,248,227,0.1)', padding: '4px 10px', borderRadius: 12 }}>
          <TrendingUp size={12} /> Live Network
        </div>
      </div>
    </div>
  );
}
