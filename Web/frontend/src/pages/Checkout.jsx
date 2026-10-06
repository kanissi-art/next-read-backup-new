import { useState, useEffect } from 'react';  // ✅ เพิ่ม useEffect
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ordersAPI } from '../services/api';
import { CreditCard, Building, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [slipFile, setSlipFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ ย้ายการเช็ค cart ว่างมาไว้ใน useEffect
  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (paymentMethod === 'transfer' && !slipFile) {
      toast.error('กรุณาแนบสลิปการโอนเงิน');
      return;
    }
    setLoading(true);

    console.log('=== DEBUG CHECKOUT ===');
    console.log('Cart:', cart);
    console.log('Payment Method:', paymentMethod);

    try {
      const slipResponse = paymentMethod === 'transfer'
        ? await ordersAPI.uploadPaymentSlip(slipFile)
        : null;

      const payload = {
        payment_method: paymentMethod === 'transfer' ? 'โอนเงิน' : 'บัตรเครดิต',
        slip_url: slipResponse?.data?.data?.slip_url,
      };

      console.log('Sending payload:', payload);

      const response = await ordersAPI.create(payload);
      
      console.log('Response from API:', response);
      console.log('Response data:', response.data);

      let orderId;
      if (response.data?.data?.order_id) {
        orderId = response.data.data.order_id;
      } else if (response.data?.data?.id) {
        orderId = response.data.data.id;
      } else {
        orderId = Date.now();
      }

      console.log('Order ID:', orderId);

      clearCart();
      toast.success('สร้างคำสั่งซื้อสำเร็จ!');
      
      setTimeout(() => {
        navigate('/order-success', { state: { orderId } });
      }, 500);
      
    } catch (error) {
      console.error('=== CHECKOUT ERROR ===');
      console.error('Error:', error);
      console.error('Error Response:', error.response?.data);
      
      toast.error(error.response?.data?.detail || 'สร้างคำสั่งซื้อไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  // ✅ ถ้า cart ว่าง ให้ return null (หลังจาก useEffect ทำงานแล้ว)
  if (!cart || cart.items.length === 0) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">ชำระเงิน</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">สรุปรายการสั่งซื้อ</h2>
          <div className="space-y-3 mb-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between text-gray-700">
                <span>{item.title} x {item.quantity}</span>
                <span>฿{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 flex justify-between text-xl font-bold text-gray-900">
            <span>รวมทั้งสิ้น</span>
            <span className="text-primary-600">฿{cart.total?.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">วิธีชำระเงิน</h2>
          
          <div className="space-y-3">
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment"
                value="transfer"
                checked={paymentMethod === 'transfer'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="h-4 w-4 text-primary-600"
              />
              <Building className="h-5 w-5 text-gray-600 ml-3 mr-3" />
              <div>
                <p className="font-medium text-gray-900">โอนเงินผ่านธนาคาร</p>
                <p className="text-sm text-gray-500">ธนาคารกสิกรไทย, ธนาคารไทยพาณิชย์</p>
              </div>
            </label>

            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="payment"
                value="credit"
                checked={paymentMethod === 'credit'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="h-4 w-4 text-primary-600"
              />
              <CreditCard className="h-5 w-5 text-gray-600 ml-3 mr-3" />
              <div>
                <p className="font-medium text-gray-900">บัตรเครดิต / เดบิต</p>
                <p className="text-sm text-gray-500">Visa, Mastercard, JCB</p>
              </div>
            </label>
          </div>
        </div>

        {/* Slip Upload */}
        {paymentMethod === 'transfer' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">อัปโหลดสลิปการโอนเงิน</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">คลิกเพื่ออัปโหลด หรือลากไฟล์มาวาง</p>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
                    toast.error('เลือกไฟล์ PNG, JPEG หรือ WebP ขนาดไม่เกิน 5 MB');
                    e.target.value = '';
                    setSlipFile(null);
                    return;
                  }
                  setSlipFile(file);
                }}
                className="hidden"
                id="slip-upload"
              />
              <label
                htmlFor="slip-upload"
                className="mt-2 inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-200"
              >
                เลือกไฟล์
              </label>
              {slipFile && (
                <p className="mt-2 text-sm text-green-600">✅ เลือกไฟล์: {slipFile.name}</p>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'กำลังดำเนินการ...' : `ยืนยันการสั่งซื้อ (฿${cart.total?.toLocaleString()})`}
        </button>
      </form>
    </div>
  );
};

export default Checkout;