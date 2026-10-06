import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';

const Cart = () => {
  const { cart, loading, updateQuantity, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">กรุณาเข้าสู่ระบบ</h2>
        <button
          onClick={() => navigate('/login')}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
        >
          เข้าสู่ระบบ
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">ตะกร้าสินค้าว่างเปล่า</h2>
        <p className="text-gray-600 mb-6">เริ่มเลือกซื้อหนังสือที่คุณสนใจกันเลย!</p>
        <button
          onClick={() => navigate('/ebooks')}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
        >
          เลือกซื้อหนังสือ
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">ตะกร้าสินค้า ({cart.items.length} รายการ)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md p-4 flex gap-4">
              <img
                src={item.cover_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100&h=150&fit=crop'}
                alt={item.title || 'หนังสือ'}
                className="w-24 h-36 object-cover rounded-md bg-gray-200"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100&h=150&fit=crop';
                }}
              />
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600">โดย {item.author_name || 'ไม่ระบุ'}</p>
                  <p className="text-primary-600 font-bold mt-1">฿{item.price?.toLocaleString()}</p>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-2 border border-gray-300 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 hover:bg-gray-100 rounded-l-lg"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-4 font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 hover:bg-gray-100 rounded-r-lg"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-700 flex items-center space-x-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>ลบ</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">สรุปคำสั่งซื้อ</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>รวมย่อย</span>
                <span>฿{cart.total?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>ค่าจัดส่ง</span>
                <span className="text-green-600">ฟรี</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-xl font-bold text-gray-900">
                <span>รวมทั้งสิ้น</span>
                <span className="text-primary-600">฿{cart.total?.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              ดำเนินการชำระเงิน
            </button>

            <button
              onClick={() => navigate('/ebooks')}
              className="w-full mt-3 text-primary-600 hover:text-primary-700 font-medium"
            >
              ← เลือกซื้อหนังสือต่อ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;