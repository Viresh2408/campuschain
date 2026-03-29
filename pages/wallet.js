import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../components/Sidebar';
import WalletCard from '../components/WalletCard';
import { ArrowUpRight, ArrowDownLeft, CreditCard, Ticket, TrendingUp, Layers, RefreshCw } from 'lucide-react';

const authFetch = (url, token) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());

const TYPE_COLORS = { fee_payment: '#f59e0b', p2p_transfer: '#6366f1', vendor_payment: '#06b6d4', event_ticket: '#10b981', mint: '#10b981', burn: '#ef4444' };
const TYPE_ICONS = { fee_payment: CreditCard, p2p_transfer: ArrowUpRight, vendor_payment: ArrowDownLeft, event_ticket: Ticket, mint: TrendingUp };

export default function WalletPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const token = localStorage.getItem('cc_token');
    const u = JSON.parse(localStorage.getItem('cc_user') || '{}');
    if (!token) { router.push('/auth'); return; }
    setUser(u);
    const [w, t] = await Promise.all([
      authFetch('/api/wallet/balance', token),
      authFetch('/api/wallet/history', token),
    ]);
    setWallet(w);
    setTxs(t);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const totalIn = txs.filter(t => t.to_user === user?.id).reduce((s, t) => s + t.amount, 0);
  const totalOut = txs.filter(t => t.from_user === user?.id).reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <Head><title>Wallet — CampusChain</title></Head>
      <div className="layout">
        <Sidebar user={user} />
        <main className="main-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>My Wallet</h1>
            <button className="btn btn-secondary" onClick={load}><RefreshCw size={14} /> Refresh</button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>
          ) : (
            <>
              {/* Wallet Card */}
              <div style={{ maxWidth: 420, marginBottom: 28 }}>
                <WalletCard balance={wallet?.balance || 0} user={user} />
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
                <div className="card" style={{ padding: 20 }}>
                  <div className="stat-label" style={{ marginBottom: 8, color: 'var(--success)' }}>Total Received</div>
                  <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--success)' }}>+{totalIn.toFixed(2)} CC</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>≈ ₹{(totalIn * 0.85).toFixed(0)}</div>
                </div>
                <div className="card" style={{ padding: 20 }}>
                  <div className="stat-label" style={{ marginBottom: 8, color: 'var(--danger)' }}>Total Spent</div>
                  <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--danger)' }}>–{totalOut.toFixed(2)} CC</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>≈ ₹{(totalOut * 0.85).toFixed(0)}</div>
                </div>
                <div className="card" style={{ padding: 20 }}>
                  <div className="stat-label" style={{ marginBottom: 8 }}>All Transactions</div>
                  <div className="stat-value" style={{ fontSize: '1.5rem' }}>{txs.length}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Blockchain confirmed</div>
                </div>
              </div>

              {/* Transaction history */}
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={16} color="var(--accent)" /> Transaction Ledger
                </div>
                {txs.length === 0 ? (
                  <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>No transactions yet</div>
                ) : (
                  <table className="table">
                    <thead><tr><th>Type</th><th>Counterparty</th><th>Amount</th><th>TX Hash</th><th>Date</th></tr></thead>
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
                                {isOut ? '–' : '+'}{tx.amount?.toFixed(2)} CC
                              </span>
                            </td>
                            <td>
                              <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--accent-bright)' }}>
                                {tx.tx_id?.slice(0, 16)}…
                              </span>
                            </td>
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
            </>
          )}
        </main>
      </div>
    </>
  );
}
