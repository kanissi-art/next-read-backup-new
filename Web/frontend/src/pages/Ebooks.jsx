import { useState, useEffect } from 'react';
import { ebooksAPI } from '../services/api';
import BookCard from '../components/book/BookCard';
import CategoryFilter from '../components/book/CategoryFilter';
import SearchBar from '../components/book/SearchBar';
import { BookOpen } from 'lucide-react';

const Ebooks = () => {
  const [ebooks, setEbooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadEbooks();
  }, [selectedCategory, search, page]);

  const loadCategories = async () => {
    try {
      const response = await ebooksAPI.getCategories();
      setCategories(response.data.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadEbooks = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 12,
      };
      if (selectedCategory) params.category_id = selectedCategory;
      if (search) params.search = search;

      const response = await ebooksAPI.getAll(params);
      setEbooks(response.data.data);
      // คำนวณ totalPages จากข้อมูลที่ได้ (สมมติ limit=12)
      setTotalPages(Math.ceil(response.data.data.length / 12) || 1);
    } catch (error) {
      console.error('Failed to load ebooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setPage(1);
  };

  const handleSearch = (searchText) => {
    setSearch(searchText);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">หนังสือทั้งหมด</h1>
        <p className="text-gray-600">ค้นพบหนังสืออิเล็กทรอนิกส์คุณภาพมากมาย</p>
      </div>

      {/* Search & Filter */}
      <div className="mb-8 space-y-4">
        <SearchBar value={search} onChange={handleSearch} />
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={handleCategorySelect}
        />
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Books Grid */}
          {ebooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {ebooks.map((book) => (
                <BookCard key={book.id} book={book} titleMaxLength={25} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบหนังสือ</h3>
              <p className="text-gray-600">ลองค้นหาด้วยคำอื่นหรือเปลี่ยนหมวดหมู่</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← ก่อนหน้า
              </button>
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPage(idx + 1)}
                  className={`px-4 py-2 rounded-lg ${
                    page === idx + 1
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ถัดไป →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Ebooks;