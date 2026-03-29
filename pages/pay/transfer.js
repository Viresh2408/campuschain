import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../../components/Sidebar';
import SmartContractModal from '../../components/SmartContractModal';
import { Search, ArrowRight, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function P2PTransfer() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    const u = JSON.parse(localStorage.getItem('cc_user') || '{}');
    if (!token) { router.push('/auth'); return; }
    setUser(u);
    fetch('/api/wallet/balance', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(w => setBalance(w.balance || 0));
  }, []);

  useEffect(() => {
    if (!search.trim()) { setStudents([]); return; }
    setSearching(true);
    const token = localStorage.getItem('cc_token');
    const timer = setTimeout(() => {
      fetch(`/api/wallet/users?q=${encodeURIComponent(search)}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => { setStudents(d); setSearching(false); });
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function transfer() {
    if (!selected) return toast.error('Select a recipient');
    if (!amount || Number(amount) <= 0) return toast.error('Enter a valid amount');
    if (Number(amount) > balance) return toast.error('Insufficient balance');
    const token = localStorage.getItem('cc_token');
    setModal(true); setLoading(true); setResult(null); setError('');
    const res = await fetch('/api/transactions/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ toId: selected.id, amount: Number(amount), memo }),
    }).then(r => r.json());
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setResult(res);
    setBalance(res.fromBalance);
    toast.success(`Sent ${amount} CC to ${selected.name}`);
  }

  return (
    <>
      <Head><title>P2P Transfer — CampusChain</title></Head>
      <div className="layout">
        <Sidebar user={user} />
        <main className="main-content">
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 8 }}>P2P Transfer</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>Send CampusCoin to another student instantly</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 800 }}>
            {/* Left: Search */}
            <div>
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontWeight: 600, marginBottom: 16 }}>Find Recipient</div>
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="input" style={{ paddingLeft: 36 }} placeholder="Search by name or student ID..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {searching && <div style={{ textAlign: 'center', padding: 16 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>}
                <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {students.map(s => (
                    <div key={s.id} onClick={() => { setSelected(s); setSearch(s.name); setStudents([]); }}
                      style={{ padding: '10px 14px', borderRadius: 10, cursor: 'pointer', background: selected?.id === s.id ? 'rgba(99,102,241,0.1)' : 'var(--bg-secondary)', border: `1px solid ${selected?.id === s.id ? 'var(--accent)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 }}>{s.name.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{s.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.student_id}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {selected && (
                  <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600 }}>✓ Selected: {selected.name}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Amount */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 16 }}>Transfer Details</div>
              <div style={{ marginBottom: 16 }}>
                <label className="label">Amount (CC)</label>
                <input className="input" type="number" min="1" max={balance} placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>Available: {balance.toFixed(2)} CC</div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="label">Memo (optional)</label>
                <input className="input" placeholder="e.g. Book money, lunch..." value={memo} onChange={e => setMemo(e.target.value)} />
              </div>
              <div className="divider" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>To</span>
                  <span>{selected?.name || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Contract</span>
                  <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--accent-bright)' }}>P2PTransferContract</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Balance after</span>
                  <span style={{ fontWeight: 700, color: 'var(--success)' }}>{amount ? (balance - Number(amount)).toFixed(2) : balance.toFixed(2)} CC</span>
                </div>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={transfer} disabled={!selected || !amount}>
                <ArrowRight size={14} /> Send {amount || '0'} CC
              </button>
            </div>
          </div>
        </main>
      </div>
      <SmartContractModal open={modal} onClose={() => setModal(false)} title="P2PTransferContract" loading={loading} result={result} error={error} txType="P2P Transfer" amount={amount} recipientName={selected?.name} />
    </>
  );
}
