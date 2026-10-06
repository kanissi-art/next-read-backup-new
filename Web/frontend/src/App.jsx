import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Contexts
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Common Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

// Customer Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Ebooks from './pages/Ebooks';
import EbookDetail from './pages/EbookDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import OrderHistory from './pages/OrderHistory';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import MyReviews from './pages/MyReviews';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import ManageEbooks from './pages/admin/ManageEbooks';
import ManageCategories from './pages/admin/ManageCategories'; // สร้างไว้ล่วงหน้า
import ManageAuthors from './pages/admin/ManageAuthors';
import ManageOrders from './pages/admin/ManageOrders';
import ManageUsers from './pages/admin/ManageUsers';
import Reports from './pages/admin/Reports';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          
          <Routes>
            {/* 1. Public Routes (ไม่มี Navbar/Footer) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* 2. Admin Routes (ใช้ Layout ของตัวเอง ไม่มี Navbar/Footer ของลูกค้า) */}
            <Route path="/admin" element={<ProtectedRoute adminOnly={true}><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/ebooks" element={<ProtectedRoute adminOnly={true}><ManageEbooks /></ProtectedRoute>} />
            <Route path="/admin/categories" element={<ProtectedRoute adminOnly={true}><ManageCategories /></ProtectedRoute>} />
            <Route path="/admin/authors" element={<ProtectedRoute adminOnly={true}><ManageAuthors /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute adminOnly={true}><ManageOrders /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute adminOnly={true}><ManageUsers /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute adminOnly={true}><Reports /></ProtectedRoute>} />

            {/* 3. Customer Routes (มี Navbar และ Footer) */}
            <Route
              path="/*"
              element={
                <div className="flex flex-col min-h-screen">
                  <Navbar />
                  <main className="flex-grow">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/ebooks" element={<Ebooks />} />
                      <Route path="/ebooks/:id" element={<EbookDetail />} />
                      
                      {/* Protected Customer Routes */}
                      <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                      <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
                      <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                      <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                      <Route path="/my-reviews" element={<ProtectedRoute><MyReviews /></ProtectedRoute>} />
                      
                      {/* Fallback for unknown customer routes */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              }
            />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;