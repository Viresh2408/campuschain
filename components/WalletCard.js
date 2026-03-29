import { TrendingUp, TrendingDown, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export default function WalletCard({ balance = 0, user, ccPrice = 0.85 }) {
  const [hidden, setHidden] = useState(false);
  const inrValue = (balance * ccPrice).toFixed(2);

  return (
    <div style={{ background: 'linear-gradient(135deg, #1a1040 0%, #0d1326 50%, #0a1628 100%)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: 28, position: 'relative', overflow: 'hidden' }}
      className="animate-pulse-glow">
      {/* Background decoration */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', bottom: -20, left: -20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)' }} />

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, position: 'relative' }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>CampusCoin Wallet</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user?.name}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{user?.student_id}</div>
        </div>
        <button onClick={() => setHidden(h => !h)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6 }}>
          {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Balance */}
      <div style={{ marginBottom: 20, position: 'relative' }}>
        <div style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>
          {hidden ? '••••••' : <><span className="gradient-text">{balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span><span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginLeft: 8 }}>CC</span></>}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
          ≈ ₹{hidden ? '••••' : inrValue} <span style={{ fontSize: '0.7rem' }}>(@ ₹{ccPrice}/CC)</span>
        </div>
      </div>

      {/* Role badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <span className={`badge badge-${user?.role === 'admin' ? 'yellow' : user?.role === 'vendor' ? 'cyan' : 'blue'}`}>
          {user?.role}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success)', fontSize: '0.75rem' }}>
          <TrendingUp size={12} /> Blockchain Verified
        </div>
      </div>
    </div>
  );
}
