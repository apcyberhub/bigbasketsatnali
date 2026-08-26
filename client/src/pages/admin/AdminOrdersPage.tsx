import React, { useState, useEffect } from 'react';
import { Search, Eye, Clock, CheckCircle2, XCircle, ShoppingBag, X } from 'lucide-react';
import { Order } from '../../types';
import { apiClient } from '../../api/client';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await apiClient.get(`/admin/orders?${params.toString()}`);
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      const res = await apiClient.put(`/admin/orders/${orderId}/status`, {
        orderStatus: newStatus,
      });
      if (res.data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus as any } : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, orderStatus: newStatus as any } : null));
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const statusOptions = [
    { value: 'ALL', label: 'All Orders' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'PACKED', label: 'Packed' },
    { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Customer Orders & Deliveries</h1>
          <p className="text-xs text-slate-500">Live order processing, rider dispatch, and status tracking</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchOrders();
          }}
          className="relative w-full sm:max-w-md"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order # (BB-...), Customer name, phone..."
            className="w-full pl-9 pr-20 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-800 text-white rounded text-[11px] font-semibold"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === opt.value
                  ? 'bg-brand-red text-white'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Order #</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Delivery Slot</th>
              <th className="py-3 px-4">Items / Total</th>
              <th className="py-3 px-4">Payment</th>
              <th className="py-3 px-4">Update Status</th>
              <th className="py-3 px-4 text-right">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                  Loading customer orders...
                </td>
              </tr>
            ) : orders.length > 0 ? (
              orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {ord.orderNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{ord.user?.name || 'Customer'}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{ord.user?.phone}</span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    {ord.deliverySlot || 'Express'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-brand-red block">₹{ord.total}</span>
                    <span className="text-[10px] text-slate-400">{ord.items?.length || 0} items</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                      {ord.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={ord.orderStatus}
                      onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-[11px] font-bold text-slate-800 focus:ring-1 focus:ring-brand-red focus:outline-none"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PACKED">PACKED</option>
                      <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(ord)}
                      className="p-1.5 text-slate-600 hover:text-brand-red hover:bg-slate-100 rounded-lg transition-colors"
                      title="View Order Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-base text-slate-900 font-mono">
                  Order #{selectedOrder.orderNumber}
                </h4>
                <p className="text-xs text-slate-400">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Address Snapshot */}
            <div className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-1">
              <span className="font-bold text-slate-800 block">Customer Delivery Details:</span>
              <p className="text-slate-600">{selectedOrder.deliveryAddressSnapshot}</p>
              {selectedOrder.notes && (
                <p className="text-amber-700 font-semibold pt-1">
                  Note: {selectedOrder.notes}
                </p>
              )}
            </div>

            {/* Itemized List */}
            <div className="space-y-2 text-xs">
              <h5 className="font-bold text-slate-800 uppercase text-[11px]">Items Ordered:</h5>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                {selectedOrder.items?.map((it) => (
                  <div key={it.id} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{it.productName}</span>
                      <span className="text-[11px] text-slate-500">{it.productBrand} • {it.productUnit} • ₹{it.price}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-700">{it.quantity}x</span>
                      <span className="font-bold text-slate-900 block">₹{it.subtotal}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financials */}
            <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>₹{selectedOrder.subtotal}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-₹{selectedOrder.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Delivery Fee</span>
                <span>₹{selectedOrder.deliveryFee}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (5%)</span>
                <span>₹{selectedOrder.tax}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-sm pt-1 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="text-brand-red">₹{selectedOrder.total}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="btn-primary text-xs font-bold"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
