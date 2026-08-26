import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Ticket,
  Truck,
  ShieldCheck,
  CheckCircle2,
  X,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../../components/common/EmptyState';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    cart,
    isLoading,
    updateQuantity,
    removeItem,
    clearCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    finalTotal,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const availableCoupons = [
    { code: 'WELCOME20', desc: '20% OFF on first order (Min ₹299)' },
    { code: 'FREEDEL', desc: 'FREE Express Delivery above ₹199' },
    { code: 'BIGBASKET50', desc: 'Flat ₹50 OFF above ₹499' },
    { code: 'FLAT100', desc: 'Flat ₹100 OFF above ₹999' },
  ];

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <EmptyState
          title="Please login to view your cart"
          description="Log in to access your saved grocery items, applied discounts, and fast checkout."
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
        <p className="text-xs font-semibold text-slate-500">Loading your shopping cart...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8 text-brand-red" />}
          title="Your grocery cart is empty"
          description="Looks like you haven't added any fresh groceries or essentials to your basket yet."
          actionText="Browse Fresh Groceries"
          actionLink="/products"
        />
      </div>
    );
  }

  const freeDeliveryThreshold = 499;
  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - cart.subtotal);
  const freeDeliveryProgress = Math.min(100, (cart.subtotal / freeDeliveryThreshold) * 100);

  const handleApplyCoupon = async (codeToApply: string) => {
    setCouponError('');
    setCouponSuccess('');
    setIsApplying(true);
    const result = await applyCoupon(codeToApply.trim().toUpperCase());
    setIsApplying(false);
    if (result.success) {
      setCouponSuccess(result.message);
      setCouponInput('');
    } else {
      setCouponError(result.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. HEADER */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Your Shopping Basket</h1>
          <p className="text-xs text-slate-500">
            {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      {/* 2. FREE DELIVERY PROGRESS METER */}
      <div className="bg-emerald-50 border border-emerald-200/80 p-3.5 rounded-xl text-xs space-y-2">
        <div className="flex items-center justify-between font-semibold text-emerald-900">
          <div className="flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-emerald-700" />
            {amountNeededForFreeDelivery === 0 || appliedCoupon?.code === 'FREEDEL' ? (
              <span>🎉 Congratulations! You have unlocked <strong>FREE Express Delivery!</strong></span>
            ) : (
              <span>
                Add <strong>₹{amountNeededForFreeDelivery}</strong> more for <strong>FREE Delivery!</strong>
              </span>
            )}
          </div>
          <span className="font-bold">{Math.round(freeDeliveryProgress)}%</span>
        </div>
        <div className="w-full bg-emerald-200/60 h-2 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${appliedCoupon?.code === 'FREEDEL' ? 100 : freeDeliveryProgress}%` }}
          />
        </div>
      </div>

      {/* 3. MAIN CART LAYOUT (ITEMS + BILL SUMMARY) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Cart Items List (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle divide-y divide-slate-100 overflow-hidden">
            {cart.items.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/50 transition-colors">
                {/* Product Thumbnail & Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <Link
                    to={`/products/${item.slug}`}
                    className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-lg p-1.5 border border-slate-100 shrink-0 overflow-hidden"
                  >
                    <img
                      src={item.mainImage ? `/${item.mainImage}` : '/assets/logo.png'}
                      alt={item.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/logo.png';
                      }}
                    />
                  </Link>

                  <div className="min-w-0 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {item.brand}
                    </span>
                    <Link
                      to={`/products/${item.slug}`}
                      className="text-xs sm:text-sm font-semibold text-slate-900 hover:text-brand-red line-clamp-1 block"
                    >
                      {item.name}
                    </Link>
                    <span className="inline-block text-[11px] text-slate-500 bg-slate-100 px-2 py-0.2 rounded">
                      {item.unit}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">₹{item.price}</span>
                      {item.mrp > item.price && (
                        <span className="text-[11px] text-slate-400 line-through">₹{item.mrp}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stepper & Line Total */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center bg-brand-red text-white rounded-lg shadow-sm overflow-hidden text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.quantity <= 1) {
                          removeItem(item.id);
                        } else {
                          updateQuantity(item.id, item.quantity - 1);
                        }
                      }}
                      className="p-1 sm:px-2 py-1 hover:bg-brand-red-dark transition-colors"
                      aria-label="Decrease"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 py-1 text-center min-w-[22px] select-none text-xs">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="p-1 sm:px-2 py-1 hover:bg-brand-red-dark transition-colors disabled:opacity-40"
                      aria-label="Increase"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="text-xs font-bold text-slate-900">
                    ₹{item.subtotal}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-2">
            <span>Prices are inclusive of standard local grocery taxes.</span>
            <Link to="/products" className="font-semibold text-brand-red hover:underline">
              + Add More Groceries
            </Link>
          </div>
        </div>

        {/* Right: Coupon & Bill Details (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Coupon Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
              <Ticket className="w-4 h-4 text-brand-red" />
              <span>Apply Discount Coupon</span>
            </div>

            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 p-2.5 rounded-xl">
                <div className="flex items-center gap-2 text-xs text-emerald-900 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    &apos;{appliedCoupon.code}&apos; Applied (-₹{appliedCoupon.discountAmount})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  title="Remove coupon"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (couponInput) handleApplyCoupon(couponInput);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Enter promo code (e.g. WELCOME20)"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs uppercase font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
                <button
                  type="submit"
                  disabled={!couponInput.trim() || isApplying}
                  className="btn-primary !py-2 text-xs font-bold"
                >
                  {isApplying ? 'Checking...' : 'Apply'}
                </button>
              </form>
            )}

            {couponError && <p className="text-xs font-semibold text-rose-600">{couponError}</p>}
            {couponSuccess && <p className="text-xs font-semibold text-emerald-600">{couponSuccess}</p>}

            {/* Quick Coupons List */}
            {!appliedCoupon && (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">
                  Available Offers
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {availableCoupons.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleApplyCoupon(c.code)}
                      className="p-2 border border-dashed border-slate-300 hover:border-brand-red hover:bg-brand-red-light/40 rounded-lg text-left transition-colors text-xs"
                    >
                      <span className="font-bold text-brand-red block">{c.code}</span>
                      <span className="text-[10px] text-slate-500 line-clamp-1">{c.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bill Summary */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Bill Details
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900">₹{cart.subtotal}</span>
              </div>

              {cart.savings > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Product Savings</span>
                  <span>-₹{cart.savings}</span>
                </div>
              )}

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount ({appliedCoupon.code})</span>
                  <span>-₹{appliedCoupon.discountAmount}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Delivery Fee</span>
                {cart.deliveryFee === 0 || appliedCoupon?.code === 'FREEDEL' ? (
                  <span className="font-bold text-emerald-600 uppercase">FREE</span>
                ) : (
                  <span className="font-semibold text-slate-900">₹40</span>
                )}
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Estimated Tax (5% GST)</span>
                <span className="font-semibold text-slate-900">₹{cart.tax}</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-extrabold text-slate-900">To Pay</span>
                <span className="text-xl font-black text-brand-red">₹{finalTotal}</span>
              </div>
            </div>

            {/* Total Savings Highlight */}
            {(cart.savings > 0 || appliedCoupon) && (
              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-center text-xs font-bold text-emerald-700">
                🎉 You are saving ₹{Math.round(cart.savings + (appliedCoupon?.discountAmount || 0))} on this grocery order!
              </div>
            )}

            {/* Checkout CTA */}
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
