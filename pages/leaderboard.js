import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../components/Sidebar';
import { Trophy, TrendingUp, Activity, Crown } from 'lucide-react';

export default function Leaderboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    const u = JSON.parse(localStorage.getItem('cc_user') || '{}');
    if (!token) { router.push('/auth'); return; }
    setUser(u);
    fetch('/api/leaderboard', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  const medalColor = (r) => r === 1 ? '#FFD700' : r === 2 ? '#C0C0C0' : r === 3 ? '#CD7F32' : 'var(--text-muted)';
  const medalIcon = (r) => r <= 3 ? <Crown size={14} color={medalColor(r)} /> : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>#{r}</span>;

  return (
    <>
      <Head><title>Leaderboard — CampusChain</title></Head>
      <div className="layout">
        <Sidebar user={user} />
        <main className="main-content">
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>
              <span className="gradient-text">🏆 Campus Leaderboard</span>
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Top wallets on the CampusChain network</p>
          </div>

          {data?.myRank && (
            <div className="card" style={{ padding: 18, marginBottom: 20, background: 'rgba(99,102,241,0.07)', border: '1px solid var(--border-bright)' }}>
              <div style={{ display: 'flex', align: 'center', gap: 10 }}>
                <Trophy size={18} color="var(--gold)" />
                <span style={{ fontWeight: 600 }}>Your Rank: </span>
                <span className="gradient-text" style={{ fontWeight: 800, fontSize: '1.05rem' }}>#{data.myRank}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>out of {data.topBalances?.length} users on leaderboard</span>
              </div>
            </div>
          )}

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={15} color="var(--gold)" /> Top 10 — Balance Rankings
            </div>
            {loading ? (
              <div style={{ padding: 48, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>ID</th>
                    <th>Role</th>
                    <th><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><TrendingUp size={11} /> Balance</div></th>
                    <th><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Activity size={11} /> Volume Spent</div></th>
                    <th>Transactions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.topBalances?.map(u => (
                    <tr key={u.student_id} style={{ background: u.isMe ? 'rgba(99,102,241,0.07)' : 'transparent' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {medalIcon(u.rank)}
                          {u.isMe && <span className="badge badge-blue" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>you</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${u.rank <= 3 ? '#f59e0b' : '#6366f1'}, ${u.rank <= 3 ? '#fcd34d' : '#4f46e5'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                            {u.name?.charAt(0)}
                          </div>
                          <span style={{ fontWeight: u.rank <= 3 ? 700 : 400 }}>{u.name}</span>
                        </div>
                      </td>
                      <td><span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.student_id}</span></td>
                      <td><span className={`badge badge-${u.role === 'admin' ? 'yellow' : u.role === 'vendor' ? 'cyan' : 'blue'}`}>{u.role}</span></td>
                      <td>
                        <span style={{ fontWeight: 700, color: u.rank === 1 ? '#FFD700' : 'var(--success)', fontFamily: 'JetBrains Mono' }}>
                          {u.balance?.toLocaleString('en-IN', { maximumFractionDigits: 2 })} CC
                        </span>
                      </td>
                      <td style={{ color: 'var(--danger)', fontFamily: 'JetBrains Mono', fontSize: '0.85rem' }}>{u.volume?.toFixed(2)} CC</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.txCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
