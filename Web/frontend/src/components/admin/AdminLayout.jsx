import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import BrandMark from '../common/BrandMark';
import {
  LayoutDashboard, BookOpen, ShoppingCart, Users, BarChart3, LogOut, Menu, X, Feather
} from 'lucide-react';
import { useEffect, useState } from 'react';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);

  useEffect(() => {
    const refreshPendingReviewCount = async () => {
      try {
        const response = await api.get('/api/admin/orders');
        const orders = response.data.data || [];
        const pendingOrders = orders.filter((order) => {
          if (!['pending', 'paid'].includes(order.status)) return false;
          const payments = Array.isArray(order.payments)
            ? order.payments
            : [order.payments].filter(Boolean);
          return payments.length === 0 || payments.some((payment) => payment.status === 'pending');
        });

        setPendingReviewCount(pendingOrders.length);
      } catch {
        setPendingReviewCount(0);
      }
    };

    window.addEventListener('admin-orders-updated', refreshPendingReviewCount);
    void refreshPendingReviewCount();
    return () => window.removeEventListener('admin-orders-updated', refreshPendingReviewCount);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/ebooks', icon: BookOpen, label: 'จัดการหนังสือ' },
    { path: '/admin/categories', icon: BookOpen, label: 'จัดการหมวดหมู่' }, // จะสร้างในขั้นตอนถัดไป
    { path: '/admin/authors', icon: Feather, label: 'จัดการผู้แต่ง' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'จัดการคำสั่งซื้อ', badgeCount: pendingReviewCount },
    { path: '/admin/users', icon: Users, label: 'จัดการผู้ใช้' },
    { path: '/admin/reports', icon: BarChart3, label: 'รายงาน' },
  ];

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-pink-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="fixed hidden h-dvh w-64 shrink-0 flex-col bg-slate-950 text-white md:flex">
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <BrandMark className="h-10 w-10 shrink-0" />
            <div>
              <h1 className="text-base font-bold">Nextread-Ebook-Strore</h1>
              <p className="mt-0.5 text-xs text-slate-400">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive(item.path) ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
              {item.badgeCount > 0 && (
                <>
                  <span className="ml-auto h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden="true" />
                  <span className="sr-only">มีออเดอร์ที่ยังไม่ได้ตรวจสอบ {item.badgeCount} รายการ</span>
                </>
              )}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 font-bold">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-400">ผู้ดูแลระบบ</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-rose-700 py-2 text-sm font-semibold text-white transition hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <LogOut className="h-4 w-4" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <button type="button" aria-label="ปิดเมนู" className="fixed inset-0 bg-slate-950/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex h-dvh w-[min(18rem,calc(100vw-2.5rem))] flex-col bg-slate-950 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex items-center gap-3">
                <BrandMark className="h-9 w-9 shrink-0" />
                <h1 className="text-base font-bold">Nextread-Ebook-Strore</h1>
              </div>
              <button type="button" aria-label="ปิดเมนู" onClick={() => setSidebarOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive(item.path) ? 'bg-primary-600' : 'hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {item.badgeCount > 0 && (
                    <>
                      <span className="ml-auto h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden="true" />
                      <span className="sr-only">มีออเดอร์ที่ยังไม่ได้ตรวจสอบ {item.badgeCount} รายการ</span>
                    </>
                  )}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col md:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-3 border-b border-pink-100 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
          <button type="button" aria-label="เปิดเมนู" onClick={() => setSidebarOpen(true)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 md:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-slate-900 sm:text-lg md:flex-none">
            {menuItems.find((item) => isActive(item.path))?.label || 'Admin'}
          </h2>
          <Link to="/" className="shrink-0 rounded-md px-2 py-2 text-xs font-semibold text-primary-700 transition hover:bg-primary-50 sm:px-3 sm:text-sm">
            <span className="sm:hidden">หน้าร้าน</span><span className="hidden sm:inline">กลับหน้าร้าน</span>
          </Link>
        </header>

        {/* Page Content */}
        <main className="min-w-0 flex-1 overflow-x-hidden bg-pink-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;