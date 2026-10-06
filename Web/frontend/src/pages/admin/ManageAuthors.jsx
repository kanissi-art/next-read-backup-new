import { useEffect, useState } from 'react';
import { Feather, Plus, Search, UserRound, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';

const ManageAuthors = () => {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingAuthorId, setDeletingAuthorId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ name: '', bio: '' });

  useEffect(() => {
    loadAuthors();
  }, []);

  const loadAuthors = async () => {
    try {
      const response = await api.get('/api/authors');
      setAuthors(response.data.data || []);
    } catch (error) {
      toast.error('โหลดรายชื่อผู้แต่งไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: formData.name.trim(),
      bio: formData.bio.trim() || null,
    };
    if (!payload.name) return;

    setSaving(true);
    try {
      const response = await api.post('/api/authors', payload);
      const author = response.data.data;
      setAuthors((currentAuthors) => [...currentAuthors, author].sort((left, right) =>
        left.name.localeCompare(right.name, 'th')
      ));
      setFormData({ name: '', bio: '' });
      toast.success('เพิ่มผู้แต่งแล้ว');
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(detail === 'Author already exists' ? 'มีชื่อผู้แต่งนี้อยู่แล้ว' : detail || 'เพิ่มผู้แต่งไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (author) => {
    if (!window.confirm(`ลบผู้แต่ง "${author.name}" หรือไม่?`)) return;

    setDeletingAuthorId(author.id);
    try {
      await api.delete(`/api/authors/${author.id}`);
      setAuthors((currentAuthors) => currentAuthors.filter((currentAuthor) => currentAuthor.id !== author.id));
      toast.success('ลบผู้แต่งแล้ว');
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(detail === 'Author is used by one or more books'
        ? 'ลบไม่ได้ เพราะมีหนังสืออ้างอิงผู้แต่งนี้อยู่'
        : detail || 'ลบผู้แต่งไม่สำเร็จ');
    } finally {
      setDeletingAuthorId(null);
    }
  };

  const filteredAuthors = authors.filter((author) =>
    author.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">CONTRIBUTORS</p>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">จัดการผู้แต่ง</h1>
          <p className="mt-1 text-sm text-slate-600">เพิ่มผู้แต่งเพื่อเลือกใช้ในข้อมูลหนังสือ</p>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)] lg:gap-6">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Plus className="h-5 w-5" /></span>
              <div>
                <h2 className="font-semibold text-slate-900">เพิ่มผู้แต่งใหม่</h2>
                <p className="text-xs text-slate-500">กรอกชื่อที่ต้องการเพิ่มในคลัง</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="author-name" className="mb-1.5 block text-sm font-medium text-slate-700">ชื่อผู้แต่ง <span className="text-rose-600">*</span></label>
                <input
                  id="author-name"
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  maxLength={100}
                  required
                  placeholder="เช่น นามปากกา หรือชื่อ-นามสกุล"
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label htmlFor="author-bio" className="mb-1.5 block text-sm font-medium text-slate-700">ประวัติผู้แต่ง <span className="font-normal text-slate-500">(ไม่บังคับ)</span></label>
                <textarea
                  id="author-bio"
                  value={formData.bio}
                  onChange={(event) => setFormData({ ...formData, bio: event.target.value })}
                  rows="4"
                  placeholder="ข้อมูลเกี่ยวกับผู้แต่ง"
                  className="w-full resize-y rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button type="submit" disabled={saving || !formData.name.trim()} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <Plus className="h-4 w-4" />{saving ? 'กำลังบันทึก...' : 'เพิ่มผู้แต่ง'}
              </button>
            </form>
          </section>

          <section className="min-w-0">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">รายชื่อผู้แต่ง</h2>
                <p className="text-sm text-slate-500">ทั้งหมด {authors.length} คน</p>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="search" aria-label="ค้นหาผู้แต่ง" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาผู้แต่ง" className="min-h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-40 items-center justify-center rounded-xl border border-slate-200 bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-b-blue-700" />
              </div>
            ) : filteredAuthors.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredAuthors.map((author) => (
                  <article key={author.id} className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"><UserRound className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-sm font-semibold text-slate-900">{author.name}</h3>
                      <p className="mt-1 line-clamp-3 text-sm leading-5 text-slate-600">{author.bio || 'ยังไม่มีประวัติผู้แต่ง'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(author)}
                      disabled={deletingAuthorId === author.id}
                      aria-label={`ลบผู้แต่ง ${author.name}`}
                      title="ลบผู้แต่ง"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 disabled:cursor-wait disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center">
                <Feather className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                <p className="text-sm text-slate-600">ไม่พบรายชื่อผู้แต่ง</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ManageAuthors;