import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  MapPin,
  Lock,
  LogOut,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Address } from '../../types';
import { apiClient } from '../../api/client';

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'security'>('profile');

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Addresses state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: 'Indore',
    state: 'Madhya Pradesh',
    postalCode: '452001',
    addressType: 'HOME' as 'HOME' | 'WORK' | 'OTHER',
    isDefault: false,
  });

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    // Fetch addresses
    apiClient.get('/addresses').then((res) => {
      if (res.data.success) {
        setAddresses(res.data.data);
      }
    });
  }, [isAuthenticated, navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdatingProfile(true);
      setProfileMsg('');
      const res = await apiClient.put('/auth/profile', { name, phone });
      if (res.data.success) {
        updateUser(res.data.data);
        setProfileMsg('Profile updated successfully!');
      }
    } catch (err: any) {
      setProfileMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/addresses', newAddress);
      if (res.data.success) {
        setAddresses((prev) => [...prev, res.data.data]);
        setIsAddressModalOpen(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add address.');
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Are you sure you want to remove this address?')) return;
    try {
      const res = await apiClient.delete(`/addresses/${id}`);
      if (res.data.success) {
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete address.');
    }
  };

  const handleSetDefaultAddress = async (id: number) => {
    try {
      const res = await apiClient.patch(`/addresses/${id}/default`);
      if (res.data.success) {
        setAddresses((prev) =>
          prev.map((a) => ({ ...a, isDefault: a.id === id }))
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update default address.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg('New passwords do not match.');
      return;
    }
    try {
      setIsUpdatingPassword(true);
      setPasswordMsg('');
      const res = await apiClient.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      if (res.data.success) {
        setPasswordMsg('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordMsg(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-xl font-extrabold text-slate-900">My Account</h1>
        <p className="text-xs text-slate-500">Manage your profile, delivery addresses and security</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Navigation Tabs */}
        <aside className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-subtle space-y-1 h-fit">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors ${
              activeTab === 'profile'
                ? 'bg-brand-red-light text-brand-red'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Profile Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('addresses')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors ${
              activeTab === 'addresses'
                ? 'bg-brand-red-light text-brand-red'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Saved Addresses</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors ${
              activeTab === 'security'
                ? 'bg-brand-red-light text-brand-red'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Change Password</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Admin Dashboard</span>
            </button>
          )}

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-left text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Right Content */}
        <main className="md:col-span-3">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                Personal Information
              </h3>

              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs max-w-md">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                  <input
                    disabled
                    type="email"
                    value={user?.email || ''}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Email address cannot be changed</span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                {profileMsg && (
                  <p
                    className={`text-xs font-semibold ${
                      profileMsg.includes('success') ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {profileMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="btn-primary text-xs font-bold"
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-sm text-slate-900">Saved Addresses</h3>
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(true)}
                  className="btn-outline-red !py-1 text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Address</span>
                </button>
              </div>

              {addresses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{addr.fullName}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                            {addr.addressType}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                              Default
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {addr.addressLine1}, {addr.addressLine2 ? `${addr.addressLine2}, ` : ''}
                        {addr.landmark ? `Near ${addr.landmark}, ` : ''}
                        {addr.city}, {addr.state} - {addr.postalCode}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">📱 {addr.phone}</p>

                      <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                        {!addr.isDefault ? (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-[11px] font-semibold text-slate-600 hover:text-brand-red"
                          >
                            Set as Default
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Default Delivery
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-rose-600 hover:underline flex items-center gap-1 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4">No delivery addresses saved yet.</p>
              )}
            </div>
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === 'security' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                Update Password
              </h3>

              <form onSubmit={handleChangePassword} className="space-y-4 text-xs max-w-md">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Current Password</label>
                  <input
                    required
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">New Password (Min 6 chars)</label>
                  <input
                    required
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Confirm New Password</label>
                  <input
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                {passwordMsg && (
                  <p
                    className={`text-xs font-semibold ${
                      passwordMsg.includes('success') ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {passwordMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="btn-primary text-xs font-bold"
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* ADD ADDRESS MODAL */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in">
            <h4 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
              Add New Address
            </h4>

            <form onSubmit={handleAddAddress} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                  <input
                    required
                    type="text"
                    value={newAddress.fullName}
                    onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mobile Phone</label>
                  <input
                    required
                    type="tel"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Flat / House No.</label>
                <input
                  required
                  type="text"
                  value={newAddress.addressLine1}
                  onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Area / Colony</label>
                <input
                  type="text"
                  value={newAddress.addressLine2}
                  onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">City</label>
                  <input
                    required
                    type="text"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">PIN Code</label>
                  <input
                    required
                    type="text"
                    value={newAddress.postalCode}
                    onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs font-bold">
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
