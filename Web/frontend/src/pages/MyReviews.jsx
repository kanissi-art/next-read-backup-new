import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { reviewsAPI, ebooksAPI } from '../services/api';  // ✅ รวม import เป็นบรรทัดเดียว
import { useAuth } from '../context/AuthContext';
import { Star, BookOpen, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadReviews();
    }
  }, [user]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      // ดึง ebooks ทั้งหมด
      const ebooksRes = await ebooksAPI.getAll({ limit: 100 });
      const ebooks = ebooksRes.data.data || [];
      
      const allReviews = [];
      
      // ดึงรีวิวจากทุก ebook แล้ว filter เฉพาะของ user
      for (const ebook of ebooks) {
        try {
          const res = await reviewsAPI.getByEbook(ebook.id);
          const ebookReviews = res.data.data || [];
          const myReviews = ebookReviews.filter(r => r.user_id === user.id);
          allReviews.push(...myReviews.map(r => ({ 
            ...r, 
            ebook_title: ebook.title, 
            ebook_id: ebook.id 
          })));
        } catch (error) {
          // ข้าม ebook ที่ไม่มีรีวิว
        }
      }
      
      setReviews(allReviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      toast.error('ไม่สามารถโหลดรีวิวได้');
    } finally {
      setLoading(false);
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        รีวิวของฉัน ({reviews.length} รีวิว)
      </h1>

      {reviews.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-md">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">คุณยังไม่ได้เขียนรีวิว</h3>
          <p className="text-gray-600 mb-6">
            เลือกซื้อหนังสือและเขียนรีวิวเพื่อแบ่งปันความคิดเห็น!
          </p>
          <button
            onClick={() => navigate('/ebooks')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            เลือกซื้อหนังสือ
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Link
                    to={`/ebooks/${review.ebook_id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                  >
                    {review.ebook_title || 'หนังสือ'}
                  </Link>
                  <div className="flex items-center space-x-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < review.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">
                      {review.rating}/5
                    </span>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(review.created_at).toLocaleDateString('th-TH')}
                </span>
              </div>

              <p className="text-gray-700 mb-4">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReviews;