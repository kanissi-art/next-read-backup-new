import { BookOpen } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <BookOpen className="h-8 w-8 text-primary-400" />
              <span className="text-xl font-bold">E-Book Mart</span>
            </div>
            <p className="text-gray-400">
              ร้านหนังสืออิเล็กทรอนิกส์ชั้นนำ รวมหนังสือคุณภาพจากนักเขียนชั้นนำ
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">เมนู</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/" className="hover:text-white">หน้าแรก</a></li>
              <li><a href="/ebooks" className="hover:text-white">หนังสือทั้งหมด</a></li>
              <li><a href="/categories" className="hover:text-white">หมวดหมู่</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">บัญชีผู้ใช้</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/login" className="hover:text-white">เข้าสู่ระบบ</a></li>
              <li><a href="/register" className="hover:text-white">สมัครสมาชิก</a></li>
              <li><a href="/profile" className="hover:text-white">โปรไฟล์</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">ติดต่อเรา</h3>
            <ul className="space-y-2 text-gray-400">
              <li>📧 support@ebookmart.com</li>
              <li>📱 02-123-4567</li>
              <li>📍 กรุงเทพฯ, ประเทศไทย</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2026 E-Book Mart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;