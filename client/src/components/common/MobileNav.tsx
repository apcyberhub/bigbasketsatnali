import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingCart, Heart, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

export const MobileNav: React.FC = () => {
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { isAuthenticated } = useAuth();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 py-1.5 px-3 flex items-center justify-around shadow-lg">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            isActive ? 'text-brand-red font-bold' : 'text-slate-500 hover:text-slate-900'
          }`
        }
      >
        <Home className="w-5 h-5" />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/products"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            isActive ? 'text-brand-red font-bold' : 'text-slate-500 hover:text-slate-900'
          }`
        }
      >
        <LayoutGrid className="w-5 h-5" />
        <span>Catalog</span>
      </NavLink>

      <NavLink
        to="/wishlist"
        className={({ isActive }) =>
          `relative flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            isActive ? 'text-brand-red font-bold' : 'text-slate-500 hover:text-slate-900'
          }`
        }
      >
        <div className="relative">
          <Heart className="w-5 h-5" />
          {wishlistCount > 0 && (
            <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-brand-red text-white text-[8px] font-bold rounded-full flex items-center justify-center">
              {wishlistCount}
            </span>
          )}
        </div>
        <span>Wishlist</span>
      </NavLink>

      <NavLink
        to="/cart"
        className={({ isActive }) =>
          `relative flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            isActive ? 'text-brand-red font-bold' : 'text-slate-500 hover:text-slate-900'
          }`
        }
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-brand-red text-white text-[8px] font-bold rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </div>
        <span>Cart</span>
      </NavLink>

      <NavLink
        to={isAuthenticated ? '/account' : '/login'}
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
            isActive ? 'text-brand-red font-bold' : 'text-slate-500 hover:text-slate-900'
          }`
        }
      >
        <User className="w-5 h-5" />
        <span>{isAuthenticated ? 'Account' : 'Login'}</span>
      </NavLink>
    </div>
  );
};
