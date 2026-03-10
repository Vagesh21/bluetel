import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Mic, CalendarDays, MessageSquare, Users, Settings, LogOut, Menu, X } from 'lucide-react';
import api from '@/lib/api';

const NAV = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Episodes', path: '/admin/episodes', icon: Mic },
  { label: 'Events', path: '/admin/events', icon: CalendarDays },
  { label: 'Submissions', path: '/admin/submissions', icon: MessageSquare },
  { label: 'Subscribers', path: '/admin/subscribers', icon: Users },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

export default function AdminLayout() {
  const [admin, setAdmin] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { navigate('/admin/login'); return; }
    api.get('/auth/me').then(r => setAdmin(r.data)).catch(() => navigate('/admin/login'));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  if (!admin) return <div className="min-h-screen bg-blues-bg flex items-center justify-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-blues-bg flex" data-testid="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar fixed md:static inset-y-0 left-0 z-50 w-60 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-5 border-b border-white/5">
            <Link to="/" className="flex items-center gap-2">
              <img src="https://theblueshotel.com.au/wp-content/uploads/2026/02/Untitled.png" alt="Logo" className="h-8 w-auto" />
              <span className="text-amber text-xs uppercase tracking-widest font-body font-bold">Admin</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden ml-auto text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4 space-y-1 px-3">
            {NAV.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  data-testid={`admin-nav-${item.label.toLowerCase()}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors ${
                    isActive ? 'bg-amber/10 text-amber' : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-amber/20 text-amber rounded-full flex items-center justify-center text-sm font-bold">
                {admin.name?.[0] || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-white truncate">{admin.name}</p>
                <p className="text-xs text-gray-600 truncate">{admin.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-400 transition-colors" data-testid="admin-logout">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Top bar mobile */}
        <div className="md:hidden h-14 flex items-center px-4 border-b border-white/5 bg-blues-bg">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400" data-testid="admin-mobile-menu">
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-3 text-sm text-amber uppercase tracking-widest font-bold">Admin</span>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 max-w-6xl">
          <Outlet />
        </div>
      </div>

      {/* Overlay on mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
