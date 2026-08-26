import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowLeft,
  XCircle,
  ShieldCheck,
} from 'lucide-react';
import { Order } from '../../types';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!orderId) return;
      try {
        setIsLoading(true);
        const res = await apiClient.get(`/orders/${orderId}`);
        if (res.data.success) {
          setOrder(res.data.data);
        }
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Failed to load order.');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchOrderDetail();
    }
  }, [orderId, isAuthenticated]);

  const handleCancelOrder = async () => {
    if (!order) return;
    try {
      setIsCancelling(true);
      const res = await apiClient.post(`/orders/${order.id}/cancel`, {
        reason: cancelReason || 'Customer requested cancellation',
      });
      if (res.data.success) {
        setOrder(res.data.data);
        setShowCancelDialog(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Loading order tracking...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Order Not Found</h2>
        <p className="text-xs text-slate-500">{errorMsg || 'We could not find the requested order.'}</p>
        <Link to="/orders" className="btn-primary">
          Back to My Orders
        </Link>
      </div>
    );
  }

  // Delivery Tracking Steps
  const trackingSteps = [
    { key: 'PENDING', label: 'Order Placed', desc: 'Order received at store' },
    { key: 'CONFIRMED', label: 'Confirmed', desc: 'Accepted by store manager' },
    { key: 'PACKED', label: 'Packed Fresh', desc: 'Packed carefully in store' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Rider on the way' },
    { key: 'DELIVERED', label: 'Delivered', desc: 'Handed over at doorstep' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'CONFIRMED':
        return 1;
      case 'PACKED':
        return 2;
      case 'OUT_FOR_DELIVERY':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return -1;
    }
  };

  const currentStepIdx = getStepIndex(order.orderStatus);
  const isCancelled = order.orderStatus === 'CANCELLED';
  const canCancel = order.orderStatus === 'PENDING' || order.orderStatus === 'CONFIRMED';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* 1. TOP BAR */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <Link to="/orders" className="text-xs font-semibold text-slate-600 hover:text-brand-red flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Orders</span>
        </Link>

        {canCancel && (
          <button
            type="button"
            onClick={() => setShowCancelDialog(true)}
            className="text-xs font-bold text-rose-600 hover:underline"
          >
            Cancel Order
          </button>
        )}
      </div>

      {/* 2. ORDER SUMMARY CARD */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Order Number</span>
            <h1 className="text-lg font-black font-mono text-slate-900">{order.orderNumber}</h1>
            <p className="text-xs text-slate-500">
              Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-[11px] text-slate-400 font-medium block">Order Status</span>
            <span
              className={`inline-block text-xs font-extrabold px-3 py-1 rounded-full uppercase ${
                isCancelled
                  ? 'bg-rose-100 text-rose-800'
                  : order.orderStatus === 'DELIVERED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {order.orderStatus.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* 3. VISUAL STEP-BY-STEP ORDER TRACKING */}
        {!isCancelled ? (
          <div className="py-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-6">
              Live Order Progress
            </h3>

            <div className="relative flex items-center justify-between">
              {/* Progress Line */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${Math.max(0, (currentStepIdx / (trackingSteps.length - 1)) * 100)}%`,
                  }}
                />
              </div>

              {trackingSteps.map((step, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center text-center">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isPassed
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs font-bold mt-2 whitespace-nowrap ${
                        isCurrent ? 'text-emerald-700' : isPassed ? 'text-slate-800' : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-xs">
            <XCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold">This grocery order has been cancelled.</p>
              {order.cancellationReason && (
                <p className="text-[11px] text-rose-600 mt-0.5">Reason: {order.cancellationReason}</p>
              )}
            </div>
          </div>
        )}

        {/* 4. ADDRESS & DELIVERY SLOT SNAPSHOT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <MapPin className="w-4 h-4 text-brand-red" />
              <span>Delivery Address</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {order.deliveryAddress ? (
                <>
                  <strong className="block text-slate-900">{order.deliveryAddress.fullName}</strong>
                  {order.deliveryAddress.addressLine1}, {order.deliveryAddress.city},{' '}
                  {order.deliveryAddress.state} - {order.deliveryAddress.postalCode}
                  <span className="block text-[11px] text-slate-400 font-mono mt-1">
                    📱 {order.deliveryAddress.phone}
                  </span>
                </>
              ) : (
                'Doorstep Delivery Address'
              )}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Delivery Slot & Mode</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              <strong className="block text-slate-900">{order.deliverySlot || '15-Min Express Delivery'}</strong>
              Payment: {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Paid'} (Status: {order.paymentStatus})
            </p>
          </div>
        </div>

        {/* 5. ITEMIZED GROCERY ITEMS TABLE */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Items in this Order ({order.items?.length || 0})
          </h3>

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {order.items?.map((it) => (
              <div key={it.id} className="p-3.5 flex items-center justify-between gap-3 text-xs bg-white">
                <div className="flex items-center gap-3">
                  <img
                    src={it.productImage ? `/${it.productImage}` : '/assets/logo.png'}
                    alt={it.productName}
                    className="w-12 h-12 object-contain rounded border border-slate-100 bg-slate-50 p-1"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/logo.png';
                    }}
                  />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">{it.productBrand}</span>
                    <span className="font-semibold text-slate-900 block">{it.productName}</span>
                    <span className="text-[11px] text-slate-500">{it.productUnit} • ₹{it.price} each</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-800">{it.quantity}x</span>
                  <span className="text-xs font-bold text-slate-900 block">₹{it.subtotal}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. BILL MATH SUMMARY */}
        <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Items Subtotal</span>
            <span className="font-semibold text-slate-900">₹{order.subtotal}</span>
          </div>

          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Coupon Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
              <span>-₹{order.discount}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-600">
            <span>Delivery Fee</span>
            <span className="font-semibold text-slate-900">
              {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}
            </span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>GST / Taxes (5%)</span>
            <span className="font-semibold text-slate-900">₹{order.tax}</span>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
            <span className="text-sm font-black text-slate-900">Total Paid / Payable</span>
            <span className="text-xl font-black text-brand-red">₹{order.total}</span>
          </div>
        </div>
      </div>

      {/* CANCEL ORDER DIALOG */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 animate-in fade-in">
            <h4 className="font-bold text-base text-slate-900">Cancel Order #{order.orderNumber}?</h4>
            <p className="text-xs text-slate-500">
              Are you sure you want to cancel this grocery order? The items will be returned to inventory.
            </p>

            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (e.g. ordered by mistake, change of delivery time)..."
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelDialog(false)}
                className="btn-secondary text-xs"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="btn-primary !bg-rose-600 text-xs font-bold"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
