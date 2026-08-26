import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, ChevronRight, ShoppingBag } from 'lucide-react';
import { Order } from '../../types';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../../components/common/EmptyState';

export const OrdersPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.get('/orders');
        if (res.data.success) {
          setOrders(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load customer orders:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          title="Login to view your orders"
          description="Sign in to view your active grocery deliveries and complete past order receipts."
          actionText="Login Now"
          actionLink="/login"
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-500">Loading your grocery order history...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState
          icon={<Package className="w-8 h-8 text-brand-red" />}
          title="No grocery orders placed yet"
          description="Once you place an order with Big Basket, you can track delivery in real time and reorder from here."
          actionText="Start Shopping"
          actionLink="/products"
        />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'OUT_FOR_DELIVERY':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'PACKED':
      case 'CONFIRMED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-xl font-extrabold text-slate-900">My Orders</h1>
        <p className="text-xs text-slate-500">View and track all your Big Basket grocery deliveries</p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle hover:border-slate-300 transition-all space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                  {order.orderNumber}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${getStatusColor(
                    order.orderStatus
                  )}`}
                >
                  {order.orderStatus.replace(/_/g, ' ')}
                </span>
                <span className="text-xs font-black text-brand-red">₹{order.total}</span>
              </div>
            </div>

            {/* Items snippet */}
            <div className="text-xs text-slate-600 space-y-1">
              <p className="line-clamp-1">
                <strong>Items:</strong>{' '}
                {order.items?.map((it) => `${it.productName} (${it.quantity}x)`).join(', ')}
              </p>
              <p className="text-slate-400">
                Delivery: {order.deliverySlot || '15-Min Express Delivery'}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Payment: {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Paid'}
              </span>

              <Link
                to={`/orders/${order.id}`}
                className="btn-secondary !py-1.5 !px-3 text-xs font-bold flex items-center gap-1 hover:text-brand-red"
              >
                <span>Order Details & Tracking</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
