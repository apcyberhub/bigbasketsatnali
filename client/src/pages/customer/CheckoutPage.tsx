import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  CreditCard,
  Banknote,
  Plus,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Address, DeliverySlot } from '../../types';
import { apiClient } from '../../api/client';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { cart, appliedCoupon, finalTotal, refreshCart } = useCart();

  // Step 1: Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: 'Indore',
    state: 'Madhya Pradesh',
    postalCode: '452001',
    addressType: 'HOME' as 'HOME' | 'WORK' | 'OTHER',
    isDefault: true,
  });

  // Step 2: Delivery Slots
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('10:00 AM - 12:00 PM (Today)');

  // Step 3: Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [orderNotes, setOrderNotes] = useState('');

  // Processing state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Redirect if not authenticated or cart is empty
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Load Saved Addresses & Delivery Slots
  useEffect(() => {
    const loadCheckoutData = async () => {
      try {
        const [addrRes, slotRes] = await Promise.all([
          apiClient.get('/addresses'),
          apiClient.get('/delivery-slots'),
        ]);

        if (addrRes.data.success && addrRes.data.data.length > 0) {
          setAddresses(addrRes.data.data);
          const defaultAddr = addrRes.data.data.find((a: Address) => a.isDefault);
          setSelectedAddressId(defaultAddr ? defaultAddr.id : addrRes.data.data[0].id);
        } else {
          setIsAddressModalOpen(true);
        }

        if (slotRes.data.success && slotRes.data.data.length > 0) {
          setSlots(slotRes.data.data);
          setSelectedSlot(slotRes.data.data[0].formattedSlot || '10:00 AM - 12:00 PM (Today)');
        }
      } catch (err) {
        console.error('Failed to load checkout prerequisites:', err);
      }
    };

    if (isAuthenticated) {
      loadCheckoutData();
    }
  }, [isAuthenticated]);

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/addresses', newAddress);
      if (res.data.success) {
        setAddresses((prev) => [...prev, res.data.data]);
        setSelectedAddressId(res.data.data.id);
        setIsAddressModalOpen(false);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to save address.');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setErrorMessage('Please select or add a delivery address.');
      return;
    }
    if (!cart || cart.items.length === 0) {
      setErrorMessage('Your shopping cart is empty.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      // 1. Submit Atomic Order to Backend
      const orderPayload = {
        addressId: selectedAddressId,
        deliverySlot: selectedSlot,
        couponCode: appliedCoupon?.code,
        paymentMethod,
        notes: orderNotes.trim() || undefined,
      };

      const res = await apiClient.post('/orders', orderPayload);

      if (res.data.success && res.data.data) {
        const order = res.data.data;
        await refreshCart();
        navigate(`/order-success/${order.id}`, { state: { order } });
      } else {
        setErrorMessage(res.data.message || 'Failed to place order.');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Something went wrong while placing your order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Your basket is empty</h2>
        <p className="text-xs text-slate-500">Please add grocery items before proceeding to checkout.</p>
        <button type="button" onClick={() => navigate('/products')} className="btn-primary">
          Browse Groceries
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* 1. CHECKOUT HEADER */}
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Checkout & Delivery</h1>
        <p className="text-xs text-slate-500">Fast 15-Minute Express Doorstep Delivery</p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. CHECKOUT WIZARD COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Address, Slots, Payment (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: DELIVERY ADDRESS */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-brand-red text-white text-xs font-bold flex items-center justify-center">
                  1
                </div>
                <h3 className="font-bold text-sm text-slate-900">Delivery Address</h3>
              </div>

              <button
                type="button"
                onClick={() => setIsAddressModalOpen(true)}
                className="text-xs font-bold text-brand-red hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Address</span>
              </button>
            </div>

            {addresses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-brand-red bg-brand-red-light/30 ring-2 ring-brand-red/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900">{addr.fullName}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-1.5 py-0.2 rounded">
                          {addr.addressType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {addr.addressLine1}, {addr.addressLine2 ? `${addr.addressLine2}, ` : ''}
                        {addr.landmark ? `Near ${addr.landmark}, ` : ''}
                        {addr.city}, {addr.state} - {addr.postalCode}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-2">📱 {addr.phone}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-500">
                No delivery address saved yet. Please add one above.
              </div>
            )}
          </div>

          {/* STEP 2: DELIVERY TIME SLOT */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-6 h-6 rounded-full bg-brand-red text-white text-xs font-bold flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-sm text-slate-900">Select Delivery Time Slot</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {slots.map((slot) => {
                const slotText = slot.formattedSlot || `${slot.startTime} - ${slot.endTime} (${slot.date})`;
                const isSelected = selectedSlot === slotText;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlot(slotText)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-brand-red bg-brand-red-light/30 ring-2 ring-brand-red/20 font-bold text-brand-red'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{slotText}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3: PAYMENT METHOD */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-6 h-6 rounded-full bg-brand-red text-white text-xs font-bold flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-sm text-slate-900">Payment Option</h3>
            </div>

            <div className="space-y-3">
              {/* Cash on Delivery (COD) */}
              <label
                className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">Cash on Delivery (COD)</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pay with cash, UPI, or card directly to our delivery executive upon receiving your groceries.
                  </p>
                </div>
              </label>

              {/* Online Payment (Razorpay / UPI) */}
              <label
                className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'ONLINE'
                    ? 'border-brand-red bg-brand-red-light/30 ring-2 ring-brand-red/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="ONLINE"
                  checked={paymentMethod === 'ONLINE'}
                  onChange={() => setPaymentMethod('ONLINE')}
                  className="mt-0.5 text-brand-red focus:ring-brand-red"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-brand-red" />
                    <span className="text-xs font-bold text-slate-900">Online Payment / UPI / Cards</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Secure checkout via Google Pay, PhonePe, Paytm, Cards & NetBanking.
                  </p>
                </div>
              </label>
            </div>

            {/* Delivery Instructions */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Delivery Instructions (Optional)
              </label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="e.g. Ring the bell twice, leave with guard, landmark..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-red focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar: Order Summary & Place Order Button (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Order Summary ({cart.itemCount} items)
            </h3>

            {/* Items mini list */}
            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
              {cart.items.map((it) => (
                <div key={it.id} className="py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="font-bold text-slate-700">{it.quantity}x</span>
                    <span className="truncate text-slate-800">{it.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900 shrink-0">₹{it.subtotal}</span>
                </div>
              ))}
            </div>

            {/* Bill Math */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900">₹{cart.subtotal}</span>
              </div>

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
                <span>Estimated Taxes (5% GST)</span>
                <span className="font-semibold text-slate-900">₹{cart.tax}</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-extrabold text-slate-900">Grand Total</span>
                <span className="text-xl font-black text-brand-red">₹{finalTotal}</span>
              </div>
            </div>

            {/* PLACE ORDER BUTTON */}
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isSubmitting || !selectedAddressId}
              className="btn-primary w-full py-3.5 text-sm font-extrabold flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Placing Your Order...</span>
                </>
              ) : (
                <>
                  <span>Place Order (₹{finalTotal})</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-[11px] text-slate-400 text-center space-y-1">
              <p>By placing this order, you agree to our Terms of Service.</p>
              <div className="flex items-center justify-center gap-2 text-emerald-600 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Safe & Secure Grocery Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ADD NEW ADDRESS MODAL */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in">
            <h4 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
              Add New Delivery Address
            </h4>

            <form onSubmit={handleCreateAddress} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                  <input
                    required
                    type="text"
                    value={newAddress.fullName}
                    onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">10-Digit Mobile Phone</label>
                  <input
                    required
                    type="tel"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  House / Flat No., Building Name
                </label>
                <input
                  required
                  type="text"
                  value={newAddress.addressLine1}
                  onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                  placeholder="e.g. Flat 302, Green Valley Apartments"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Street / Area / Colony
                </label>
                <input
                  type="text"
                  value={newAddress.addressLine2}
                  onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                  placeholder="e.g. Near Vijay Nagar Square"
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Landmark (Optional)</label>
                  <input
                    type="text"
                    value={newAddress.landmark}
                    onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                    placeholder="e.g. Opposite State Bank"
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">PIN Code</label>
                  <input
                    required
                    type="text"
                    value={newAddress.postalCode}
                    onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">City</label>
                  <input
                    required
                    type="text"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">State</label>
                  <input
                    required
                    type="text"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs font-bold">
                  Save Address & Deliver Here
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
