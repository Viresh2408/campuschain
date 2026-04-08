import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../components/Sidebar';
import WalletCard from '../components/WalletCard';
import { useRealtimeBalance } from '../hooks/useRealtimeBalance';
import { ArrowUpRight, ArrowDownLeft, CreditCard, TrendingUp, Shield, Layers, Ticket, Bell, Activity } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const authFetch = (url, token) =>
  fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());

const TYPE_ICONS = { fee_payment: CreditCard, p2p_transfer: ArrowUpRight, vendor_payment: ArrowDownLeft, event_ticket: Ticket, mint: TrendingUp };
const TYPE_COLORS = { fee_payment: '#f59e0b', p2p_transfer: '#6366f1', vendor_payment: '#06b6d4', event_ticket: '#10b981', mint: '#10b981' };

const QUICK_ACTIONS = [
  { href: '/pay/fees', icon: CreditCard, label: 'Pay Fees', color: '#f59e0b', desc: 'Tuition, Lab, Library' },
  { href: '/pay/transfer', icon: ArrowUpRight, label: 'P2P Transfer', color: '#6366f1', desc: 'Send to students' },
  { href: '/pay/vendor', icon: ArrowDownLeft, label: 'Vendor Pay', color: '#06b6d4', desc: 'QR payments' },
  { href: '/events', icon: Ticket, label: 'Events', color: '#10b981', desc: 'Buy tickets' },
];

const VENDOR_QUICK_ACTIONS = [
  { href: '/vendor-items', icon: Layers, label: 'Manage Items', color: '#06b6d4', desc: 'Add/view your listed items' },
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveBalance, setLiveBalance] = useState(null); // null = not yet updated by realtime

  // Real-time balance subscription
  useRealtimeBalance(
    user?.id,
    (newBal) => {
      const diff = newBal - balance;
      setLiveBalance(newBal);
      if (diff > 0) {
        toast.success(`+${diff.toFixed(2)} CC received! 💰`, { duration: 4000, icon: '🔔' });
      }
    },
    (tx) => {
      toast(`📥 Incoming transfer: ${tx.amount?.toFixed(2)} CC`, {
        style: { border: '1px solid rgba(16,185,129,0.4)' }, duration: 5000,
      });
    }
  );

  const displayBalance = liveBalance !== null ? liveBalance : balance;

  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    const savedUser = localStorage.getItem('cc_user');
    if (!token) { router.push('/auth'); return; }
    const u = JSON.parse(savedUser);
    setUser(u);
    Promise.all([
      authFetch('/api/wallet/balance', token),
      authFetch('/api/wallet/history', token),
    ]).then(([w, t]) => {
      setBalance(w.balance || 0);
      setTxs(t.slice(0, 8));
      setLoading(false);
    });
  }, []);

  const totalIn = txs.filter(t => t.to_user === user?.id).reduce((s, t) => s + t.amount, 0);
  const totalOut = txs.filter(t => t.from_user === user?.id).reduce((s, t) => s + t.amount, 0);

  if (loading) return (
    <div className="layout">
      <Sidebar user={user} />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </main>
    </div>
  );

  return (
    <>
      <Head><title>Dashboard — CampusChain</title></Head>
      <div className="layout">
        <Sidebar user={user} />
        <main className="main-content">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Welcome back,</div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                {user?.name} <span className="gradient-text">👋</span>
              </h1>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className={`badge badge-${user?.role === 'admin' ? 'yellow' : user?.role === 'vendor' ? 'cyan' : 'blue'}`}>{user?.role}</span>
              <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)', animation: 'pulse-glow 1.5s ease infinite' }} /> Live
              </span>
            </div>
          </div>

          {/* Top row: Wallet + Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <WalletCard balance={displayBalance} user={user} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="card" style={{ padding: '16px 20px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUp size={15} color="var(--success)" /></div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--success)' }}>+{totalIn.toFixed(2)} CC</div>
                    <div className="stat-label">Total Received</div>
                  </div>
                </div>
              </div>
              <div className="card" style={{ padding: '16px 20px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowUpRight size={15} color="var(--danger)" /></div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--danger)' }}>–{totalOut.toFixed(2)} CC</div>
                    <div className="stat-label">Total Spent</div>
                  </div>
                </div>
              </div>
              <div className="card" style={{ padding: '16px 20px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={15} color="var(--accent)" /></div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{txs.length}</div>
                    <div className="stat-label">Recent Transactions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {user?.role !== 'admin' && (
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 14 }}>Quick Actions</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {(user?.role === 'vendor' ? VENDOR_QUICK_ACTIONS : QUICK_ACTIONS).map(({ href, icon: Icon, label, color, desc }) => (
                  <Link key={href} href={href}>
                    <div
                      style={{ padding: '16px 12px', borderRadius: 12, background: `${color}0d`, border: `1px solid ${color}22`, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${color}1f`; e.currentTarget.style.borderColor = `${color}55`; }}
                      onMouseLeave={e => { e.currentTarget.style.background = `${color}0d`; e.currentTarget.style.borderColor = `${color}22`; }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 11, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', border: `1px solid ${color}33` }}>
                        <Icon size={20} color={color} />
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Token Request (student only) */}
          {user?.role === 'student' && (
            <div className="card" style={{ padding: 16, marginBottom: 20, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Bell size={16} color="var(--accent)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Need more CampusCoin?</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Submit a top-up request to the admin</div>
                </div>
              </div>
              <Link href="/request-tokens"><button className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '7px 16px' }}>Request Tokens</button></Link>
            </div>
          )}

          {/* Recent Transactions */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}><Layers size={15} color="var(--accent)" /> Recent Transactions</div>
              <Link href="/transactions"><span style={{ fontSize: '0.8rem', color: 'var(--accent-bright)', cursor: 'pointer' }}>View all →</span></Link>
            </div>
            {txs.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>No transactions yet. Ask admin for CampusCoin to get started!</div>
            ) : (
              <table className="table">
                <thead><tr><th>Type</th><th>Counterparty</th><th>Amount</th><th>Balance Impact</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {txs.map(tx => {
                    const isOut = tx.from_user === user?.id;
                    const Icon = TYPE_ICONS[tx.type] || Layers;
                    const color = TYPE_COLORS[tx.type] || '#94a3b8';
                    return (
                      <tr key={tx.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon size={12} color={color} />
                            </div>
                            <span style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>{tx.type?.replace(/_/g, ' ')}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {isOut ? (tx.receiver?.name || 'University') : (tx.sender?.name || 'System')}
                        </td>
                        <td>
                          <span style={{ color: isOut ? 'var(--danger)' : 'var(--success)', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
                            {isOut ? '−' : '+'}{tx.amount?.toFixed(2)} CC
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {isOut
                              ? <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>▼ deducted</span>
                              : <span style={{ color: 'var(--success)', fontSize: '0.75rem' }}>▲ credited</span>
                            }
                          </div>
                        </td>
                        <td><span className="badge badge-green">{tx.status}</span></td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(tx.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
