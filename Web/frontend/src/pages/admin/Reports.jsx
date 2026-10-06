import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import toast from 'react-hot-toast';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('sales');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const reports = [
    { id: 'sales', name: 'ยอดขายตามช่วงเวลา', icon: '📊' },
    { id: 'bestseller', name: 'E-Book ขายดี', icon: '' },
    { id: 'category', name: 'ยอดขายตามหมวดหมู่', icon: '' },
    { id: 'customer', name: 'ลูกค้าและคำสั่งซื้อ', icon: '' },
  ];

  useEffect(() => { loadReportData(); }, [activeReport]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      let res;
      if (activeReport === 'sales') res = await api.get('/api/admin/reports/sales-by-time');
      else if (activeReport === 'bestseller') res = await api.get('/api/admin/reports/best-selling');
      else if (activeReport === 'category') res = await api.get('/api/admin/reports/sales-by-category');
      else if (activeReport === 'customer') res = await api.get('/api/admin/reports/customer-analysis');
      setData(res?.data?.data || []);
    } catch (error) {
      toast.error('ไม่สามารถโหลดรายงานได้');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">รายงานวิเคราะห์</h1>

        <div className="flex flex-wrap gap-2">
          {reports.map((report) => (
            <button key={report.id} onClick={() => setActiveReport(report.id)} className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition ${activeReport === report.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
              <span>{report.icon}</span><span>{report.name}</span>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
          ) : data.length === 0 ? (
            <p className="text-center text-gray-500 py-20">ยังไม่มีข้อมูล</p>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{reports.find(r => r.id === activeReport)?.name}</h2>
              {activeReport === 'sales' && (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="total_sales" stroke="#2563eb" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
              {activeReport === 'bestseller' && (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="title" width={200} />
                    <Tooltip />
                    <Bar dataKey="total_sold" fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              )}
              {activeReport === 'category' && (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie data={data} cx="50%" cy="50%" outerRadius={150} dataKey="total_sales" label>
                      {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {activeReport === 'customer' && (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">ชื่อลูกค้า</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">จำนวน Order</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">ยอดรวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.map((c, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium">{c.user_name}</td>
                        <td className="py-3 px-4 text-sm">{c.total_orders}</td>
                        <td className="py-3 px-4 text-sm">฿{Number(c.total_spent).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Reports;