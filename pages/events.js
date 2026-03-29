import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../components/Sidebar';
import SmartContractModal from '../components/SmartContractModal';
import { Ticket, Calendar, MapPin, Users, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const authFetch = (url, token) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());

export default function Events() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [tab, setTab] = useState('browse');
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', venue: '', event_date: '', ticket_price: '', total_tickets: '' });

  async function load() {
    const token = localStorage.getItem('cc_token');
    const u = JSON.parse(localStorage.getItem('cc_user') || '{}');
    if (!token) { router.push('/auth'); return; }
    setUser(u);
    const [ev, tk] = await Promise.all([
      authFetch('/api/events/list', token),
      authFetch('/api/events/my-tickets', token),
    ]);
    setEvents(Array.isArray(ev) ? ev : []);
    setMyTickets(Array.isArray(tk) ? tk : []);
  }
  useEffect(() => { load(); }, []);

  async function buyTicket(eventId) {
    const token = localStorage.getItem('cc_token');
    setModal(true); setLoading(true); setResult(null); setError('');
    const res = await fetch('/api/transactions/buy-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ eventId, ticketCount: 1 }),
    }).then(r => r.json());
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setResult(res);
    toast.success('Ticket purchased! 🎟️');
    load();
  }

  async function createEvent(e) {
    e.preventDefault();
    const token = localStorage.getItem('cc_token');
    setCreating(true);
    const res = await fetch('/api/events/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, ticket_price: Number(form.ticket_price), total_tickets: Number(form.total_tickets) }),
    }).then(r => r.json());
    setCreating(false);
    if (res.error) return toast.error(res.error);
    toast.success('Event created!');
    setForm({ title: '', description: '', venue: '', event_date: '', ticket_price: '', total_tickets: '' });
    load();
  }

  return (
    <>
      <Head><title>Events — CampusChain</title></Head>
      <div className="layout">
        <Sidebar user={user} />
        <main className="main-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Campus Events</h1>
            {user?.role === 'admin' && (
              <button className="btn btn-primary" onClick={() => setTab('create')}><Plus size={14} /> Create Event</button>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {['browse', 'my-tickets', ...(user?.role === 'admin' ? ['create'] : [])].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 20px', borderRadius: 10, border: `1px solid ${tab === t ? 'var(--accent)' : 'var(--border)'}`, background: tab === t ? 'rgba(99,102,241,0.15)' : 'transparent', color: tab === t ? 'var(--accent-bright)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem', textTransform: 'capitalize' }}>
                {t === 'my-tickets' ? `My Tickets (${myTickets.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === 'browse' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {events.length === 0 && <div style={{ color: 'var(--text-muted)', padding: 32 }}>No events yet. Admin can create events.</div>}
              {events.map(ev => (
                <div key={ev.id} className="card" style={{ padding: 20 }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>{ev.title}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{ev.description}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={12} /> {new Date(ev.event_date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={12} /> {ev.venue || 'Campus'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={12} /> {ev.sold_tickets}/{ev.total_tickets} tickets sold</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="gold-text" style={{ fontWeight: 800, fontSize: '1.1rem' }}>{ev.ticket_price} CC</div>
                    <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem' }} onClick={() => buyTicket(ev.id)} disabled={ev.sold_tickets >= ev.total_tickets || user?.role === 'admin'}>
                      <Ticket size={12} /> {ev.sold_tickets >= ev.total_tickets ? 'Sold Out' : 'Buy Ticket'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'my-tickets' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {myTickets.length === 0 && <div style={{ color: 'var(--text-muted)', padding: 32 }}>No tickets yet. Buy tickets from Campus Events!</div>}
              {myTickets.map(tk => (
                <div key={tk.id} className="card" style={{ padding: 20, border: '1px solid rgba(99,102,241,0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span className="badge badge-blue"><Ticket size={10} /> Ticket</span>
                    <span className={`badge ${tk.used ? 'badge-red' : 'badge-green'}`}>{tk.used ? 'Used' : 'Valid'}</span>
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{tk.event?.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>{tk.event?.venue} · {new Date(tk.event?.event_date).toLocaleDateString()}</div>
                  <div>
                    <div className="label">Ticket Token (NFT)</div>
                    <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-bright)', background: 'rgba(99,102,241,0.08)', padding: '6px 10px', borderRadius: 6 }}>{tk.ticket_token}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'create' && user?.role === 'admin' && (
            <form onSubmit={createEvent} className="card" style={{ padding: 24, maxWidth: 500 }}>
              <div style={{ fontWeight: 700, marginBottom: 20 }}>Create New Event</div>
              {[['title', 'Event Title', 'text'], ['description', 'Description', 'text'], ['venue', 'Venue', 'text'], ['event_date', 'Event Date', 'datetime-local'], ['ticket_price', 'Ticket Price (CC)', 'number'], ['total_tickets', 'Total Tickets', 'number']].map(([k, label, type]) => (
                <div key={k} style={{ marginBottom: 14 }}>
                  <label className="label">{label}</label>
                  <input className="input" type={type} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} required min={type === 'number' ? 1 : undefined} />
                </div>
              ))}
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={creating}>
                {creating ? 'Creating...' : <><Plus size={14} /> Create EventTicketContract</>}
              </button>
            </form>
          )}
        </main>
      </div>
      <SmartContractModal open={modal} onClose={() => setModal(false)} title="EventTicketContract" loading={loading} result={result} error={error} />
    </>
  );
}
