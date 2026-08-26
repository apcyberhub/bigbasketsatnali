import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WishlistItem } from '../types';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlist: WishlistItem[];
  isLoading: boolean;
  itemCount: number;
  toggleWishlist: (productId: number) => Promise<{ inWishlist: boolean; message: string }>;
  isInWishlist: (productId: number) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist([]);
      return;
    }
    try {
      setIsLoading(true);
      const res = await apiClient.get('/wishlist');
      if (res.data.success) {
        setWishlist(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const toggleWishlist = async (productId: number) => {
    if (!isAuthenticated) {
      return { inWishlist: false, message: 'Please log in to manage your wishlist.' };
    }
    try {
      const res = await apiClient.post(`/wishlist/${productId}`);
      if (res.data.success) {
        await refreshWishlist();
        return {
          inWishlist: res.data.data.inWishlist,
          message: res.data.data.inWishlist ? 'Added to wishlist!' : 'Removed from wishlist!',
        };
      }
      return { inWishlist: false, message: 'Failed to update wishlist' };
    } catch (err: any) {
      return { inWishlist: false, message: 'Failed to update wishlist' };
    }
  };

  const isInWishlist = (productId: number): boolean => {
    return wishlist.some((item) => item.productId === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isLoading,
        itemCount: wishlist.length,
        toggleWishlist,
        isInWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
