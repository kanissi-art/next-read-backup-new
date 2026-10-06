import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BookOpen, ShoppingCart, Users, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, totalUsers: 0, totalEbooks: 0 });
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [ordersRes, usersRes, ebooksRes, salesRes, categoryRes, allCategoriesRes] = await Promise.all([
          api.get('/api/admin/orders').catch(() => ({ data: { data: [] } })),
          api.get('/api/admin/users').catch(() => ({ data: { data: [] } })),
          api.get('/api/admin/ebooks').catch(() => ({ data: { data: [] } })),
          api.get('/api/admin/reports/sales-by-time').catch(() => ({ data: { data: [] } })),
          api.get('/api/admin/reports/sales-by-category').catch(() => ({ data: { data: [] } })),
          api.get('/api/admin/categories').catch(() => ({ data: { data: [] } })),
        ]);

        const orders = ordersRes.data.data || [];
        const users = usersRes.data.data || [];
        const ebooks = ebooksRes.data.data || [];
        const sales = salesRes.data.data || [];
        const categorySales = new Map(
          (categoryRes.data.data || []).map(category => [category.category_name, Number(category.total_sales) || 0])
        );
        const allCategories = allCategoriesRes.data.data || [];
        const categoryNames = new Map(allCategories.map(category => [category.name, true]));
        categorySales.forEach((value, name) => categoryNames.set(name, true));

        const totalRevenue = orders.reduce((sum, order) => {
          const payments = Array.isArray(order.payments)
            ? order.payments
            : [order.payments].filter(Boolean);
          if (order.status !== 'confirmed' || !payments.some(payment => payment.status === 'verified')) return sum;
          return sum + Number(order.total_amount || 0);
        }, 0);

        setStats({
          totalOrders: orders.length,
          totalRevenue,
          totalUsers: users.length,
          totalEbooks: ebooks.length,
        });

        setSalesData(sales.map(s => ({ month: s.month, sales: Number(s.total_sales) })).reverse());
        setCategoryData([...categoryNames.keys()].map(name => ({
          name,
          value: categorySales.get(name) || 0,
        })));
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        toast.error('ไม่สามารถโหลดข้อมูล Dashboard ได้');
      } finally {
        setLoading(false);
      }
    };

    void loadDashboardData();
  }, []);

  const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
  const pieData = categoryData.filter(category => category.value > 0);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="คำสั่งซื้อทั้งหมด" value={stats.totalOrders} icon={ShoppingCart} color="text-blue-600" bg="bg-blue-100" />
          <StatCard title="ยอดชำระที่ยืนยันแล้ว" value={`฿${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} color="text-green-600" bg="bg-green-100" />
          <StatCard title="จำนวนลูกค้า" value={stats.totalUsers} icon={Users} color="text-purple-600" bg="bg-purple-100" />
          <StatCard title="จำนวนหนังสือ" value={stats.totalEbooks} icon={BookOpen} color="text-orange-600" bg="bg-orange-100" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ยอดขายรายเดือน</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `฿${Number(value).toLocaleString()}`} />
                <Bar dataKey="sales" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ยอดขายตามหมวดหมู่</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} cx="38%" cy="50%" outerRadius={105} dataKey="value" nameKey="name">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`฿${Number(value).toLocaleString()}`, name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-gray-500">
                ไม่มีข้อมูลยอดขายตามหมวดหมู่
              </div>
            )}
            <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-gray-700 sm:text-sm">
              {categoryData.map((category, index) => (
                <li key={category.name} className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="min-w-0 truncate" title={category.name}>{category.name}</span>
                  <span className="ml-auto shrink-0 text-gray-500">฿{category.value.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

const StatCard = ({ title, value, icon: Icon, color, bg }) => (
  <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
    <div className={`p-3 rounded-full ${bg}`}>
      <Icon className={`h-8 w-8 ${color}`} />
    </div>
  </div>
);

export default Dashboard;