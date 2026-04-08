import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../components/Sidebar';
import SmartContractModal from '../components/SmartContractModal';
import { ShoppingBag, Search, Coffee, Shirt, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Store() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock items for the display (in a real app, these would come from the database / vendor_items table)
  const [items, setItems] = useState([]);

  // Purchase Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [payResult, setPayResult] = useState(null);
  const [payError, setPayError] = useState('');
  const [activeItem, setActiveItem] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    const u = JSON.parse(localStorage.getItem('cc_user') || '{}');
    if (!token) { router.push('/auth'); return; }
    setUser(u);
    
    fetch('/api/store/items', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (!data.error) setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handlePurchase = async (item) => {
    setActiveItem(item);
    setModalOpen(true);
    setIsPaying(true);
    setPayResult(null);
    setPayError('');

    const token = localStorage.getItem('cc_token');
    const qrData = `campuschain://store_purchase/${item.id}/${item.price}?item=${encodeURIComponent(item.name)}`;

    try {
      const res = await fetch('/api/transactions/vendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vendorId: item.vendor_id, amount: Number(item.price), qrData }),
      });
      const data = await res.json();
      
      setIsPaying(false);
      if (data.error) {
        setPayError(data.error);
        toast.error(data.error);
      } else {
        setPayResult(data);
        toast.success(`Purchased ${item.name} successfully!`);
      }
    } catch (err) {
      setIsPaying(false);
      setPayError(err.message);
      toast.error(err.message);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  return (
    <>
      <Head><title>Campus Market — CampusChain</title></Head>
      <div className="layout">
        <Sidebar user={user} />
        <main className="main-content">
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8, fontFamily: 'Space Grotesk' }}>
              <span className="gradient-text">Campus Market</span>
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Browse and purchase items from official campus vendors using your CampusCoin.</p>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
              <input type="text" className="input" placeholder="Search items..." style={{ paddingLeft: 40 }} />
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: 14 }} />
            </div>
            <button className="btn btn-secondary">All</button>
          </div>

          {items.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 16, border: '1px dashed var(--border)' }}>
              <ShoppingBag size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Marketplace is Empty</div>
              <p style={{ marginTop: 8 }}>Vendors haven't listed any items yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
              {items.map((item) => {
                const Icon = ShoppingBag;
                return (
                  <div key={item.id} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(199, 153, 255, 0.1) 0%, transparent 70%)', filter: 'blur(20px)' }} />
                    
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(74, 248, 227, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                      <Icon size={24} color="var(--cyan)" />
                    </div>
                    
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-bright)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{item.vendor_name || 'Vendor'}</div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '4px 0 8px', fontFamily: 'Space Grotesk' }}>{item.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flex: 1, lineHeight: 1.5 }}>Available for immediate purchase.</p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Price</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'Space Grotesk', color: '#ffffff' }}>{item.price.toFixed(2)} CC</div>
                      </div>
                      <button className="btn btn-primary" onClick={() => handlePurchase(item)}>
                        <ShoppingBag size={14} /> Buy
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
      <SmartContractModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title="StorePurchaseContract" 
        loading={isPaying} 
        result={payResult} 
        error={payError} 
        txType="Market Purchase" 
        amount={activeItem?.price || 0} 
        recipientName={activeItem?.vendor_name || 'Vendor'} 
      />
    </>
  );
}
