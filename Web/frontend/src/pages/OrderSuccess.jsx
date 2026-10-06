import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag } from 'lucide-react';

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId || 'N/A';

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
      <h1 className="text-3xl font-bold text-gray-900 mb-4">สั่งซื้อสำเร็จ!</h1>
      <p className="text-gray-600 mb-2">ขอบคุณที่สั่งซื้อหนังสือกับเรา</p>
      <p className="text-gray-600 mb-8">หมายเลขคำสั่งซื้อ: <span className="font-bold text-primary-600">#{orderId}</span></p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => navigate('/orders')}
          className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 flex items-center justify-center space-x-2"
        >
          <ShoppingBag className="h-5 w-5" />
          <span>ดูประวัติคำสั่งซื้อ</span>
        </button>
        <button
          onClick={() => navigate('/ebooks')}
          className="bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50"
        >
          เลือกซื้อหนังสือต่อ
        </button>
      </div>
    </div>
  );
};

export default OrderSuccess;