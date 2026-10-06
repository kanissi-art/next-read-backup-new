import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    try {
      const res = await api.get('/api/categories');
      setCategories(res.data.data || []);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('คุณแน่ใจหรือ?')) return;
    try {
      await api.delete(`/api/admin/categories/${id}`);
      toast.success('ลบสำเร็จ');
      loadCategories();
    } catch (error) {
      toast.error('ลบไม่สำเร็จ');
    }
  };

  const handleEdit = (cat) => {
    setEditCategory(cat);
    setFormData({ name: cat.name || '', description: cat.description || '' });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditCategory(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editCategory) {
        await api.put(`/api/admin/categories/${editCategory.id}`, formData);
        toast.success('อัปเดตสำเร็จ');
      } else {
        await api.post('/api/admin/categories', formData);
        toast.success('สร้างสำเร็จ');
      }
      setShowModal(false);
      loadCategories();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'บันทึกไม่สำเร็จ');
    }
  };

  if (loading) return <AdminLayout><div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">จัดการหมวดหมู่</h1>
          <button onClick={handleAdd} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus className="h-5 w-5" /><span>เพิ่มหมวดหมู่</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">ชื่อหมวดหมู่</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{cat.id}</td>
                  <td className="py-3 px-4 text-sm font-medium">{cat.name}</td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex space-x-2">
                      <button onClick={() => handleEdit(cat)} className="text-blue-600 hover:text-blue-800"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:text-red-800"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{editCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}</h2>
                <button onClick={() => setShowModal(false)}><X className="h-6 w-6" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="ชื่อหมวดหมู่" required className="w-full px-4 py-2 border rounded" />
                <textarea name="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="คำอธิบาย" rows="3" className="w-full px-4 py-2 border rounded" />
                <div className="flex space-x-3">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">{editCategory ? 'อัปเดต' : 'สร้าง'}</button>
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300">ยกเลิก</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ManageCategories;