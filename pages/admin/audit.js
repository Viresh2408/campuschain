import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../../components/Sidebar';
import { Shield, Layers, AlertTriangle, Hash, RefreshCw, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const authFetch = (url, token) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
const TYPE_COLORS = { fee_payment: '#f59e0b', p2p_transfer: '#6366f1', vendor_payment: '#06b6d4', event_ticket: '#10b981', mint: '#10b981', burn: '#ef4444' };

export default function AuditLog() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [tab, setTab] = useState('ledger');
  const [loading, setLoading] = useState(true);

  async function load() {
    const token = localStorage.getItem('cc_token');
    const u = JSON.parse(localStorage.getItem('cc_user') || '{}');
    if (!token) { router.push('/auth'); return; }
    if (u.role !== 'admin') { router.push('/dashboard'); return; }
    setUser(u);
    const [l, a, b] = await Promise.all([
      authFetch('/api/admin/audit', token),
      authFetch('/api/admin/fraud-alerts', token),
      authFetch('/api/admin/blocks', token),
    ]);
    setLedger(Array.isArray(l) ? l : []);
    setAlerts(Array.isArray(a) ? a : []);
    setBlocks(Array.isArray(b) ? b : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function resolveAlert(alertId) {
    // Mark as resolved in UI optimistically
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, resolved: true } : a));
    toast.success('Alert marked as resolved');
  }

  return (
    <>
      <Head><title>Audit Log — CampusChain</title></Head>
      <div className="layout">
        <Sidebar user={user} />
        <main className="main-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>Audit & Fraud Monitor</h1>
              <p style={{ color: 'var(--text-muted)' }}>Full blockchain ledger, fraud alerts, and block explorer</p>
            </div>
            <button className="btn btn-secondary" onClick={load}><RefreshCw size={14} /> Refresh</button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {[
              { key: 'ledger', label: `📋 Full Ledger (${ledger.length})` },
              { key: 'alerts', label: `⚠️ Fraud Alerts (${alerts.filter(a => !a.resolved).length})` },
              { key: 'blocks', label: `⛓️ Block Explorer (${blocks.length})` },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)} style={{ padding: '8px 18px', borderRadius: 10, border: `1px solid ${tab === key ? 'var(--accent)' : 'var(--border)'}`, background: tab === key ? 'rgba(99,102,241,0.15)' : 'transparent', color: tab === key ? 'var(--accent-bright)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 500, fontSize: '0.82rem' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Full Ledger */}
          {tab === 'ledger' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              {loading ? <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div> : (
                <table className="table">
                  <thead><tr><th>TX Hash</th><th>Block Hash</th><th>Type</th><th>From</th><th>To</th><th>Amount</th><th>Fraud</th><th>Timestamp</th></tr></thead>
                  <tbody>
                    {ledger.map(tx => (
                      <tr key={tx.id}>
                        <td><span className="mono" style={{ fontSize: '0.68rem', color: 'var(--accent-bright)' }}>{tx.tx_id?.slice(0, 14)}…</span></td>
                        <td><span className="mono" style={{ fontSize: '0.68rem', color: 'var(--cyan)' }}>{tx.block_hash?.slice(0, 10)}…</span></td>
                        <td><span style={{ fontSize: '0.78rem', textTransform: 'capitalize', color: TYPE_COLORS[tx.type] || '#94a3b8' }}>{tx.type?.replace(/_/g, ' ')}</span></td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{tx.sender?.name || 'System'}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{tx.receiver?.name || 'University'}</td>
                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>{tx.amount?.toFixed(2)} CC</td>
                        <td>{tx.is_flagged ? <span className="badge badge-red">⚠ {tx.flag_reason?.slice(0, 20)}…</span> : <span className="badge badge-green">Clear</span>}</td>
                        <td style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(tx.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Fraud Alerts */}
          {tab === 'alerts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {alerts.length === 0 && <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>No fraud alerts 🎉</div>}
              {alerts.map(alert => (
                <div key={alert.id} className="card" style={{ padding: 20, border: `1px solid ${alert.resolved ? 'var(--border)' : alert.severity === 'high' ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)'}`, opacity: alert.resolved ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: alert.severity === 'high' ? 'rgba(239,68,68,0.1)' : alert.severity === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertTriangle size={16} color={alert.severity === 'high' ? '#ef4444' : alert.severity === 'medium' ? '#f59e0b' : '#6366f1'} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                          <span className={`badge badge-${alert.severity === 'high' ? 'red' : alert.severity === 'medium' ? 'yellow' : 'blue'}`}>{alert.severity} severity</span>
                          {alert.resolved && <span className="badge badge-green">Resolved</span>}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{alert.user?.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({alert.user?.email})</span></div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{alert.reason}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{new Date(alert.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    {!alert.resolved && (
                      <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.78rem' }} onClick={() => resolveAlert(alert.id)}>
                        <CheckCircle size={12} /> Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Block Explorer */}
          {tab === 'blocks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {blocks.map((block, i) => (
                <div key={block.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.1)', border: '1px solid var(--border-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Layers size={18} color="var(--accent)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>Block #{block.block_number}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(block.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <div>
                        <div className="label">Transactions</div>
                        <div style={{ fontWeight: 700, color: 'var(--cyan)' }}>{block.tx_count}</div>
                      </div>
                      <div>
                        <div className="label">Nonce</div>
                        <div style={{ fontWeight: 700 }}>{block.nonce}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div>
                      <div className="label">Block Hash</div>
                      <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--accent-bright)', wordBreak: 'break-all' }}>{block.block_hash}</div>
                    </div>
                    <div>
                      <div className="label">Previous Hash</div>
                      <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{block.prev_hash}</div>
                    </div>
                    <div>
                      <div className="label">Merkle Root</div>
                      <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--cyan)', wordBreak: 'break-all' }}>{block.merkle_root}</div>
                    </div>
                  </div>
                </div>
              ))}
              {blocks.length === 0 && <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>No blocks yet</div>}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
