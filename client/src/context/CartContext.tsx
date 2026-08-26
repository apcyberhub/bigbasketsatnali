import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartSummary, CartItem } from '../types';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';

interface AppliedCoupon {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  discountAmount: number;
  description?: string;
}

interface CartContextType {
  cart: CartSummary | null;
  isLoading: boolean;
  itemCount: number;
  appliedCoupon: AppliedCoupon | null;
  finalTotal: number;
  addItem: (productId: number, quantity?: number) => Promise<{ success: boolean; message: string }>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  refreshCart: () => Promise<void>;
  getItemQuantity: (productId: number) => number;
  getItemByProductId: (productId: number) => CartItem | undefined;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    try {
      setIsLoading(true);
      const res = await apiClient.get('/cart');
      if (res.data.success) {
        setCart(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = async (productId: number, quantity: number = 1) => {
    if (!isAuthenticated) {
      return { success: false, message: 'Please log in to add items to your cart.' };
    }
    try {
      const res = await apiClient.post('/cart/items', { productId, quantity });
      if (res.data.success) {
        setCart(res.data.data);
        return { success: true, message: 'Item added to cart!' };
      }
      return { success: false, message: res.data.message || 'Failed to add item.' };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to add item to cart.';
      return { success: false, message: msg };
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (!isAuthenticated) return;
    try {
      const res = await apiClient.put(`/cart/items/${itemId}`, { quantity });
      if (res.data.success) {
        setCart(res.data.data);
      }
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  const removeItem = async (itemId: number) => {
    if (!isAuthenticated) return;
    try {
      const res = await apiClient.delete(`/cart/items/${itemId}`);
      if (res.data.success) {
        setCart(res.data.data);
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;
    try {
      await apiClient.delete('/cart');
      setCart({
        id: 0,
        items: [],
        itemCount: 0,
        subtotal: 0,
        totalMrp: 0,
        savings: 0,
        deliveryFee: 0,
        tax: 0,
        total: 0,
      });
      setAppliedCoupon(null);
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  };

  const applyCoupon = async (code: string) => {
    if (!cart || cart.subtotal === 0) {
      return { success: false, message: 'Your cart is empty.' };
    }
    try {
      const res = await apiClient.post('/coupons/validate', {
        code,
        orderAmount: cart.subtotal,
      });
      if (res.data.success && res.data.data) {
        setAppliedCoupon(res.data.data);
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message || 'Invalid coupon' };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to apply coupon.';
      return { success: false, message: msg };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const getItemQuantity = (productId: number): number => {
    if (!cart || !cart.items) return 0;
    const item = cart.items.find((it) => it.productId === productId);
    return item ? item.quantity : 0;
  };

  const getItemByProductId = (productId: number): CartItem | undefined => {
    if (!cart || !cart.items) return undefined;
    return cart.items.find((it) => it.productId === productId);
  };

  const subtotal = cart?.subtotal || 0;
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const deliveryFee = subtotal >= 499 || appliedCoupon?.code === 'FREEDEL' || subtotal === 0 ? 0 : 40;
  const tax = +(subtotal * 0.05).toFixed(2);
  const finalTotal = Math.max(0, +(subtotal - couponDiscount + deliveryFee + tax).toFixed(2));

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        itemCount: cart?.itemCount || 0,
        appliedCoupon,
        finalTotal,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        refreshCart,
        getItemQuantity,
        getItemByProductId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
