import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../components/Sidebar';
import { ArrowUpRight, ArrowDownLeft, CreditCard, Ticket, TrendingUp, Download, Filter } from 'lucide-react';

const authFetch = (url, token) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());

const TYPE_ICONS = { fee_payment: CreditCard, p2p_transfer: ArrowUpRight, vendor_payment: ArrowDownLeft, event_ticket: Ticket, mint: TrendingUp };
const TYPE_COLORS = { fee_payment: '#f59e0b', p2p_transfer: '#6366f1', vendor_payment: '#06b6d4', event_ticket: '#10b981', mint: '#10b981' };

export default function Transactions() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [txs, setTxs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    const u = JSON.parse(localStorage.getItem('cc_user') || '{}');
    if (!token) { router.push('/auth'); return; }
    setUser(u);
    authFetch('/api/wallet/history', token).then(d => { setTxs(d); setLoading(false); });
  }, []);

  const filtered = filter === 'all' ? txs : txs.filter(t => t.type === filter);

  function csvDownload() {
    const rows = [['TX ID', 'Type', 'Amount', 'From', 'To', 'Status', 'Date']];
    txs.forEach(t => rows.push([t.tx_id, t.type, t.amount, t.sender?.name || 'System', t.receiver?.name || 'University', t.status, t.created_at]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'transactions.csv'; a.click();
  }

  return (
    <>
      <Head><title>Transactions — CampusChain</title></Head>
      <div className="layout">
        <Sidebar user={user} />
        <main className="main-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>Transaction History</h1>
              <p style={{ color: 'var(--text-muted)' }}>{txs.length} on-chain records</p>
            </div>
            <button className="btn btn-secondary" onClick={csvDownload}><Download size={14} /> Export CSV</button>
          </div>

          {/* Filter pills */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {['all', 'fee_payment', 'p2p_transfer', 'vendor_payment', 'event_ticket', 'mint'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 16px', borderRadius: 20, border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`, background: filter === f ? 'rgba(99,102,241,0.15)' : 'transparent', color: filter === f ? 'var(--accent-bright)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.2s', textTransform: 'capitalize' }}>
                {f === 'all' ? 'All' : f.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>No transactions found</div>
            ) : (
              <table className="table">
                <thead><tr><th>TX Hash</th><th>Type</th><th>From</th><th>To</th><th>Amount</th><th>Fraud</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {filtered.map(tx => {
                    const Icon = TYPE_ICONS[tx.type] || TrendingUp;
                    const color = TYPE_COLORS[tx.type] || '#94a3b8';
                    const isOut = tx.from_user === user?.id;
                    return (
                      <tr key={tx.id}>
                        <td><span className="mono" style={{ fontSize: '0.7rem', color: 'var(--accent-bright)' }}>{tx.tx_id?.slice(0, 18)}...</span></td>
                        <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon size={12} color={color} /><span style={{ fontSize: '0.78rem', textTransform: 'capitalize' }}>{tx.type?.replace(/_/g, ' ')}</span></div></td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{tx.sender?.name || 'System'}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{tx.receiver?.name || 'University'}</td>
                        <td><span style={{ color: isOut ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>{isOut ? '−' : '+'}{tx.amount?.toFixed(2)} CC</span></td>
                        <td>{tx.is_flagged ? <span className="badge badge-red">⚠ Flagged</span> : <span className="badge badge-green">Clear</span>}</td>
                        <td><span className="badge badge-green">{tx.status}</span></td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(tx.created_at).toLocaleDateString()}</td>
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
