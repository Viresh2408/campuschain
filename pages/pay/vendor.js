import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../../components/Sidebar';
import SmartContractModal from '../../components/SmartContractModal';
import { QrCode, Check, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VendorPayment() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [vendors, setVendors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    const u = JSON.parse(localStorage.getItem('cc_user') || '{}');
    if (!token) { router.push('/auth'); return; }
    setUser(u);
    fetch('/api/wallet/balance', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(w => setBalance(w.balance || 0));
    fetch('/api/wallet/vendors', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setVendors);
  }, []);

  function generateQR() {
    if (!selected || !amount) return toast.error('Select vendor and amount');
    const data = `campuschain://vendor/${selected.id}/${amount}/${Date.now()}`;
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}&bgcolor=0d1326&color=818cf8&margin=10`;
    setQrUrl(url);
  }

  async function pay() {
    if (!selected || !amount) return toast.error('Select vendor and enter amount');
    const token = localStorage.getItem('cc_token');
    const qrData = `campuschain://vendor/${selected.id}/${amount}`;
    setModal(true); setLoading(true); setResult(null); setError('');
    const res = await fetch('/api/transactions/vendor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ vendorId: selected.id, amount: Number(amount), qrData }),
    }).then(r => r.json());
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setResult(res);
    setBalance(res.studentBalance);
    toast.success(`Paid ${amount} CC to ${selected.name}`);
  }

  return (
    <>
      <Head><title>Vendor Payment — CampusChain</title></Head>
      <div className="layout">
        <Sidebar user={user} />
        <main className="main-content">
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 8 }}>Vendor Payment</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>Pay cafeteria, store, or any campus vendor via QR</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 800 }}>
            {/* Left: Select vendor */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 16 }}>Select Vendor</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {vendors.map(v => (
                  <div key={v.id} onClick={() => { setSelected(v); setQrUrl(''); }}
                    style={{ padding: '12px 16px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${selected?.id === v.id ? 'var(--accent)' : 'var(--border)'}`, background: selected?.id === v.id ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🏪</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{v.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{v.student_id}</div>
                    </div>
                    {selected?.id === v.id && <Check size={14} color="var(--accent)" style={{ marginLeft: 'auto' }} />}
                  </div>
                ))}
                {vendors.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: 20 }}>No vendors found</div>}
              </div>
              <label className="label">Amount (CC)</label>
              <input className="input" type="number" min="1" placeholder="0.00" value={amount} onChange={e => { setAmount(e.target.value); setQrUrl(''); }} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>Balance: {balance.toFixed(2)} CC</div>
            </div>

            {/* Right: QR Code */}
            <div className="card" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontWeight: 600, marginBottom: 16 }}>QR Payment Code</div>
              {qrUrl ? (
                <div>
                  <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, display: 'inline-block', marginBottom: 16, border: '1px solid var(--border-bright)' }}>
                    <img src={qrUrl} alt="Payment QR" style={{ width: 180, height: 180, display: 'block' }} />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>Scan to pay {amount} CC to {selected?.name}</div>
                </div>
              ) : (
                <div style={{ height: 212, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, border: '2px dashed var(--border)', marginBottom: 16 }}>
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <QrCode size={40} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <div style={{ fontSize: '0.82rem' }}>Generate QR code</div>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={generateQR} disabled={!selected || !amount}>
                  <RefreshCw size={14} /> {qrUrl ? 'Regenerate QR' : 'Generate QR'}
                </button>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={pay} disabled={!selected || !amount}>
                  <QrCode size={14} /> Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
      <SmartContractModal open={modal} onClose={() => setModal(false)} title="VendorPaymentContract" loading={loading} result={result} error={error} txType="Vendor Payment" amount={amount} recipientName={selected?.name} />
    </>
  );
}
