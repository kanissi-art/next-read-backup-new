import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { cartAPI } from '../services/api';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const cartRequestId = useRef(0);

  const loadCart = useCallback(async () => {
    const requestId = ++cartRequestId.current;
    const token = localStorage.getItem('token');
    if (!token) {
      if (requestId === cartRequestId.current) {
        setCart({ items: [], total: 0 });
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    console.log('🔄 Loading cart...');
    
    try {
      const response = await cartAPI.get();
      console.log('📦 Cart response:', response.data);
      
      const cartData = response.data.data || { items: [], total: 0 };
      if (requestId === cartRequestId.current) setCart(cartData);
      
      console.log('✅ Cart loaded:', cartData);
    } catch (error) {
      console.error('❌ Failed to load cart:', error);
      if (requestId === cartRequestId.current) setCart({ items: [], total: 0 });
    } finally {
      if (requestId === cartRequestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addItem = async (ebookId, quantity = 1) => {
    console.log('🛒 Adding item:', { ebookId, quantity });
    
    try {
      await cartAPI.addItem({ ebook_id: ebookId, quantity });
      console.log('✅ Item added to backend');
      
      toast.success('เพิ่มลงตะกร้าแล้ว!');
      
      // ✅ สำคัญ: โหลดตะกร้าใหม่ทันที
      await loadCart();
      console.log(' Cart reloaded after add');
    } catch (error) {
      console.error(' Add item error:', error);
      toast.error(error.response?.data?.detail || 'เพิ่มลงตะกร้าไม่สำเร็จ');
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 1) {
      await removeItem(itemId);
      return;
    }
    
    console.log('📝 Updating quantity:', { itemId, quantity });
    
    try {
      await cartAPI.updateItem(itemId, { quantity });
      console.log('✅ Quantity updated');
      
      toast.success('อัปเดตจำนวนแล้ว');
      await loadCart();
    } catch (error) {
      console.error('❌ Update error:', error);
      toast.error('อัปเดตจำนวนไม่สำเร็จ');
    }
  };

  const removeItem = async (itemId) => {
    console.log('️ Removing item:', itemId);
    
    try {
      await cartAPI.removeItem(itemId);
      console.log('✅ Item removed');
      
      toast.success('ลบสินค้าออกจากตะกร้าแล้ว');
      await loadCart();
    } catch (error) {
      console.error('❌ Remove error:', error);
      
      if (error.response?.status === 404) {
        toast.error('สินค้าไม่มีในระบบ');
        await loadCart(); // โหลดใหม่เพื่อ sync
      } else {
        toast.error('ลบสินค้าไม่สำเร็จ');
      }
    }
  };

  const clearCart = () => {
    cartRequestId.current += 1;
    setCart({ items: [], total: 0 });
    setLoading(false);
  };

  const cartCount = cart?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

  console.log(' Cart state:', { cart, cartCount });

  return (
    <CartContext.Provider value={{ 
      cart, 
      loading, 
      loadCart, 
      addItem, 
      updateQuantity, 
      removeItem, 
      clearCart, 
      cartCount 
    }}>
      {children}
    </CartContext.Provider>
  );
};