import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Users,
  Package,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { DashboardStats, Order, Product } from '../../types';
import { apiClient } from '../../api/client';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/admin/dashboard');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await apiClient.put(`/admin/orders/${orderId}/status`, {
        orderStatus: newStatus,
      });
      if (res.data.success) {
        fetchDashboardStats();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-500">Loading store performance metrics...</p>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-12 text-xs text-slate-500">Failed to load metrics.</div>;
  }

  const { metrics, salesChart, recentOrders, lowStockProducts } = stats;

  const kpis = [
    {
      label: 'Total Revenue',
      value: `₹${metrics.totalRevenue.toLocaleString()}`,
      sub: `Today: ₹${metrics.todayRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-500 text-white',
    },
    {
      label: 'Total Orders',
      value: metrics.totalOrders,
      sub: `${metrics.deliveredOrders} Delivered`,
      icon: ShoppingBag,
      color: 'bg-blue-500 text-white',
    },
    {
      label: 'Pending Orders',
      value: metrics.pendingOrders,
      sub: 'Action needed for packing',
      icon: Clock,
      color: 'bg-amber-500 text-white',
      badge: metrics.pendingOrders > 0 ? 'Live' : undefined,
    },
    {
      label: 'Total Customers',
      value: metrics.totalCustomers,
      sub: 'Active buyers',
      icon: Users,
      color: 'bg-indigo-500 text-white',
    },
    {
      label: 'Active Products',
      value: metrics.totalProducts,
      sub: 'Live in catalog',
      icon: Package,
      color: 'bg-purple-500 text-white',
    },
    {
      label: 'Low Stock Alert',
      value: metrics.lowStockCount,
      sub: 'Restock needed',
      icon: AlertTriangle,
      color: 'bg-rose-500 text-white',
      badge: metrics.lowStockCount > 0 ? 'Critical' : undefined,
    },
  ];

  return (
    <div className="space-y-8">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Store Overview & Analytics</h1>
          <p className="text-xs text-slate-500">Real-time revenue, daily orders, and inventory health</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchDashboardStats}
            className="btn-secondary !py-1.5 !px-3 text-xs font-semibold"
          >
            Refresh Data
          </button>
          <Link to="/admin/products/new" className="btn-primary !py-1.5 !px-3 text-xs font-bold">
            + Add Product
          </Link>
        </div>
      </div>

      {/* 2. KPI CARDS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {kpi.badge && (
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                    {kpi.badge}
                  </span>
                )}
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                <p className="text-lg font-black text-slate-900 mt-0.5">{kpi.value}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{kpi.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. 7-DAY SALES & REVENUE CHART */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">7-Day Sales & Order Volume</h3>
          </div>
          <span className="text-xs text-slate-400">Past 7 days performance</span>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-4 items-end min-h-[160px]">
          {salesChart.map((day) => {
            const maxRevenue = Math.max(...salesChart.map((d) => d.revenue), 1000);
            const heightPercent = Math.max(10, (day.revenue / maxRevenue) * 100);
            return (
              <div key={day.date} className="flex flex-col items-center gap-2 h-full justify-end group">
                <div className="text-[10px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  ₹{day.revenue}
                </div>
                <div className="w-full bg-slate-100 rounded-t-lg h-32 flex items-end overflow-hidden">
                  <div
                    className="w-full bg-gradient-to-t from-brand-red to-rose-400 rounded-t-lg transition-all duration-500 group-hover:from-brand-red-dark group-hover:to-brand-red"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-semibold text-slate-600 block">{day.date}</span>
                  <span className="text-[9px] text-slate-400 font-bold block">{day.orders} orders</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. TWO-COLUMN: RECENT ORDERS & LOW STOCK ALERT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900">Recent Customer Orders</h3>
            <Link to="/admin/orders" className="text-xs font-bold text-brand-red hover:underline flex items-center gap-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50">
                <tr>
                  <th className="py-2 px-3">Order</th>
                  <th className="py-2 px-3">Customer</th>
                  <th className="py-2 px-3">Total</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 block">{ord.user?.name || 'Customer'}</span>
                      <span className="text-[10px] text-slate-400">{ord.deliverySlot || 'Express'}</span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">₹{ord.total}</td>
                    <td className="py-3 px-3">
                      <select
                        value={ord.orderStatus}
                        onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-red"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="PACKED">PACKED</option>
                        <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-sm text-slate-900">Low Stock Warnings</h3>
            </div>
            <Link to="/admin/inventory" className="text-xs font-bold text-brand-red hover:underline">
              Manage Stock
            </Link>
          </div>

          {lowStockProducts.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {lowStockProducts.map((prod) => (
                <div key={prod.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={prod.mainImage ? `/${prod.mainImage}` : '/assets/logo.png'}
                      alt={prod.name}
                      className="w-8 h-8 object-contain rounded bg-slate-50 border border-slate-100 p-0.5 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/logo.png';
                      }}
                    />
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900 line-clamp-1 block">{prod.name}</span>
                      <span className="text-[10px] text-slate-400">{prod.brand} • {prod.unit}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-rose-600 block">
                      {prod.stock === 0 ? 'Out of Stock' : `${prod.stock} left`}
                    </span>
                    <Link
                      to={`/admin/products/${prod.id}/edit`}
                      className="text-[10px] font-semibold text-slate-500 hover:text-brand-red hover:underline"
                    >
                      Update &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-emerald-600 font-semibold flex flex-col items-center gap-1.5">
              <CheckCircle2 className="w-6 h-6" />
              <span>All inventory levels are healthy!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
