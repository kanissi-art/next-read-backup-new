import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { wishlistAPI, cartAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Heart, ShoppingCart, Trash2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadWishlist();
    }
  }, [user]);

  const loadWishlist = async () => {
    try {
      const response = await wishlistAPI.get();
      setWishlist(response.data.data || []);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
      toast.error('ไม่สามารถโหลด wishlist ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (ebookId) => {
    try {
      await wishlistAPI.remove(ebookId);
      toast.success('ลบออกจาก wishlist แล้ว');
      loadWishlist();
    } catch (error) {
      toast.error('ลบไม่สำเร็จ');
    }
  };

  const handleAddToCart = async (ebookId) => {
    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบก่อน');
      navigate('/login');
      return;
    }
    try {
      await cartAPI.addItem({ ebook_id: ebookId, quantity: 1 });
      toast.success('เพิ่มลงตะกร้าแล้ว!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'เพิ่มลงตะกร้าไม่สำเร็จ');
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">กรุณาเข้าสู่ระบบ</h2>
        <button
          onClick={() => navigate('/login')}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
        >
          เข้าสู่ระบบ
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        รายการที่ชอบ ({wishlist.length} เล่ม)
      </h1>

      {wishlist.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-md">
          <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีหนังสือที่ชอบ</h3>
          <p className="text-gray-600 mb-6">เพิ่มหนังสือที่คุณสนใจลงใน wishlist ได้เลย!</p>
          <button
            onClick={() => navigate('/ebooks')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            เลือกซื้อหนังสือ
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((item) => {
            // ✅ ดึงข้อมูลหนังสือจาก item.ebooks
            const ebook = item.ebooks;

            // ถ้าไม่มีข้อมูลหนังสือ (fallback)
            if (!ebook) {
              return (
                <div key={item.id} className="bg-white rounded-lg shadow-md p-4 text-center">
                  <p className="text-gray-500">ไม่สามารถโหลดข้อมูลหนังสือได้</p>
                  <button
                    onClick={() => handleRemove(item.ebook_id)}
                    className="mt-2 text-red-600 hover:text-red-800 text-sm"
                  >
                    ลบออก
                  </button>
                </div>
              );
            }

            return (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Cover Image */}
                <Link to={`/ebooks/${ebook.id}`} className="block">
                  <div className="relative h-64 bg-gray-200 overflow-hidden">
                    <img
                      src={ebook.cover_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop'}
                      alt={ebook.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop';
                      }}
                    />
                  </div>
                </Link>

                {/* Book Info */}
                <div className="p-4">
                  <Link to={`/ebooks/${ebook.id}`}>
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 hover:text-primary-600">
                      {ebook.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">
                    โดย {ebook.authors?.name || 'ไม่ระบุ'}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xl font-bold text-primary-600">
                      ฿{Number(ebook.price).toLocaleString()}
                    </span>
                    {ebook.stock === 0 && (
                      <span className="text-xs text-red-600 font-medium">หมดสต็อก</span>
                    )}
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={() => handleAddToCart(ebook.id)}
                      disabled={ebook.stock === 0}
                      className="flex-1 flex items-center justify-center space-x-1 bg-primary-600 text-white py-2 px-3 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>เพิ่มลงตะกร้า</span>
                    </button>
                    <button
                      onClick={() => handleRemove(ebook.id)}
                      className="flex items-center justify-center bg-red-100 text-red-600 py-2 px-3 rounded-lg hover:bg-red-200"
                      title="ลบออกจาก wishlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;