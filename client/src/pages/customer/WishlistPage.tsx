import React from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { ProductCard } from '../../components/common/ProductCard';
import { EmptyState } from '../../components/common/EmptyState';

export const WishlistPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { wishlist, isLoading } = useWishlist();

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <EmptyState
          title="Please login to view your saved items"
          description="Sign in to your Big Basket account to access your personal wishlist and favorites."
          actionText="Login to Continue"
          actionLink="/login"
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-500">Loading your saved groceries...</p>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <EmptyState
          icon={<Heart className="w-8 h-8 text-brand-red" />}
          title="Your wishlist is empty"
          description="Save your favorite grocery items and pantry essentials here to buy them quickly later."
          actionText="Discover Groceries"
          actionLink="/products"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-xl font-extrabold text-slate-900">My Wishlist</h1>
        <p className="text-xs text-slate-500">
          {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved in your favorites
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {wishlist.map((item) => (
          <ProductCard key={item.id} product={item.product} />
        ))}
      </div>
    </div>
  );
};
