import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import BrandMark from './BrandMark';
import { useState } from 'react';


const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Logo */}
          <div className="min-w-0">
            <Link to="/" className="flex items-center gap-2">
              <BrandMark className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
              <span className="whitespace-nowrap text-lg font-bold text-gray-900 sm:text-xl">Nextread-Ebook-Strore</span>
            </Link>
          </div>

          {/* Navigation */}
          <div className="hidden items-center gap-5 lg:flex">
            <Link to="/" className="text-gray-700 hover:text-primary-600 font-medium">
              หน้าแรก
            </Link>
            <Link to="/ebooks" className="text-gray-700 hover:text-primary-600 font-medium">
              หนังสือ
            </Link>
            <Link to="/my-reviews" className="text-gray-700 hover:text-primary-600 font-medium">
              รีวิวของฉัน
            </Link>
            {user ? (
              <>
                  <Link to="/orders" className="text-gray-700 hover:text-primary-600 font-medium">
                    คำสั่งซื้อ
                  </Link>
                  <Link to="/wishlist" aria-label="Wishlist" title="Wishlist" className="text-gray-700 hover:text-primary-600">
                    <Heart className="h-6 w-6" />
                  </Link>
                  <Link to="/cart" aria-label={`ตะกร้าสินค้า ${cartCount} รายการ`} title="ตะกร้าสินค้า" className="text-gray-700 hover:text-primary-600 relative">
                    <ShoppingCart className="h-6 w-6" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                  <div className="flex items-center space-x-3">
                    <Link to="/profile" className="text-gray-700 hover:text-primary-600">
                      <User className="h-6 w-6" />
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-gray-700 hover:text-red-600"
                    >
                      <LogOut className="h-6 w-6" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    เข้าสู่ระบบ
                  </Link>
                  <Link
                    to="/register"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                  >
                    สมัครสมาชิก
                  </Link>
                </div>
              )}
          </div>
          <button
            type="button"
            aria-label={mobileOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileOpen && (
          <nav aria-label="เมนูหลัก" className="border-t border-gray-200 py-2 lg:hidden">
            <div className="flex flex-col">
              <Link to="/" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">หน้าแรก</Link>
              <Link to="/ebooks" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">หนังสือ</Link>
              <Link to="/my-reviews" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">รีวิวของฉัน</Link>
              {user ? (
                <>
                  <Link to="/orders" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">คำสั่งซื้อ</Link>
                  <Link to="/wishlist" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">รายการที่ชอบ</Link>
                  <Link to="/cart" onClick={() => setMobileOpen(false)} className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <span>ตะกร้าสินค้า</span><span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700">{cartCount}</span>
                  </Link>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">โปรไฟล์</Link>
                  <button type="button" onClick={handleLogout} className="mt-1 rounded-md px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50">ออกจากระบบ</button>
                </>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2 border-t border-gray-100 px-3 pt-3">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="flex min-h-10 items-center justify-center rounded-lg border border-primary-600 px-3 text-sm font-semibold text-primary-700">เข้าสู่ระบบ</Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="flex min-h-10 items-center justify-center rounded-lg bg-primary-600 px-3 text-sm font-semibold text-white hover:bg-primary-700">สมัครสมาชิก</Link>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </nav>
  );
};

export default Navbar;