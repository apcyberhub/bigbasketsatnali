import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock } from 'lucide-react';
import { DeliverySlot } from '../../types';
import { apiClient } from '../../api/client';

export const AdminDeliverySlotsPage: React.FC = () => {
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form
  const [date, setDate] = useState('TODAY');
  const [startTime, setStartTime] = useState('08:00 AM');
  const [endTime, setEndTime] = useState('10:00 AM');
  const [capacity, setCapacity] = useState<number | ''>(30);
  const [isActive, setIsActive] = useState(true);

  const fetchSlots = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/admin/delivery-slots');
      if (res.data.success) {
        setSlots(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setDate('TODAY');
    setStartTime('08:00 AM');
    setEndTime('10:00 AM');
    setCapacity(30);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (s: DeliverySlot) => {
    setEditingId(s.id);
    setDate(s.date);
    setStartTime(s.startTime);
    setEndTime(s.endTime);
    setCapacity(s.capacity);
    setIsActive(s.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        date,
        startTime,
        endTime,
        capacity: Number(capacity),
        isActive,
      };

      if (editingId) {
        await apiClient.put(`/admin/delivery-slots/${editingId}`, payload);
      } else {
        await apiClient.post('/admin/delivery-slots', payload);
      }

      setIsModalOpen(false);
      fetchSlots();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save delivery slot');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this delivery time slot?')) return;
    try {
      const res = await apiClient.delete(`/admin/delivery-slots/${id}`);
      if (res.data.success) {
        setSlots((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete slot');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Delivery Time Slots</h1>
          <p className="text-xs text-slate-500">Configure daily delivery schedules and order capacity</p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary !py-2 text-xs font-bold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Delivery Slot</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Schedule Day</th>
              <th className="py-3 px-4">Time Window</th>
              <th className="py-3 px-4">Capacity Limit</th>
              <th className="py-3 px-4">Bookings</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {slots.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900">{s.date}</td>
                <td className="py-3 px-4 font-semibold text-slate-800">
                  {s.startTime} - {s.endTime}
                </td>
                <td className="py-3 px-4 text-slate-700">{s.capacity} orders</td>
                <td className="py-3 px-4 font-mono text-slate-600">
                  {s.bookedCount ?? 0} booked
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                      s.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {s.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(s)}
                      className="p-1.5 text-slate-600 hover:text-brand-red hover:bg-slate-100 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 animate-in fade-in">
            <h4 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
              {editingId ? 'Edit Delivery Slot' : 'Add New Delivery Slot'}
            </h4>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Day</label>
                <select
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                >
                  <option value="TODAY">TODAY</option>
                  <option value="TOMORROW">TOMORROW</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Start Time</label>
                  <input
                    required
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="08:00 AM"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">End Time</label>
                  <input
                    required
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Max Capacity</label>
                  <input
                    required
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-slate-800">Active</span>
                  </label>
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
                  Save Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
