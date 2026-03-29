import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Hexagon, Eye, EyeOff, User, Mail, Lock, ArrowRight, Cpu } from 'lucide-react';
import toast from 'react-hot-toast';

const API = async (url, body, method = 'POST') => {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
};

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (router.query.mode === 'register') setMode('register');
    const token = localStorage.getItem('cc_token');
    if (token) router.push('/dashboard');
  }, [router.query]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    const data = await API(`/api/auth/${mode}`, form);
    setLoading(false);
    if (data.error) return toast.error(data.error);
    localStorage.setItem('cc_token', data.token);
    localStorage.setItem('cc_user', JSON.stringify(data.user));
    toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!');
    router.push('/dashboard');
  }

  return (
    <>
      <Head><title>CampusChain — {mode === 'login' ? 'Sign In' : 'Register'}</title></Head>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#6366f1,#06b6d4)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Hexagon size={26} color="white" />
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.5rem' }}><span className="gradient-text">Campus</span>Chain</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>Blockchain Campus Financial OS</div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 12, padding: 4, marginBottom: 28, border: '1px solid var(--border)' }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', background: mode === m ? 'var(--accent)' : 'transparent', color: mode === m ? 'white' : 'var(--text-muted)', transition: 'all 0.2s' }}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={submit} className="glass-bright" style={{ borderRadius: 20, padding: 28 }}>
            {mode === 'register' && (
              <div style={{ marginBottom: 18 }}>
                <label className="label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="input" style={{ paddingLeft: 38 }} placeholder="John Doe" value={form.name} onChange={set('name')} required />
                </div>
              </div>
            )}
            <div style={{ marginBottom: 18 }}>
              <label className="label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="input" style={{ paddingLeft: 38 }} type="email" placeholder="you@campus.edu" value={form.email} onChange={set('email')} required />
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="input" style={{ paddingLeft: 38, paddingRight: 44 }} type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={set('password')} required minLength={6} />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {mode === 'register' && (
              <div style={{ marginBottom: 18 }}>
                <label className="label">Role</label>
                <select className="input" value={form.role} onChange={set('role')}>
                  <option value="student">Student</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.95rem', marginTop: 8 }} disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Processing...</> : <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={14} /></>}
            </button>

            {mode === 'login' && (
              <div style={{ marginTop: 20, padding: 14, borderRadius: 10, background: 'rgba(99,102,241,0.05)', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Demo Credentials</div>
                <div><Cpu size={10} style={{ display: 'inline', marginRight: 6 }} /><strong>Admin:</strong> admin@campus.edu / admin123</div>
                <div style={{ marginTop: 2 }}><Cpu size={10} style={{ display: 'inline', marginRight: 6 }} /><strong>Vendor:</strong> cafeteria@campus.edu / admin123</div>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
