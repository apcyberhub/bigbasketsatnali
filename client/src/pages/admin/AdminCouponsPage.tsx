import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Ticket, Check, X } from 'lucide-react';
import { Coupon } from '../../types';
import { apiClient } from '../../api/client';

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number | ''>(20);
  const [minOrderAmount, setMinOrderAmount] = useState<number | ''>(299);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | ''>(150);
  const [usageLimit, setUsageLimit] = useState<number | ''>(1000);
  const [isActive, setIsActive] = useState(true);

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/admin/coupons');
      if (res.data.success) {
        setCoupons(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setCode('');
    setDescription('');
    setDiscountType('PERCENTAGE');
    setDiscountValue(20);
    setMinOrderAmount(299);
    setMaxDiscountAmount(150);
    setUsageLimit(1000);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (coup: Coupon) => {
    setEditingId(coup.id);
    setCode(coup.code);
    setDescription(coup.description || '');
    setDiscountType(coup.discountType);
    setDiscountValue(coup.discountValue);
    setMinOrderAmount(coup.minOrderAmount);
    setMaxDiscountAmount(coup.maxDiscountAmount ?? '');
    setUsageLimit(coup.usageLimit ?? '');
    setIsActive(coup.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        description,
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount),
        maxDiscountAmount: maxDiscountAmount !== '' ? Number(maxDiscountAmount) : null,
        usageLimit: usageLimit !== '' ? Number(usageLimit) : null,
        isActive,
      };

      if (editingId) {
        await apiClient.put(`/admin/coupons/${editingId}`, payload);
      } else {
        await apiClient.post('/admin/coupons', payload);
      }

      setIsModalOpen(false);
      fetchCoupons();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (id: number, couponCode: string) => {
    if (!confirm(`Delete coupon "${couponCode}"?`)) return;
    try {
      const res = await apiClient.delete(`/admin/coupons/${id}`);
      if (res.data.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Discount Coupons & Offers</h1>
          <p className="text-xs text-slate-500">Configure promotional discount codes for grocery checkout</p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary !py-2 text-xs font-bold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Coupon Code</th>
              <th className="py-3 px-4">Discount Value</th>
              <th className="py-3 px-4">Min Order</th>
              <th className="py-3 px-4">Max Cap</th>
              <th className="py-3 px-4">Usage Count</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                  Loading coupons...
                </td>
              </tr>
            ) : coupons.length > 0 ? (
              coupons.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-black text-brand-red text-xs block">
                      {c.code}
                    </span>
                    <span className="text-[10px] text-slate-400 line-clamp-1">{c.description}</span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT`}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">₹{c.minOrderAmount}</td>
                  <td className="py-3 px-4 text-slate-500">
                    {c.maxDiscountAmount ? `₹${c.maxDiscountAmount}` : 'No Cap'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {c.usageCount ?? 0} {c.usageLimit ? `/ ${c.usageLimit}` : ''}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                        c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {c.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(c)}
                        className="p-1.5 text-slate-600 hover:text-brand-red hover:bg-slate-100 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id, c.code)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                  No coupons found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 animate-in fade-in">
            <h4 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
              {editingId ? 'Edit Coupon' : 'Create New Discount Coupon'}
            </h4>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Coupon Code *</label>
                <input
                  required
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. WELCOME20, FREEDEL"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Offer Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 20% discount on first order above ₹299"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Discount Value *</label>
                  <input
                    required
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Min Order Amount (₹)</label>
                  <input
                    required
                    type="number"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Max Cap Amount (₹)</label>
                  <input
                    type="number"
                    value={maxDiscountAmount}
                    onChange={(e) =>
                      setMaxDiscountAmount(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    placeholder="Optional"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs font-bold">
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
