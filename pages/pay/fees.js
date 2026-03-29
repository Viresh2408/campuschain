import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../../components/Sidebar';
import SmartContractModal from '../../components/SmartContractModal';
import { CreditCard, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const FEE_TYPES = [
  { id: 'tuition', label: 'Tuition Fee', amount: 2000, icon: '🎓' },
  { id: 'library', label: 'Library Fee', amount: 150, icon: '📚' },
  { id: 'lab', label: 'Laboratory Fee', amount: 500, icon: '🔬' },
  { id: 'hostel', label: 'Hostel Fee', amount: 1500, icon: '🏠' },
  { id: 'sports', label: 'Sports Fee', amount: 250, icon: '⚽' },
  { id: 'exam', label: 'Exam Fee', amount: 300, icon: '📝' },
];

export default function PayFees() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    const u = JSON.parse(localStorage.getItem('cc_user') || '{}');
    if (!token) { router.push('/auth'); return; }
    setUser(u);
    fetch('/api/wallet/balance', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(w => setBalance(w.balance || 0));
  }, []);

  async function payFee() {
    if (!selected) return toast.error('Select a fee type');
    const fee = FEE_TYPES.find(f => f.id === selected);
    if (balance < fee.amount) return toast.error('Insufficient CampusCoin balance');
    const token = localStorage.getItem('cc_token');
    setModal(true); setLoading(true); setResult(null); setError('');
    const res = await fetch('/api/transactions/fee-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount: fee.amount, feeType: fee.label }),
    }).then(r => r.json());
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setResult(res);
    setBalance(res.updatedBalance);
    localStorage.setItem('cc_user', JSON.stringify({ ...user, balance: res.updatedBalance }));
    toast.success('Fee paid successfully!');
  }

  return (
    <>
      <Head><title>Pay Fees — CampusChain</title></Head>
      <div className="layout">
        <Sidebar user={user} />
        <main className="main-content">
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 8 }}>Fee Payment</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>Select a fee category to pay via smart contract</p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            <div className="badge badge-blue">Balance: {balance.toFixed(2)} CC</div>
            <div className="badge badge-green">Smart Contract Secured</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
            {FEE_TYPES.map(fee => (
              <div key={fee.id} className="card" onClick={() => setSelected(fee.id)}
                style={{ padding: 20, cursor: 'pointer', border: selected === fee.id ? '1px solid var(--accent)' : '1px solid var(--border)', background: selected === fee.id ? 'rgba(99,102,241,0.08)' : 'var(--bg-card)', boxShadow: selected === fee.id ? '0 0 20px var(--accent-glow)' : 'none' }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>{fee.icon}</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{fee.label}</div>
                <div className="gold-text" style={{ fontWeight: 800, fontSize: '1.3rem' }}>{fee.amount} <span style={{ fontSize: '0.8rem' }}>CC</span></div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>≈ ₹{(fee.amount * 0.85).toFixed(0)}</div>
              </div>
            ))}
          </div>

          {selected && (
            <div className="card" style={{ padding: 20, maxWidth: 420, marginBottom: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Payment Summary</div>
              {(() => { const fee = FEE_TYPES.find(f => f.id === selected); return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Fee Type</span>
                    <span>{fee.label}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Amount</span>
                    <span className="gold-text" style={{ fontWeight: 700 }}>{fee.amount} CC</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Contract</span>
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-bright)' }}>FeePaymentContract</span>
                  </div>
                  <div className="divider" style={{ margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Balance after</span>
                    <span style={{ fontWeight: 700, color: balance - fee.amount >= 0 ? 'var(--success)' : 'var(--danger)' }}>{(balance - fee.amount).toFixed(2)} CC</span>
                  </div>
                </div>
              ); })()}
            </div>
          )}

          <button className="btn btn-primary" style={{ padding: '13px 32px' }} onClick={payFee} disabled={!selected}>
            <CreditCard size={16} /> Execute Smart Contract <ChevronRight size={14} />
          </button>
        </main>
      </div>
      <SmartContractModal open={modal} onClose={() => setModal(false)} title="FeePaymentContract" loading={loading} result={result} error={error} txType="Fee Payment" amount={selected ? FEE_TYPES.find(f => f.id === selected).amount : 0} recipientName="University" />
    </>
  );
}
