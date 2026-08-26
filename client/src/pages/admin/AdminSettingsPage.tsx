import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient } from '../../api/client';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<{ [key: string]: string }>({
    STORE_NAME: 'BIG BASKET',
    STORE_TAGLINE: 'Fresh Groceries & Daily Essentials',
    STORE_PHONE: '+91 98765 43210',
    STORE_EMAIL: 'support@bigbasket.local',
    STORE_ADDRESS: 'Shop 14, Ground Floor, Central Plaza, Main Market, Indore, MP 452001',
    DELIVERY_FEE: '40',
    FREE_DELIVERY_THRESHOLD: '499',
    TAX_PERCENTAGE: '5',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    apiClient.get('/admin/settings').then((res) => {
      setIsLoading(false);
      if (res.data.success && res.data.data) {
        const map: { [key: string]: string } = {};
        res.data.data.forEach((s: any) => {
          map[s.key] = s.value;
        });
        setSettings((prev) => ({ ...prev, ...map }));
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setSuccessMsg('');
      const res = await apiClient.put('/admin/settings', { settings });
      if (res.data.success) {
        setSuccessMsg('Store settings saved successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-slate-500">
        Loading store configuration...
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-xl font-extrabold text-slate-900">Store Settings & Configuration</h1>
        <p className="text-xs text-slate-500">
          Manage storefront branding, hotline, delivery fee structure and taxes
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Branding & Contact Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Store Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Official Brand Name</label>
              <input
                required
                type="text"
                value={settings.STORE_NAME || ''}
                onChange={(e) => setSettings({ ...settings, STORE_NAME: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Brand Tagline</label>
              <input
                required
                type="text"
                value={settings.STORE_TAGLINE || ''}
                onChange={(e) => setSettings({ ...settings, STORE_TAGLINE: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Customer Helpline Phone</label>
              <input
                required
                type="text"
                value={settings.STORE_PHONE || ''}
                onChange={(e) => setSettings({ ...settings, STORE_PHONE: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Support Email</label>
              <input
                required
                type="email"
                value={settings.STORE_EMAIL || ''}
                onChange={(e) => setSettings({ ...settings, STORE_EMAIL: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Physical Storefront Address</label>
              <input
                required
                type="text"
                value={settings.STORE_ADDRESS || ''}
                onChange={(e) => setSettings({ ...settings, STORE_ADDRESS: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Pricing, Delivery & Tax Rules */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Delivery & Tax Rates
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Standard Delivery Fee (₹)</label>
              <input
                required
                type="number"
                value={settings.DELIVERY_FEE || '40'}
                onChange={(e) => setSettings({ ...settings, DELIVERY_FEE: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Free Delivery Min Order (₹)</label>
              <input
                required
                type="number"
                value={settings.FREE_DELIVERY_THRESHOLD || '499'}
                onChange={(e) => setSettings({ ...settings, FREE_DELIVERY_THRESHOLD: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Standard GST Tax Rate (%)</label>
              <input
                required
                type="number"
                value={settings.TAX_PERCENTAGE || '5'}
                onChange={(e) => setSettings({ ...settings, TAX_PERCENTAGE: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary !py-2.5 !px-6 text-xs font-bold flex items-center gap-1.5 shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
