import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../components/Sidebar';
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, BarChart2 } from 'lucide-react';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem' }}>
        {label && <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>}
        {payload.map((p, i) => <div key={i} style={{ color: p.color || 'var(--accent-bright)', fontWeight: 600 }}>{p.name}: {p.value?.toFixed ? p.value.toFixed(2) : p.value} CC</div>)}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [range, setRange] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    const u = JSON.parse(localStorage.getItem('cc_user') || '{}');
    if (!token) { router.push('/auth'); return; }
    setUser(u);
    setLoading(true);
    fetch(`/api/analytics/spending?range=${range}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [range]);

  return (
    <>
      <Head><title>Analytics — CampusChain</title></Head>
      <div className="layout">
        <Sidebar user={user} />
        <main className="main-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>Spending Analytics</h1>
              <p style={{ color: 'var(--text-muted)' }}>Your financial patterns on the blockchain</p>
            </div>
            <select className="input" style={{ width: 140 }} value={range} onChange={e => setRange(e.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>

          {/* Summary stats */}
          {data && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
              <div className="card" style={{ padding: 20 }}>
                <div className="stat-label" style={{ marginBottom: 8 }}>Total Spent</div>
                <div className="stat-value gradient-text">{data.totalSpent?.toFixed(2)} CC</div>
              </div>
              <div className="card" style={{ padding: 20 }}>
                <div className="stat-label" style={{ marginBottom: 8 }}>Transactions</div>
                <div className="stat-value" style={{ color: 'var(--cyan)' }}>{data.txCount}</div>
              </div>
              <div className="card" style={{ padding: 20 }}>
                <div className="stat-label" style={{ marginBottom: 8 }}>Avg per Tx</div>
                <div className="stat-value gold-text">{data.txCount ? (data.totalSpent / data.txCount).toFixed(2) : '0'} CC</div>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ padding: 80, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto', width: 40, height: 40 }} /></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Pie chart */}
              <div className="card" style={{ padding: 24 }}>
                <div style={{ fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><BarChart2 size={16} color="var(--accent)" /> Spend by Category</div>
                {data?.spendByCategory?.length ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={data.spendByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                        {data.spendByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>No spending data yet</div>}
              </div>

              {/* Line chart */}
              <div className="card" style={{ padding: 24 }}>
                <div style={{ fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><TrendingUp size={16} color="var(--cyan)" /> Daily Volume</div>
                {data?.dailyVolume?.length ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={data.dailyVolume}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                      <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#475569', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} name="CC Spent" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>No daily data yet</div>}
              </div>

              {/* Bar chart - Top recipients */}
              <div className="card" style={{ padding: 24, gridColumn: '1 / -1' }}>
                <div style={{ fontWeight: 600, marginBottom: 20 }}>Top Recipients</div>
                {data?.topRecipients?.length ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.topRecipients}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                      <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#475569', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} name="CC Sent" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No recipient data yet</div>}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
