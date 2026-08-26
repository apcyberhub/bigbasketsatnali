import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon, Upload } from 'lucide-react';
import { Banner } from '../../types';
import { apiClient } from '../../api/client';

export const AdminBannersPage: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [ctaText, setCtaText] = useState('Shop Deals');
  const [linkUrl, setLinkUrl] = useState('/products');
  const [sortOrder, setSortOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const fetchBanners = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/admin/banners');
      if (res.data.success) {
        setBanners(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load banners:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setCtaText('Shop Deals');
    setLinkUrl('/products');
    setSortOrder(banners.length + 1);
    setIsActive(true);
    setImageFile(null);
    setImagePreview('');
    setIsModalOpen(true);
  };

  const openEditModal = (b: Banner) => {
    setEditingId(b.id);
    setTitle(b.title);
    setSubtitle(b.subtitle || '');
    setCtaText(b.ctaText || 'Shop Deals');
    setLinkUrl(b.linkUrl || '/products');
    setSortOrder(b.sortOrder);
    setIsActive(b.isActive);
    setImageFile(null);
    setImagePreview(b.image ? `/${b.image}` : '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imagePath = '';
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const upRes = await apiClient.post('/admin/banners/upload-image', formData);
        if (upRes.data.success) imagePath = upRes.data.data.imageUrl;
      }

      const payload = {
        title,
        subtitle,
        ctaText,
        linkUrl,
        sortOrder: Number(sortOrder),
        isActive,
        ...(imagePath ? { image: imagePath } : {}),
      };

      if (editingId) {
        await apiClient.put(`/admin/banners/${editingId}`, payload);
      } else {
        await apiClient.post('/admin/banners', {
          ...payload,
          image: imagePath || 'assets/banners/hero-banner-1.jpg',
        });
      }

      setIsModalOpen(false);
      fetchBanners();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save banner');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this promotional hero banner?')) return;
    try {
      const res = await apiClient.delete(`/admin/banners/${id}`);
      if (res.data.success) {
        setBanners((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete banner');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Hero Promotional Banners</h1>
          <p className="text-xs text-slate-500">Manage storefront homepage hero slider campaigns</p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary !py-2 text-xs font-bold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Banner</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banners.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden flex flex-col justify-between"
          >
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  Slide #{b.sortOrder}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    b.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {b.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>

              <h4 className="font-extrabold text-slate-900 text-sm line-clamp-2">{b.title}</h4>
              <p className="text-xs text-slate-500 line-clamp-2">{b.subtitle}</p>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="bg-brand-red-light text-brand-red font-bold px-2 py-0.5 rounded">
                  CTA: {b.ctaText}
                </span>
                <span className="text-slate-400 text-[11px] truncate max-w-[120px]">{b.linkUrl}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => openEditModal(b)}
                className="p-1.5 text-slate-600 hover:text-brand-red hover:bg-slate-200/60 rounded-lg"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(b.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 animate-in fade-in">
            <h4 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
              {editingId ? 'Edit Hero Banner' : 'Create Promotional Banner'}
            </h4>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Banner Title *</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mega Grocery Festival — Up to 40% OFF"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Subtitle / Details</label>
                <textarea
                  rows={2}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Fresh produce & staples delivered in 15 mins!"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Button CTA Text</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Link Target</label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
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
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
