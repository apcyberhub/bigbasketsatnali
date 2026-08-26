import React, { useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  PackageCheck,
  Truck,
  Clock,
  MapPin,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import { Order } from '../../types';

export const OrderSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const order: Order | undefined = location.state?.order;

  useEffect(() => {
    // Fire festive confetti animation
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center space-y-6">
      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md animate-in zoom-in-50 duration-300">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <div className="space-y-2">
        <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
          Order Successfully Placed!
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Thank you for choosing Big Basket!
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Your order has been received and is being packed fresh by our store team for prompt 15-minute dispatch.
        </p>
      </div>

      {order && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle text-left space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 text-xs gap-2">
            <div>
              <span className="text-slate-400 block font-medium">Order Number</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{order.orderNumber}</span>
            </div>
            <div className="sm:text-right">
              <span className="text-slate-400 block font-medium">Payment Mode</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {order.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Online Payment'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Delivery Slot</span>
                <span className="text-slate-600">{order.deliverySlot || '15-Min Express'}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Truck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Order Total</span>
                <span className="text-brand-red font-black text-sm">₹{order.total}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link
          to={`/orders/${orderId || order?.id}`}
          className="btn-primary w-full sm:w-auto px-6 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
        >
          <PackageCheck className="w-4 h-4" />
          <span>Track Order Status</span>
        </Link>

        <Link
          to="/products"
          className="btn-secondary w-full sm:w-auto px-6 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4 text-slate-400" />
          <span>Continue Shopping</span>
        </Link>
      </div>
    </div>
  );
};
