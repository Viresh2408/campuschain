import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../../components/Sidebar';
import { Users, Zap, BarChart2, Shield, Layers, AlertTriangle, RefreshCw, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const authFetch = (url, token) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());

export default function AdminPanel() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [mintTarget, setMintTarget] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [mintReason, setMintReason] = useState('');
  const [minting, setMinting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('users');

  async function load() {
    const token = localStorage.getItem('cc_token');
    const u = JSON.parse(localStorage.getItem('cc_user') || '{}');
    if (!token) { router.push('/auth'); return; }
    if (u.role !== 'admin') { router.push('/dashboard'); return; }
    setUser(u);
    const [us, st] = await Promise.all([
      authFetch('/api/admin/users', token),
      authFetch('/api/admin/stats', token),
    ]);
    setUsers(Array.isArray(us) ? us : []);
    setStats(st || {});
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function mint() {
    if (!mintTarget || !mintAmount) return toast.error('Select user and enter amount');
    const token = localStorage.getItem('cc_token');
    setMinting(true);
    const res = await fetch('/api/admin/mint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: mintTarget, amount: Number(mintAmount), reason: mintReason }),
    }).then(r => r.json());
    setMinting(false);
    if (res.error) return toast.error(res.error);
    toast.success(`Minted ${mintAmount} CC ✓ Block #${res.blockHash?.slice(0, 8)}…`);
    setMintAmount(''); setMintReason('');
    load();
  }

  return (
    <>
      <Head><title>Admin Panel — CampusChain</title></Head>
      <div className="layout">
        <Sidebar user={user} />
        <main className="main-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>Admin Control Panel</h1>
              <p style={{ color: 'var(--text-muted)' }}>Manage users, mint tokens, and monitor the ecosystem</p>
            </div>
            <button className="btn btn-secondary" onClick={load}><RefreshCw size={14} /> Refresh</button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Total Users', value: stats.userCount, icon: Users, color: '#6366f1' },
              { label: 'Transactions', value: stats.txCount, icon: Layers, color: '#06b6d4' },
              { label: 'Blocks Mined', value: stats.blockCount, icon: Zap, color: '#10b981' },
              { label: 'Fraud Alerts', value: stats.alertCount, icon: AlertTriangle, color: '#ef4444' },
              { label: 'Total Volume', value: `${stats.totalVolume?.toFixed(0)} CC`, icon: BarChart2, color: '#f59e0b' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card" style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={13} color={color} />
                  </div>
                  <div className="stat-label" style={{ fontSize: '0.7rem' }}>{label}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.3rem' }}>{loading ? '…' : value ?? 0}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {['users', 'mint'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 20px', borderRadius: 10, border: `1px solid ${tab === t ? 'var(--accent)' : 'var(--border)'}`, background: tab === t ? 'rgba(99,102,241,0.15)' : 'transparent', color: tab === t ? 'var(--accent-bright)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem', textTransform: 'capitalize' }}>
                {t === 'mint' ? '🪙 Mint Tokens' : '👥 User Management'}
              </button>
            ))}
          </div>

          {/* User Management */}
          {tab === 'users' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              {loading ? (
                <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
              ) : (
                <table className="table">
                  <thead><tr><th>Name</th><th>Email</th><th>ID</th><th>Role</th><th>Balance</th><th>Status</th><th>Joined</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700 }}>
                              {u.name?.charAt(0)}
                            </div>
                            <span style={{ fontWeight: 500 }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td><span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.student_id}</span></td>
                        <td><span className={`badge badge-${u.role === 'admin' ? 'yellow' : u.role === 'vendor' ? 'cyan' : 'blue'}`}>{u.role}</span></td>
                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>{u.balance?.toFixed(2)} CC</td>
                        <td>{u.is_flagged ? <span className="badge badge-red">⚠ Flagged</span> : <span className="badge badge-green">Clear</span>}</td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Mint tokens */}
          {tab === 'mint' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={16} color="var(--gold)" /> Mint CampusCoin
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Target User</label>
                  <select className="input" value={mintTarget} onChange={e => setMintTarget(e.target.value)}>
                    <option value="">Select user…</option>
                    {users.filter(u => u.role !== 'admin').map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.student_id}) — {u.balance?.toFixed(0)} CC</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Amount (CC)</label>
                  <input className="input" type="number" min="1" placeholder="e.g. 500" value={mintAmount} onChange={e => setMintAmount(e.target.value)} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label className="label">Reason</label>
                  <input className="input" placeholder="e.g. Scholarship, Top-up request..." value={mintReason} onChange={e => setMintReason(e.target.value)} />
                </div>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={mint} disabled={minting || !mintTarget || !mintAmount}>
                  {minting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Mining block…</> : <><Plus size={14} /> Mint Tokens</>}
                </button>
              </div>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ fontWeight: 700, marginBottom: 16 }}>How Minting Works</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {['Admin initiates mint request', 'MintContract validates admin role', 'New CC tokens created in ledger', 'Target wallet balance updated', 'Block mined with tx hash', 'Audit log entry recorded'].map((step, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
