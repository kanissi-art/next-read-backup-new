import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { Eye, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [brokenSlipIds, setBrokenSlipIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [slipImageLoaded, setSlipImageLoaded] = useState(false);
  const [slipImageError, setSlipImageError] = useState(false);
  const requiresSlip = reviewOrder?.payment_method === 'โอนเงิน';
  const canConfirmPayment = !requiresSlip || Boolean(reviewOrder?.payment_slip_url && slipImageLoaded);

  const loadOrders = async () => {
    try {
      const res = await api.get('/api/admin/orders');
      setOrders(res.data.data || []);
      setBrokenSlipIds(new Set());
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const openSlipReview = (order) => {
    setSlipImageLoaded(false);
    setSlipImageError(false);
    setReviewOrder(order);
  };

  useEffect(() => {
    void Promise.resolve().then(loadOrders);
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.put(`/api/admin/orders/${orderId}`, { status: newStatus });
      toast.success('อัปเดตสถานะสำเร็จ');
      await loadOrders();
      window.dispatchEvent(new Event('admin-orders-updated'));
    } catch {
      toast.error('อัปเดตไม่สำเร็จ');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    const confirmed = window.confirm(`ลบคำสั่งซื้อ #${orderId} ถาวรหรือไม่? รายการสินค้าและข้อมูลชำระเงินที่เกี่ยวข้องจะถูกลบด้วย`);
    if (!confirmed) return;

    setDeletingOrderId(orderId);
    try {
      await api.delete(`/api/admin/orders/${orderId}`);
      if (reviewOrder?.id === orderId) setReviewOrder(null);
      toast.success('ลบคำสั่งซื้อแล้ว');
      await loadOrders();
      window.dispatchEvent(new Event('admin-orders-updated'));
    } catch {
      toast.error('ลบคำสั่งซื้อไม่สำเร็จ');
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleConfirmPayment = async () => {
    if (!reviewOrder || !canConfirmPayment) return;
    setConfirming(true);
    try {
      await api.put(`/api/admin/orders/${reviewOrder.id}`, { status: 'confirmed' });
      toast.success('ยืนยันการชำระเงินสำเร็จ');
      setReviewOrder(null);
      await loadOrders();
      window.dispatchEvent(new Event('admin-orders-updated'));
    } catch {
      toast.error('ยืนยันการชำระเงินไม่สำเร็จ');
    } finally {
      setConfirming(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels = { pending: 'รอตรวจสอบ', paid: 'รอตรวจสอบ', confirmed: 'ยืนยันแล้ว', cancelled: 'ยกเลิก' };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>{labels[status] || status}</span>;
  };

  if (loading) return <AdminLayout><div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">จัดการคำสั่งซื้อ</h1>

        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full min-w-[42rem]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Order ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">ลูกค้า</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">ยอดรวม</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">E-slip</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">สถานะ</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium">#{order.id}</td>
                  <td className="py-3 px-4 text-sm">{order.users?.name || '-'}</td>
                  <td className="py-3 px-4 text-sm">฿{Number(order.total_amount).toLocaleString()}</td>
                  <td className="py-2 px-4">
                    {order.payment_slip_url && !brokenSlipIds.has(order.id) ? (
                      <button
                        type="button"
                        onClick={() => openSlipReview(order)}
                        aria-label={`ดู E-slip ของคำสั่งซื้อ ${order.id}`}
                        className="block overflow-hidden rounded border border-gray-200 bg-gray-50 hover:border-blue-500"
                      >
                        <img
                          src={order.payment_slip_url}
                          alt=""
                          className="h-16 w-12 object-cover"
                          onError={() => setBrokenSlipIds((current) => new Set(current).add(order.id))}
                        />
                      </button>
                    ) : (
                      <span className="text-sm text-gray-400">ไม่มีภาพ</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">{getStatusBadge(order.status)}</td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center gap-2">
                      {['pending', 'paid'].includes(order.status) && (
                        <>
                        <button
                          type="button"
                          onClick={() => openSlipReview(order)}
                          className="inline-flex items-center gap-1 rounded border border-blue-600 px-2 py-1 text-sm text-blue-700 hover:bg-blue-50"
                        >
                          <Eye size={16} /> ตรวจสลิป
                        </button>
                        <button
                          type="button"
                          onClick={() => window.confirm('ยกเลิกคำสั่งซื้อนี้หรือไม่?') && handleStatusChange(order.id, 'cancelled')}
                          className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          ยกเลิก
                        </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(order.id)}
                        disabled={deletingOrderId === order.id}
                        aria-label={`ลบคำสั่งซื้อ ${order.id}`}
                        title="ลบคำสั่งซื้อ"
                        className="inline-flex h-8 w-8 items-center justify-center rounded border border-red-200 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {reviewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="slip-review-title"
            className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl"
          >
            <header className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 id="slip-review-title" className="text-lg font-semibold text-gray-900">ตรวจสอบ E-slip</h2>
                <p className="mt-1 text-sm text-gray-600">คำสั่งซื้อ #{reviewOrder.id} · ฿{Number(reviewOrder.total_amount).toLocaleString()}</p>
              </div>
              <button
                type="button"
                onClick={() => setReviewOrder(null)}
                aria-label="ปิดหน้าตรวจสอบสลิป"
                className="rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                <X size={20} />
              </button>
            </header>

            <div className="flex min-h-64 max-h-[70vh] items-center justify-center overflow-auto bg-gray-100 p-4">
              {reviewOrder.payment_slip_url && !slipImageError ? (
                <div className="flex flex-col items-center gap-3">
                  <a href={reviewOrder.payment_slip_url} target="_blank" rel="noreferrer" className="block">
                    <img
                      src={reviewOrder.payment_slip_url}
                      alt={`E-slip สำหรับคำสั่งซื้อ ${reviewOrder.id}`}
                      onLoad={() => setSlipImageLoaded(true)}
                      onError={() => setSlipImageError(true)}
                      className="max-h-[62vh] max-w-full rounded border bg-white object-contain"
                    />
                  </a>
                  {!slipImageLoaded && !slipImageError && <p className="text-sm text-gray-600">กำลังโหลด E-slip...</p>}
                </div>
              ) : reviewOrder.payment_slip_url && slipImageError ? (
                <p className="text-sm text-red-700">โหลด E-slip ไม่สำเร็จ กรุณาอัปโหลดสลิปใหม่เพื่อตรวจสอบ</p>
              ) : (
                <p className="text-sm text-gray-600">
                  {requiresSlip ? 'ไม่พบ E-slip ที่แนบมากับคำสั่งซื้อนี้ จึงยังยืนยันการชำระเงินไม่ได้' : 'คำสั่งซื้อนี้ไม่มี E-slip แนบมา'}
                </p>
              )}
            </div>

            <footer className="flex justify-end gap-3 border-t px-5 py-4">
              <button
                type="button"
                onClick={() => setReviewOrder(null)}
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                ปิด
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={!canConfirmPayment || confirming}
                className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {confirming ? 'กำลังยืนยัน...' : 'ยืนยันการชำระเงิน'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </AdminLayout>
  );
};

export default ManageOrders;