import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../components/Sidebar';
import { Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const authFetch = (url, token, opts = {}) =>
  fetch(url, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...opts }).then(r => r.json());

export default function RequestTokens() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const token = localStorage.getItem('cc_token');
    const u = JSON.parse(localStorage.getItem('cc_user') || '{}');
    if (!token) { router.push('/auth'); return; }
    setUser(u);
    const reqs = await authFetch('/api/token-requests/list', token);
    setRequests(Array.isArray(reqs) ? reqs : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.error('Enter a valid amount');
    const token = localStorage.getItem('cc_token');
    setSubmitting(true);
    const res = await authFetch('/api/token-requests/request', token, {
      method: 'POST',
      body: JSON.stringify({ amount: Number(amount), reason }),
    });
    setSubmitting(false);
    if (res.error) return toast.error(res.error);
    toast.success('Request submitted! Admin will review it.');
    setAmount(''); setReason('');
    load();
  }

  async function handle(requestId, action) {
    const token = localStorage.getItem('cc_token');
    const res = await authFetch(`/api/token-requests/${action}`, token, {
      method: 'POST',
      body: JSON.stringify({ requestId }),
    });
    if (res.error) return toast.error(res.error);
    toast.success(action === 'approve' ? 'Tokens approved and sent! ✅' : 'Request rejected');
    load();
  }

  const statusBadge = (s) => ({
    pending: <span className="badge badge-yellow"><Clock size={9} /> Pending</span>,
    approved: <span className="badge badge-green"><CheckCircle size={9} /> Approved</span>,
    rejected: <span className="badge badge-red"><XCircle size={9} /> Rejected</span>,
  }[s] || s);

  return (
    <>
      <Head><title>Token Requests — CampusChain</title></Head>
      <div className="layout">
        <Sidebar user={user} />
        <main className="main-content">
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 8 }}>
            {user?.role === 'admin' ? '📋 Token Request Manager' : '🪙 Request CampusCoin'}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>
            {user?.role === 'admin' ? 'Review and approve student token top-up requests' : 'Ask admin to top up your CampusCoin wallet'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: user?.role === 'admin' ? '1fr' : '1fr 1fr', gap: 24 }}>
            {/* Student request form */}
            {user?.role !== 'admin' && (
              <form onSubmit={submit} className="card" style={{ padding: 24, alignSelf: 'start' }}>
                <div style={{ fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Send size={16} color="var(--accent)" /> New Request
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Amount (CC)</label>
                  <input className="input" type="number" min="1" max="5000" placeholder="e.g. 500" value={amount} onChange={e => setAmount(e.target.value)} required />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 5 }}>Max 5,000 CC per request</div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label className="label">Reason</label>
                  <textarea className="input" rows={3} placeholder="Why do you need tokens? e.g. scholarship, lost card, event..." value={reason} onChange={e => setReason(e.target.value)} style={{ resize: 'vertical' }} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
                  {submitting ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Submitting…</> : <><Send size={14} /> Submit Request</>}
                </button>
              </form>
            )}

            {/* Requests list */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
                {user?.role === 'admin' ? 'All Pending Requests' : 'My Requests'}
              </div>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
              ) : requests.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>No requests yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {requests.map(r => (
                    <div key={r.id} style={{ padding: '16px 20px', borderBottom: '1px solid rgba(99,102,241,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        {user?.role === 'admin' && (
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 3 }}>
                            {r.requester?.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({r.requester?.student_id})</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span className="gold-text" style={{ fontWeight: 800, fontSize: '1rem' }}>{r.amount} CC</span>
                          {statusBadge(r.status)}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.reason}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>{new Date(r.created_at).toLocaleString()}</div>
                      </div>
                      {user?.role === 'admin' && r.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-success" style={{ padding: '6px 14px', fontSize: '0.78rem' }} onClick={() => handle(r.id, 'approve')}>
                            <CheckCircle size={12} /> Approve
                          </button>
                          <button className="btn btn-danger" style={{ padding: '6px 14px', fontSize: '0.78rem' }} onClick={() => handle(r.id, 'reject')}>
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
