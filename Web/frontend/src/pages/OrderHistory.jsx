import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import { Package, Clock, CheckCircle, XCircle, Download, BookOpen, AlertCircle } from 'lucide-react';
import { getCoverImageUrl, handleCoverImageError } from '../components/book/coverImage';
import toast from 'react-hot-toast';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await ordersAPI.getAll();
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error(error.response?.data?.detail || 'โหลดคำสั่งซื้อไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm(`ยืนยันยกเลิกคำสั่งซื้อ #${order.id} หรือไม่?`)) return;

    setCancellingOrderId(order.id);
    try {
      await ordersAPI.cancel(order.id);
      setOrders((currentOrders) => currentOrders.map((currentOrder) =>
        currentOrder.id === order.id ? { ...currentOrder, status: 'cancelled' } : currentOrder
      ));
      toast.success('ยกเลิกคำสั่งซื้อแล้ว');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'ยกเลิกคำสั่งซื้อไม่สำเร็จ');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'confirmed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'รอการยืนยัน';
      case 'paid': return 'ชำระแล้ว รอตรวจสอบ';
      case 'confirmed': return 'ยืนยันแล้ว';
      case 'cancelled': return 'ยกเลิก';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mb-7 border-b border-slate-200 pb-5 sm:mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary-700">ORDERS</p>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">คำสั่งซื้อของฉัน</h1>
        <p className="mt-1 text-sm text-slate-600">ตรวจสอบสถานะและดาวน์โหลดหนังสือที่ยืนยันแล้ว</p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
          <Package className="mx-auto mb-4 h-14 w-14 text-slate-300" />
          <h3 className="mb-2 text-lg font-semibold text-slate-900">ยังไม่มีคำสั่งซื้อ</h3>
          <button
            onClick={() => navigate('/ebooks')}
            className="mt-2 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800"
          >
            เริ่มเลือกซื้อหนังสือ
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <section key={order.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <p className="text-sm font-semibold text-slate-900">คำสั่งซื้อ #{order.id}</p>
                  <p className="text-sm text-slate-500">{new Date(order.created_at).toLocaleDateString('th-TH')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className={`flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${order.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : order.status === 'cancelled' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'}`}>
                    {getStatusIcon(order.status)}
                    <span>{getStatusText(order.status)}</span>
                  </div>
                  {order.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleCancelOrder(order)}
                      disabled={cancellingOrderId === order.id}
                      className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-wait disabled:opacity-60"
                    >
                      <XCircle className="h-4 w-4" />
                      {cancellingOrderId === order.id ? 'กำลังยกเลิก...' : 'ยกเลิกคำสั่งซื้อ'}
                    </button>
                  )}
                </div>
              </div>

              <div className="divide-y divide-slate-100 px-4 sm:px-5">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <img src={getCoverImageUrl(item.cover_url)} alt="" onError={handleCoverImageError} className="h-16 w-12 shrink-0 rounded border border-slate-200 bg-slate-50 object-cover" />
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500">จำนวน {item.quantity} · ฿{Number(item.price).toLocaleString()} / เล่ม</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                      <span className="text-sm font-semibold tabular-nums text-slate-800">฿{Number(item.subtotal ?? item.price * item.quantity).toLocaleString()}</span>
                      {item.download_path ? (
                        <a href={ordersAPI.getDownloadUrl(item.download_path)} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2">
                          <Download className="h-4 w-4" />ดาวน์โหลด PDF
                        </a>
                      ) : order.status === 'confirmed' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><AlertCircle className="h-4 w-4" />ยังไม่มีไฟล์ดาวน์โหลด</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <span className="text-sm text-slate-500">วิธีชำระเงิน: {order.payment_method || '-'}</span>
                <span className="text-base font-bold tabular-nums text-primary-700">ยอดรวม ฿{Number(order.total_amount || 0).toLocaleString()}</span>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;