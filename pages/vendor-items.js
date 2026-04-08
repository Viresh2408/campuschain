import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../components/Sidebar';
import { Layers, Plus, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VendorItems() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    const u = JSON.parse(localStorage.getItem('cc_user') || '{}');
    if (!token) { router.push('/auth'); return; }
    if (u.role !== 'vendor') { router.push('/dashboard'); return; }
    setUser(u);
    fetchItems(token);
  }, []);

  async function fetchItems(token) {
    try {
      const res = await fetch('/api/vendor/items', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems(data);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function addItem(e) {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('cc_token');
    try {
      const res = await fetch('/api/vendor/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, price }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems([data, ...items]);
      setName('');
      setPrice('');
      toast.success('Item added successfully');
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  }

  return (
    <>
      <Head><title>Manage Items — CampusChain</title></Head>
      <div className="layout">
        <Sidebar user={user} />
        <main className="main-content">
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 8 }}>Manage Items</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>Add and update items available in your shop</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, maxWidth: 900 }}>
            {/* Left: Add Item Form */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={16} color="var(--accent)" /> Add New Item
              </div>
              <form onSubmit={addItem}>
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Item Name</label>
                  <input className="input" placeholder="e.g. Cold Coffee" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="label">Rate/Price (CC)</label>
                  <div style={{ position: 'relative' }}>
                    <Tag size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="input" style={{ paddingLeft: 38 }} type="number" min="0" step="0.01" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                  {loading ? 'Adding...' : 'Add Item'}
                </button>
              </form>
            </div>

            {/* Right: Items List */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={16} color="var(--accent)" /> Your Catalog
              </div>
              {items.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>You haven't added any items yet.</div>
              ) : (
                <table className="table">
                  <thead><tr><th>Item Name</th><th>Price</th><th>Added On</th></tr></thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 700 }}>{item.price.toFixed(2)} CC</td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(item.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
