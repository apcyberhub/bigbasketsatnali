import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, Minus, Star, ShoppingBag, Clock } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

interface ProductCardProps {
  product: Product;
  onAddedToCart?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { getItemQuantity, getItemByProductId, addItem, updateQuantity, removeItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [isUpdating, setIsUpdating] = useState(false);
  const inWishlist = isInWishlist(product.id);
  const quantity = getItemQuantity(product.id);
  const cartItem = getItemByProductId(product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUpdating) return;
    setIsUpdating(true);
    await addItem(product.id, 1);
    setIsUpdating(false);
  };

  const handleIncrement = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUpdating || !cartItem) return;
    if (quantity >= product.stock) return;
    setIsUpdating(true);
    await updateQuantity(cartItem.id, quantity + 1);
    setIsUpdating(false);
  };

  const handleDecrement = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUpdating || !cartItem) return;
    setIsUpdating(true);
    if (quantity <= 1) {
      await removeItem(cartItem.id);
    } else {
      await updateQuantity(cartItem.id, quantity - 1);
    }
    setIsUpdating(false);
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(product.id);
  };

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="card group relative flex flex-col justify-between overflow-hidden bg-white p-3 sm:p-4 hover:border-brand-red/40">
      {/* 1. TOP BADGES & WISHLIST */}
      <div className="relative">
        <div className="flex items-center justify-between gap-1 z-10">
          {product.discount > 0 ? (
            <span className="badge-discount">{Math.round(product.discount)}% OFF</span>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium">{product.unit}</span>
          )}

          <button
            type="button"
            onClick={handleToggleWishlist}
            className={`p-1.5 rounded-full transition-all duration-200 ${
              inWishlist
                ? 'text-brand-red bg-red-50'
                : 'text-slate-400 hover:text-brand-red hover:bg-slate-50'
            }`}
            title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            aria-label="Wishlist"
          >
            <Heart className={`w-4 h-4 ${inWishlist ? 'fill-brand-red' : ''}`} />
          </button>
        </div>

        {/* 2. PRODUCT IMAGE */}
        <Link
          to={`/products/${product.slug}`}
          className="block my-2.5 aspect-square overflow-hidden rounded-lg bg-slate-50 relative group-hover:bg-slate-100/50 transition-colors"
        >
          <img
            src={product.mainImage ? `/${product.mainImage}` : '/assets/logo.png'}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/logo.png';
            }}
          />

          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                Out of Stock
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* 3. PRODUCT DETAILS */}
      <div className="flex-1 flex flex-col justify-between pt-1">
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="font-medium truncate max-w-[120px]">{product.brand}</span>
            {product.rating > 0 && (
              <span className="flex items-center gap-0.5 text-amber-500 font-bold bg-amber-50 px-1.5 py-0.2 rounded text-[10px]">
                <Star className="w-2.5 h-2.5 fill-amber-400" />
                {product.rating.toFixed(1)}
              </span>
            )}
          </div>

          <Link
            to={`/products/${product.slug}`}
            className="block text-xs sm:text-sm font-semibold text-slate-800 hover:text-brand-red line-clamp-2 leading-snug min-h-[38px] transition-colors"
            title={product.name}
          >
            {product.name}
          </Link>

          <span className="inline-block mt-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            {product.unit}
          </span>
        </div>

        {/* 4. PRICING & CART ACTION BUTTON */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-base font-bold text-slate-900">₹{product.price}</span>
              {product.mrp > product.price && (
                <span className="text-xs text-slate-400 line-through">₹{product.mrp}</span>
              )}
            </div>
          </div>

          {/* ADD TO CART / QUANTITY STEPPER */}
          {isOutOfStock ? (
            <button
              type="button"
              disabled
              className="text-[11px] font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg cursor-not-allowed"
            >
              Unavailable
            </button>
          ) : quantity === 0 ? (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isUpdating}
              className="btn-outline-red !py-1 !px-3 text-xs font-bold flex items-center gap-1 shadow-sm hover:shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ADD</span>
            </button>
          ) : (
            <div className="flex items-center bg-brand-red text-white rounded-lg shadow-sm overflow-hidden text-xs font-bold">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={isUpdating}
                className="px-2 py-1 hover:bg-brand-red-dark transition-colors"
                title="Decrease"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-2.5 py-1 text-center min-w-[24px] select-none text-[11px]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                disabled={isUpdating || quantity >= product.stock}
                className="px-2 py-1 hover:bg-brand-red-dark transition-colors disabled:opacity-40"
                title="Increase"
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
