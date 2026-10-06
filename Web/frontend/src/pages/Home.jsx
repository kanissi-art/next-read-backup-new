import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ebooksAPI } from '../services/api';
import BookCard from '../components/book/BookCard';
import { BookOpen, Users, Download, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

const heroSlides = [
  'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=2200&q=80',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=2200&q=80',
  'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=2200&q=80',
];

const Home = () => {
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    if (isPaused) return undefined;
    const intervalId = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % heroSlides.length);
    }, 6000);
    return () => window.clearInterval(intervalId);
  }, [isPaused]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [booksRes, categoriesRes] = await Promise.all([
        ebooksAPI.getAll({ limit: 8 }),
        ebooksAPI.getCategories(),
      ]);
      setFeaturedBooks(booksRes.data.data);
      setCategories(categoriesRes.data.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section role="region" aria-roledescription="carousel" aria-label="ภาพแนะนำร้านหนังสือ" className="relative isolate flex min-h-[400px] items-center overflow-hidden bg-slate-950 py-20 text-white sm:min-h-[460px]">
        <div className="absolute inset-0 z-0" aria-hidden="true">
          {heroSlides.map((slide, index) => (
            <img
              key={slide}
              src={slide}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out motion-reduce:transition-none ${index === activeSlide ? 'opacity-100' : 'opacity-0'}`}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
          ))}
        </div>
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-slate-950/30" aria-hidden="true" />

        <div className="relative z-20 mx-auto w-full max-w-7xl px-4 pb-10 text-center sm:px-6 sm:pb-8 lg:px-8">
          <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            ยินดีต้อนรับสู่ Nextread-Ebook-Strore
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-base leading-relaxed text-white/90 sm:text-lg lg:text-xl">
            ร้านหนังสืออิเล็กทรอนิกส์ชั้นนำ รวมหนังสือคุณภาพจากนักเขียนชั้นนำ
          </p>
          <Link
            to="/ebooks"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-7 py-3 font-semibold text-primary-700 shadow-lg transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 sm:px-8"
          >
            เลือกซื้อหนังสือ
          </Link>
        </div>

        <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 sm:bottom-5" aria-label="ควบคุมภาพสไลด์">
          <button
            type="button"
            onClick={() => setActiveSlide((activeSlide - 1 + heroSlides.length) % heroSlides.length)}
            aria-label="ภาพก่อนหน้า"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          {heroSlides.map((slide, index) => (
            <button
              key={slide}
              type="button"
              onClick={() => setActiveSlide(index)}
              aria-label={`แสดงภาพที่ ${index + 1}`}
              aria-current={index === activeSlide ? 'true' : undefined}
              className={`h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${index === activeSlide ? 'w-6 bg-white' : 'w-2.5 bg-white/60 hover:bg-white'}`}
            />
          ))}
          <button
            type="button"
            onClick={() => setIsPaused((paused) => !paused)}
            aria-label={isPaused ? 'เล่นภาพสไลด์' : 'หยุดภาพสไลด์'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setActiveSlide((activeSlide + 1) % heroSlides.length)}
            aria-label="ภาพถัดไป"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <BookOpen className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">หนังสือหลากหลาย</h3>
            <p className="text-gray-600">หนังสือทุกหมวดหมู่ พร้อมให้อ่านทันที</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Download className="h-12 w-12 text-secondary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">ดาวน์โหลดง่าย</h3>
            <p className="text-gray-600">ซื้อแล้วดาวน์โหลดได้ทันที ทุกที่ทุกเวลา</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">ราคาพิเศษ</h3>
            <p className="text-gray-600">ส่วนลดพิเศษสำหรับสมาชิก</p>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">หมวดหมู่หนังสือ</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.slice(0, 10).map((category) => (
              <Link
                key={category.id}
                to={`/ebooks?category=${category.id}`}
                className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center"
              >
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured Books */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">หนังสือแนะนำ</h2>
            <Link to="/ebooks" className="text-primary-600 hover:text-primary-700 font-medium">
              ดูทั้งหมด →
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredBooks.map((book) => (
                <BookCard key={book.id} book={book} titleMaxLength={25} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;