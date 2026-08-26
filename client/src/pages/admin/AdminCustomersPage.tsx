import React, { useState, useEffect } from 'react';
import { Users, Search, Check, X, Shield, ShoppingBag } from 'lucide-react';
import { User } from '../../types';
import { apiClient } from '../../api/client';

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/admin/customers');
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleToggleStatus = async (id: number) => {
    try {
      const res = await apiClient.patch(`/admin/customers/${id}/toggle-status`);
      if (res.data.success) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update customer status');
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Customer Management</h1>
          <p className="text-xs text-slate-500">
            {customers.length} registered grocery customers
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email, phone..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Joined Date</th>
              <th className="py-3 px-4">Account Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                  Loading customer accounts...
                </td>
              </tr>
            ) : filtered.length > 0 ? (
              filtered.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 uppercase">
                        {cust.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{cust.name}</span>
                        <span className="text-[11px] text-slate-500">{cust.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {cust.phone || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                        cust.role === 'ADMIN'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {cust.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {cust.createdAt ? new Date(cust.createdAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                        cust.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {cust.isActive ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {cust.role !== 'ADMIN' && (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(cust.id)}
                        className={`text-xs font-semibold hover:underline ${
                          cust.isActive ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {cust.isActive ? 'Block Account' : 'Activate Account'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
