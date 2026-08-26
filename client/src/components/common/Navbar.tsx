import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Heart,
  User as UserIcon,
  MapPin,
  Clock,
  Phone,
  ChevronDown,
  LogOut,
  Package,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { apiClient } from '../../api/client';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount, cart } = useCart();
  const { itemCount: wishlistCount } = useWishlist();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ products: any[]; categories: any[] }>({
    products: [],
    categories: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Debounced search suggestions
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions({ products: [], categories: [] });
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await apiClient.get(`/products/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
        if (res.data.success) {
          setSuggestions(res.data.data);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error('Search suggestion error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setIsAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navCategories = [
    { name: 'All Products', path: '/products' },
    { name: 'Fruits & Veg', path: '/category/fruits-vegetables' },
    { name: 'Dairy & Bakery', path: '/category/dairy-bakery' },
    { name: 'Atta, Rice & Dal', path: '/category/atta-rice-dal' },
    { name: 'Oil & Ghee', path: '/category/oil-ghee' },
    { name: 'Masalas & Spices', path: '/category/masalas-spices' },
    { name: 'Beverages', path: '/category/beverages' },
    { name: 'Snacks', path: '/category/snacks-munchies' },
    { name: 'Personal Care', path: '/category/personal-care' },
    { name: 'Cleaning', path: '/category/household-cleaning' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200/80">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-slate-900 text-slate-300 text-[12px] py-1.5 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1 text-slate-200">
              <MapPin className="w-3.5 h-3.5 text-brand-red" />
              <span>Delivering to: <strong className="text-white">Indore, MP (Main Market)</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>⚡ Express 15-Min Delivery</span>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <a href="tel:+919876543210" className="flex items-center gap-1 hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Helpline: +91 98765 43210</span>
            </a>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400 font-medium">Use code <strong>WELCOME20</strong> for 20% OFF!</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <BrandLogo size="md" showTagline />
        </div>

        {/* Global Search Bar with Live Suggestions Dropdown */}
        <div ref={searchRef} className="relative flex-1 max-w-2xl mx-2 sm:mx-6 hidden sm:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <label htmlFor="global-search-input" className="sr-only">
              Search grocery products, brands, and categories
            </label>
            <input
              id="global-search-input"
              name="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.products.length > 0 || suggestions.categories.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              placeholder='Search for "Milk", "Atta", "Onions", "Fortune Oil", "Maggi"...'
              className="w-full pl-11 pr-24 py-2.5 bg-slate-50 border border-slate-300 rounded-full text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 transition-all outline-none"
              autoComplete="off"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-brand-red hover:bg-brand-red-dark text-white text-xs font-semibold rounded-full shadow-sm transition-all"
            >
              Search
            </button>
          </form>

          {/* Search Autocomplete Suggestions Dropdown */}
          {showSuggestions && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-elevated overflow-hidden z-50 animate-in fade-in duration-150">
              {isSearching && (
                <div className="p-4 text-xs text-slate-500 text-center flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
                  Searching products...
                </div>
              )}

              {!isSearching && suggestions.categories.length > 0 && (
                <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                  <div className="text-[11px] font-bold text-slate-400 uppercase px-2 mb-1">Categories</div>
                  <div className="flex flex-wrap gap-1.5 px-2">
                    {suggestions.categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setShowSuggestions(false);
                          navigate(`/category/${cat.slug}`);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-brand-red-light hover:text-brand-red border border-slate-200 rounded-md text-xs font-medium text-slate-700 transition-colors"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!isSearching && suggestions.products.length > 0 && (
                <div className="py-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase px-3 py-1">Products</div>
                  {suggestions.products.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => {
                        setShowSuggestions(false);
                        navigate(`/products/${prod.slug}`);
                      }}
                      className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50 text-left transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.mainImage ? `/${prod.mainImage}` : '/assets/logo.png'}
                          alt={prod.name}
                          className="w-9 h-9 object-contain rounded border border-slate-100 bg-white"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/logo.png';
                          }}
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-800 line-clamp-1">{prod.name}</p>
                          <p className="text-[11px] text-slate-400">{prod.brand} • {prod.unit}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-brand-red">₹{prod.price}</span>
                        {prod.mrp > prod.price && (
                          <span className="text-[10px] text-slate-400 line-through block">₹{prod.mrp}</span>
                        )}
                      </div>
                    </button>
                  ))}
                  <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSuggestions(false);
                        navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
                      }}
                      className="text-xs font-semibold text-brand-red hover:underline"
                    >
                      View all results for &quot;{searchQuery}&quot; &rarr;
                    </button>
                  </div>
                </div>
              )}

              {!isSearching && suggestions.products.length === 0 && suggestions.categories.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500">
                  No grocery items found matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Actions: Wishlist, Cart, Account */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Wishlist Icon */}
          <Link
            to="/wishlist"
            className="relative p-2 text-slate-700 hover:text-brand-red hover:bg-slate-50 rounded-full transition-colors"
            title="My Wishlist"
            aria-label="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-red text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Icon & Subtotal Button */}
          <Link
            to="/cart"
            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200/80 px-3.5 py-1.5 rounded-full transition-all duration-200 font-semibold text-xs shadow-sm group"
            title="Shopping Cart"
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-brand-red text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">
              {cart && cart.subtotal > 0 ? `₹${cart.subtotal}` : 'My Cart'}
            </span>
          </Link>

          {/* Account Dropdown */}
          <div ref={accountRef} className="relative">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => setIsAccountOpen(!isAccountOpen)}
                className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 text-slate-700 hover:bg-slate-100 rounded-full border border-slate-200 text-xs font-semibold transition-colors"
                aria-expanded={isAccountOpen}
              >
                <div className="w-6 h-6 bg-brand-red text-white rounded-full flex items-center justify-center text-xs font-bold uppercase">
                  {user?.name.charAt(0)}
                </div>
                <span className="hidden md:inline max-w-[90px] truncate">{user?.name.split(' ')[0]}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-full shadow-sm transition-all"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Login</span>
              </Link>
            )}

            {/* Account Menu Popup */}
            {isAccountOpen && isAuthenticated && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-elevated py-1.5 z-50 animate-in fade-in duration-150">
                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  {isAdmin && (
                    <span className="inline-block mt-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      Admin Access
                    </span>
                  )}
                </div>

                <div className="py-1">
                  <Link
                    to="/account/profile"
                    onClick={() => setIsAccountOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-brand-red transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/orders"
                    onClick={() => setIsAccountOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-brand-red transition-colors"
                  >
                    <Package className="w-4 h-4 text-slate-400" />
                    <span>My Orders</span>
                  </Link>

                  <Link
                    to="/account/addresses"
                    onClick={() => setIsAccountOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-brand-red transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>Saved Addresses</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-emerald-700 font-semibold hover:bg-emerald-50 transition-colors border-t border-slate-100"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountOpen(false);
                      logout();
                      navigate('/');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. CATEGORY NAVIGATION MEGA-BAR */}
      <nav className="bg-slate-50 border-t border-slate-200/80 hidden md:block overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 py-1.5">
          {navCategories.map((cat) => (
            <Link
              key={cat.path}
              to={cat.path}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-brand-red hover:bg-white rounded-md transition-colors whitespace-nowrap"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* 4. MOBILE SLIDE-OUT MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groceries..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </form>
          <div className="grid grid-cols-2 gap-1.5 pt-2">
            {navCategories.map((cat) => (
              <Link
                key={cat.path}
                to={cat.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
