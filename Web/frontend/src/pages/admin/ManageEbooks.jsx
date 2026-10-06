import { useState, useEffect } from 'react';
import AdminLayout from "../../components/admin/AdminLayout";
import api from '../../services/api';
import { Plus, Edit, Trash2, Search, X, Upload, Save, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCoverImageUrl, handleCoverImageError } from '../../components/book/coverImage';

const ManageEbooks = () => {
  const [ebooks, setEbooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [updatingEbookId, setUpdatingEbookId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editEbook, setEditEbook] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '', author_id: '', category_id: '', price: '', stock: '',
    description: '', cover_url: '', download_url: '', is_active: true,
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [ebooksRes, authorsRes, categoriesRes] = await Promise.all([
        api.get('/api/admin/ebooks'),
        api.get('/api/authors'),
        api.get('/api/categories'),
      ]);
      setEbooks(ebooksRes.data.data || []);
      setAuthors(authorsRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (ebook) => {
    if (!confirm(`นำ "${ebook.title}" ออกจากรายการหนังสือที่เปิดขายหรือไม่?`)) return;
    setUpdatingEbookId(ebook.id);
    try {
      await api.delete(`/api/admin/ebooks/${ebook.id}`);
      setEbooks((currentEbooks) => currentEbooks.map((currentEbook) =>
        currentEbook.id === ebook.id ? { ...currentEbook, is_active: false } : currentEbook
      ));
      toast.success('นำหนังสือออกจากรายการที่เปิดขายแล้ว');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'นำหนังสือออกไม่สำเร็จ');
    } finally {
      setUpdatingEbookId(null);
    }
  };

  const handleRestore = async (ebook) => {
    setUpdatingEbookId(ebook.id);
    try {
      await api.put(`/api/admin/ebooks/${ebook.id}`, { is_active: true });
      setEbooks((currentEbooks) => currentEbooks.map((currentEbook) =>
        currentEbook.id === ebook.id ? { ...currentEbook, is_active: true } : currentEbook
      ));
      toast.success('เปิดขายหนังสืออีกครั้งแล้ว');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'กู้คืนหนังสือไม่สำเร็จ');
    } finally {
      setUpdatingEbookId(null);
    }
  };

  const handleEdit = (ebook) => {
    setEditEbook(ebook);
    setCoverFile(null);
    setFormData({
      title: ebook.title || '',
      author_id: ebook.author_id || ebook.authors?.id || '',
      category_id: ebook.category_id || ebook.categories?.id || '',
      price: ebook.price || '',
      stock: ebook.stock || '',
      description: ebook.description || '',
      cover_url: ebook.cover_url || '',
      download_url: ebook.download_url || '',
      is_active: ebook.is_active !== false,
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditEbook(null);
    setCoverFile(null);
    setFormData({ title: '', author_id: '', category_id: '', price: '', stock: '', description: '', cover_url: '', download_url: '', is_active: true });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      author_id: parseInt(formData.author_id),
      category_id: parseInt(formData.category_id),
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
    };

    setSaving(true);
    try {
      if (coverFile) {
        const uploadData = new FormData();
        uploadData.append('file', coverFile);
        const uploadResponse = await api.post('/api/admin/upload-cover', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        payload.cover_url = uploadResponse.data.data.cover_url;
      }

      if (editEbook) {
        await api.put(`/api/admin/ebooks/${editEbook.id}`, payload);
        toast.success('อัปเดตหนังสือสำเร็จ');
      } else {
        await api.post('/api/admin/ebooks', payload);
        toast.success('สร้างหนังสือสำเร็จ');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleCoverFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error('ไฟล์รูปต้องมีขนาดไม่เกิน 5 MB');
      e.target.value = '';
      setCoverFile(null);
      return;
    }
    setCoverFile(file);
  };

  const closeModal = () => {
    setShowModal(false);
    setCoverFile(null);
  };

  const filteredEbooks = ebooks.filter((ebook) =>
    (statusFilter === 'all' || (statusFilter === 'active' ? ebook.is_active !== false : ebook.is_active === false)) &&
    (ebook.title?.toLowerCase().includes(search.toLowerCase()) ||
    ebook.authors?.name?.toLowerCase().includes(search.toLowerCase()))
  );
  const activeEbookCount = ebooks.filter((ebook) => ebook.is_active !== false).length;
  const inactiveEbookCount = ebooks.length - activeEbookCount;

  if (loading) return <AdminLayout><div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">CATALOG</p>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">จัดการหนังสือ</h1>
              <span className="text-sm text-slate-500">{ebooks.length} รายการ · เปิดใช้งาน {activeEbookCount}</span>
            </div>
          </div>
          <button onClick={handleAdd} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:w-auto">
            <Plus className="h-5 w-5" /><span>เพิ่มหนังสือ</span>
          </button>
        </div>

        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาชื่อหนังสือหรือผู้แต่ง" aria-label="ค้นหาหนังสือ" className="min-h-12 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="กรองหนังสือตามสถานะ">
          {[
            { value: 'active', label: `กำลังขาย ${activeEbookCount}` },
            { value: 'inactive', label: `ปิดขาย ${inactiveEbookCount}` },
            { value: 'all', label: `ทั้งหมด ${ebooks.length}` },
          ].map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={statusFilter === filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`min-h-10 rounded-lg border px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${statusFilter === filter.value ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">ชื่อหนังสือ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">ผู้แต่ง</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">หมวดหมู่</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">ราคา</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">สต็อก</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">สถานะ</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEbooks.map((ebook) => (
                  <tr key={ebook.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="max-w-[280px] px-4 py-3.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <img src={getCoverImageUrl(ebook.cover_url)} alt="" onError={handleCoverImageError} className="h-12 w-9 shrink-0 rounded border border-slate-200 bg-slate-100 object-cover" />
                        <span className="line-clamp-2 text-sm font-semibold text-slate-900">{ebook.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{ebook.authors?.name || '-'}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{ebook.categories?.name || '-'}</td>
                    <td className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-slate-900">฿{Number(ebook.price).toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-center text-sm tabular-nums text-slate-700">{ebook.stock}</td>
                    <td className="px-4 py-3.5 text-sm">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${ebook.is_active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${ebook.is_active !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {ebook.is_active !== false ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEdit(ebook)} aria-label={`แก้ไข ${ebook.title}`} title="แก้ไขหนังสือ" className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"><Edit className="h-4 w-4" /></button>
                        {ebook.is_active !== false ? (
                          <button onClick={() => handleDelete(ebook)} disabled={updatingEbookId === ebook.id} aria-label={`นำ ${ebook.title} ออกจากรายการขาย`} title="นำออกจากรายการขาย" className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
                        ) : (
                          <button onClick={() => handleRestore(ebook)} disabled={updatingEbookId === ebook.id} aria-label={`เปิดขาย ${ebook.title} อีกครั้ง`} title="เปิดขายอีกครั้ง" className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-50"><RotateCcw className="h-4 w-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEbooks.length === 0 && (
                  <tr><td colSpan="7" className="px-4 py-14 text-center text-sm text-slate-500">ไม่พบหนังสือที่ตรงกับคำค้นหา</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-3 lg:hidden">
          {filteredEbooks.map((ebook) => (
            <article key={ebook.id} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <img src={getCoverImageUrl(ebook.cover_url)} alt="" onError={handleCoverImageError} className="h-24 w-16 shrink-0 rounded-md border border-slate-200 bg-slate-100 object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="break-words text-sm font-semibold leading-5 text-slate-900">{ebook.title}</h2>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${ebook.is_active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {ebook.is_active !== false ? 'เปิด' : 'ปิด'}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-slate-500">{ebook.authors?.name || 'ไม่ระบุผู้แต่ง'} · {ebook.categories?.name || 'ไม่ระบุหมวดหมู่'}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-semibold tabular-nums text-slate-900">฿{Number(ebook.price).toLocaleString()}</span>
                  <span className="text-xs text-slate-500">คงเหลือ {ebook.stock}</span>
                </div>
                <div className="mt-2 flex justify-end gap-1 border-t border-slate-100 pt-2">
                  <button onClick={() => handleEdit(ebook)} aria-label={`แก้ไข ${ebook.title}`} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-blue-50 hover:text-blue-700"><Edit className="h-4 w-4" /></button>
                  {ebook.is_active !== false ? (
                    <button onClick={() => handleDelete(ebook)} disabled={updatingEbookId === ebook.id} aria-label={`นำ ${ebook.title} ออกจากรายการขาย`} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
                  ) : (
                    <button onClick={() => handleRestore(ebook)} disabled={updatingEbookId === ebook.id} aria-label={`เปิดขาย ${ebook.title} อีกครั้ง`} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"><RotateCcw className="h-4 w-4" /></button>
                  )}
                </div>
              </div>
            </article>
          ))}
          {filteredEbooks.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-sm text-slate-500">ไม่พบหนังสือที่ตรงกับคำค้นหา</p>}
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="ebook-dialog-title" className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-xl">
              <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">หนังสือ</p>
                  <h2 id="ebook-dialog-title" className="mt-0.5 text-lg font-bold text-slate-900 sm:text-xl">{editEbook ? 'แก้ไขข้อมูลหนังสือ' : 'เพิ่มหนังสือใหม่'}</h2>
                </div>
                <button type="button" onClick={closeModal} aria-label="ปิดหน้าต่าง" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:space-y-5 sm:px-6">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="ebook-title">ชื่อหนังสือ <span className="text-rose-600">*</span></label>
                    <input id="ebook-title" type="text" name="title" value={formData.title} onChange={handleChange} required className="min-h-11 w-full rounded-lg border border-slate-300 px-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="ebook-author">ผู้แต่ง <span className="text-rose-600">*</span></label>
                      <select id="ebook-author" name="author_id" value={formData.author_id} onChange={handleChange} required className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
                      <option value="">เลือกผู้แต่ง</option>
                      {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="ebook-category">หมวดหมู่ <span className="text-rose-600">*</span></label>
                      <select id="ebook-category" name="category_id" value={formData.category_id} onChange={handleChange} required className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
                      <option value="">เลือกหมวดหมู่</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="ebook-price">ราคา (บาท) <span className="text-rose-600">*</span></label>
                      <input id="ebook-price" type="number" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" inputMode="decimal" className="min-h-11 w-full rounded-lg border border-slate-300 px-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="ebook-stock">จำนวนสต็อก <span className="text-rose-600">*</span></label>
                      <input id="ebook-stock" type="number" name="stock" value={formData.stock} onChange={handleChange} required min="0" inputMode="numeric" className="min-h-11 w-full rounded-lg border border-slate-300 px-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="ebook-cover">รูปปก <span className="font-normal text-slate-500">PNG/JPEG ไม่เกิน 5 MB</span></label>
                    <label htmlFor="ebook-cover" className="flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3.5 py-3 transition hover:border-blue-400 hover:bg-blue-50/50">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm"><Upload className="h-5 w-5" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">{coverFile?.name || 'เลือกรูปจากอุปกรณ์'}</span>
                        <span className="block text-xs text-slate-500">{coverFile ? 'เลือกไฟล์อื่นเพื่อเปลี่ยนรูป' : 'เลือกไฟล์ PNG หรือ JPEG'}</span>
                      </span>
                      <span className="shrink-0 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">เลือกไฟล์</span>
                    </label>
                    <input id="ebook-cover" type="file" accept="image/png,image/jpeg" onChange={handleCoverFileChange} className="sr-only" />
                    <label className="mb-1.5 mt-3 block text-sm font-medium text-slate-700" htmlFor="ebook-cover-url">หรือใส่ URL รูปปก</label>
                    <input id="ebook-cover-url" type="url" name="cover_url" value={formData.cover_url} onChange={handleChange} placeholder="https://..." className="min-h-11 w-full rounded-lg border border-slate-300 px-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="ebook-download">URL ไฟล์ดาวน์โหลด</label>
                    <input id="ebook-download" type="url" name="download_url" value={formData.download_url} onChange={handleChange} placeholder="https://..." className="min-h-11 w-full rounded-lg border border-slate-300 px-3.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="ebook-description">คำอธิบาย</label>
                    <textarea id="ebook-description" name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full resize-y rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
                  </div>
                  <label htmlFor="is_active" className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3.5 py-3">
                    <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600" />
                    <span className="text-sm font-medium text-slate-700">{formData.is_active ? 'เปิดใช้งานและแสดงในหน้าร้าน' : 'ปิดใช้งานและซ่อนจากหน้าร้าน'}</span>
                  </label>
                </div>
                <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:justify-end sm:px-6 sm:py-4">
                  <button type="button" onClick={closeModal} className="min-h-11 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400">ยกเลิก</button>
                  <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
                    <Save className="h-4 w-4" />{saving ? 'กำลังบันทึก...' : editEbook ? 'บันทึกการแก้ไข' : 'สร้างหนังสือ'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ManageEbooks;