import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  LayoutDashboard, Wallet, ArrowLeftRight, CreditCard, Users,
  BarChart2, Ticket, ShieldAlert, LogOut, Hexagon, ChevronRight,
  Bell, Settings
} from 'lucide-react';

const studentNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/wallet', icon: Wallet, label: 'My Wallet' },
  { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { href: '/pay/fees', icon: CreditCard, label: 'Pay Fees' },
  { href: '/pay/transfer', icon: ArrowLeftRight, label: 'P2P Transfer' },
  { href: '/pay/vendor', icon: ShieldAlert, label: 'Vendor Pay' },
  { href: '/events', icon: Ticket, label: 'Events' },
  { href: '/leaderboard', icon: BarChart2, label: 'Leaderboard' },
  { href: '/request-tokens', icon: Bell, label: 'Request Tokens' },
  { href: '/analytics', icon: BarChart2, label: 'Analytics' },
];

const adminNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin', icon: ShieldAlert, label: 'Admin Panel' },
  { href: '/admin/audit', icon: BarChart2, label: 'Audit Log' },
  { href: '/request-tokens', icon: Bell, label: 'Token Requests' },
  { href: '/leaderboard', icon: BarChart2, label: 'Leaderboard' },
  { href: '/events', icon: Ticket, label: 'Events' },
  { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { href: '/analytics', icon: BarChart2, label: 'Analytics' },
];

const vendorNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/wallet', icon: Wallet, label: 'My Wallet' },
  { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { href: '/pay/vendor', icon: CreditCard, label: 'Receive Payment' },
  { href: '/leaderboard', icon: BarChart2, label: 'Leaderboard' },
  { href: '/analytics', icon: BarChart2, label: 'Analytics' },
];

export default function Sidebar({ user }) {
  const router = useRouter();
  const nav = user?.role === 'admin' ? adminNav : user?.role === 'vendor' ? vendorNav : studentNav;

  function logout() {
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    router.push('/auth');
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#6366f1,#06b6d4)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Hexagon size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.5px' }}>
              <span className="gradient-text">Campus</span>Chain
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {user?.role || 'Portal'}
            </div>
          </div>
        </div>
      </div>

      {/* User card */}
      {user && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700 }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.student_id}</div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
        {nav.map(({ href, icon: Icon, label }) => {
          const active = router.pathname === href;
          return (
            <Link key={href} href={href}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, marginBottom: 2,
                background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: active ? 'var(--accent-bright)' : 'var(--text-secondary)',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.15s', cursor: 'pointer', fontSize: '0.88rem', fontWeight: active ? 600 : 400
              }}>
                <Icon size={16} />
                {label}
                {active && <ChevronRight size={12} style={{ marginLeft: 'auto' }} />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={logout}>
          <LogOut size={14} /> Logout
        </button>
      </div>
    </aside>
  );
}
