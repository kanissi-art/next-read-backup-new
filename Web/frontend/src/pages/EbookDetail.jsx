import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ebooksAPI, cartAPI, reviewsAPI, wishlistAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getCoverImageUrl, handleCoverImageError } from '../components/book/coverImage';
import { ShoppingCart, Heart, Star, BookOpen, User, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const EbookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoaded, setWishlistLoaded] = useState(false);
  const [wishlistSaving, setWishlistSaving] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const averageRating = reviews.length
    ? reviews.reduce((total, review) => total + (Number(review.rating) || 0), 0) / reviews.length
    : null;

  useEffect(() => {
    loadBook();
    loadReviews();
  }, [id]);

  useEffect(() => {
    if (!user) {
      setIsWishlisted(false);
      setWishlistLoaded(true);
      return;
    }

    let isCurrent = true;
    setWishlistLoaded(false);

    wishlistAPI.get()
      .then((response) => {
        const items = response.data.data || [];
        if (isCurrent) {
          setIsWishlisted(items.some((item) =>
            String(item.ebook_id ?? item.ebooks?.id) === String(id)
          ));
        }
      })
      .catch((error) => {
        console.error('Failed to load wishlist status:', error);
      })
      .finally(() => {
        if (isCurrent) setWishlistLoaded(true);
      });

    return () => {
      isCurrent = false;
    };
  }, [id, user]);

  const loadBook = async () => {
    try {
      const response = await ebooksAPI.getById(id);
      setBook(response.data.data);
    } catch (error) {
      console.error('Failed to load book:', error);
      toast.error('ไม่พบหนังสือ');
      navigate('/ebooks');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await reviewsAPI.getByEbook(id);
      setReviews(response.data.data || []);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบก่อน');
      navigate('/login');
      return;
    }

    try {
      await cartAPI.addItem({ ebook_id: book.id, quantity: 1 });
      toast.success('เพิ่มลงตะกร้าแล้ว!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'เพิ่มลงตะกร้าไม่สำเร็จ');
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบก่อนเพิ่มลง wishlist');
      navigate('/login');
      return;
    }

    setWishlistSaving(true);
    try {
      if (isWishlisted) {
        await wishlistAPI.remove(book.id);
        setIsWishlisted(false);
        toast.success('ลบออกจาก wishlist แล้ว');
      } else {
        await wishlistAPI.add(book.id);
        setIsWishlisted(true);
        toast.success('เพิ่มลง wishlist แล้ว');
      }
    } catch (error) {
      if (error.response?.data?.detail === 'Already in wishlist') {
        setIsWishlisted(true);
        toast.success('หนังสืออยู่ใน wishlist แล้ว');
      } else {
        toast.error(error.response?.data?.detail || 'บันทึก wishlist ไม่สำเร็จ');
      }
    } finally {
      setWishlistSaving(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบก่อนเขียนรีวิว');
      navigate('/login');
      return;
    }

    try {
      await reviewsAPI.create(id, reviewForm);
      toast.success('เขียนรีวิวสำเร็จ!');
      setReviewForm({ rating: 5, comment: '' });
      loadReviews();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'เขียนรีวิวไม่สำเร็จ');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">ไม่พบหนังสือ</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Book Detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Cover Image */}
        <div className="relative w-full max-w-sm mx-auto bg-gray-200">
          <img
            src={getCoverImageUrl(book.cover_url)}
            alt={book.title}
            className="w-full h-auto rounded-lg shadow-lg"
            onError={handleCoverImageError}
          />
        </div>

        {/* Book Info */}
        <div>
          <span className="text-sm text-primary-600 font-medium">
            {book.categories?.name}
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-4">
            {book.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-6">
            <div className="flex items-center space-x-1" aria-label={averageRating === null ? 'ยังไม่มีคะแนนรีวิว' : `คะแนนเฉลี่ย ${averageRating.toFixed(1)} จาก 5`}>
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
              <span className="text-lg font-medium">{averageRating === null ? '—' : averageRating.toFixed(1)}</span>
            </div>
            <span className="text-sm text-gray-500">
              {reviews.length > 0 ? `${reviews.length} รีวิว` : 'ยังไม่มีคะแนน'}
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600">โดย {book.authors?.name}</span>
          </div>

          <p className="text-gray-700 mb-6 leading-relaxed">
            {book.description}
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-2 text-gray-600">
              <BookOpen className="h-5 w-5" />
              <span>หมวดหมู่: {book.categories?.name}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <User className="h-5 w-5" />
              <span>ผู้แต่ง: {book.authors?.name}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="h-5 w-5" />
              <span>เพิ่มเมื่อ: {new Date(book.created_at).toLocaleDateString('th-TH')}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-3xl font-bold text-primary-600">
                ฿{book.price?.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500 ml-2">
                (คงเหลือ {book.stock} เล่ม)
              </span>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={book.stock === 0}
            className="w-full flex items-center justify-center space-x-2 bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-lg font-medium"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>{book.stock === 0 ? 'หมดสต็อก' : 'เพิ่มลงตะกร้า'}</span>
          </button>

          <button
            onClick={handleToggleWishlist}
            disabled={wishlistSaving || (user && !wishlistLoaded)}
            className={`w-full mt-3 flex items-center justify-center space-x-2 border py-3 px-6 rounded-lg transition-colors text-lg font-medium disabled:cursor-not-allowed ${
              isWishlisted
                ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
            <span>{isWishlisted ? 'อยู่ใน Wishlist' : 'เพิ่มใน Wishlist'}</span>
          </button>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="border-t pt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">รีวิวจากผู้อ่าน</h2>

        {/* Review Form */}
        {user && (
          <form onSubmit={handleSubmitReview} className="mb-8 bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">เขียนรีวิวของคุณ</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คะแนน
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    className={`text-2xl ${
                      star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ความคิดเห็น
              </label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="แบ่งปันความคิดเห็นของคุณเกี่ยวกับหนังสือเล่มนี้..."
                required
              />
            </div>
            <button
              type="submit"
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
            >
              ส่งรีวิว
            </button>
          </form>
        )}

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString('th-TH')}
                  </span>
                </div>
                <p className="text-gray-700">{review.comment}</p>
                <p className="text-sm text-gray-500 mt-2">
                  โดย {review.user?.name || 'ไม่ระบุชื่อ'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8">ยังไม่มีรีวิว เป็นคนแรกเลย!</p>
        )}
      </div>
    </div>
  );
};

export default EbookDetail;