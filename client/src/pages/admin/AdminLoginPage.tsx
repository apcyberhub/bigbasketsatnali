import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { BrandLogo } from '../../components/common/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [emailOrPhone, setEmailOrPhone] = useState('admin@bigbasket.local');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setErrorMsg('');
      const res = await apiClient.post('/auth/login', {
        emailOrPhone,
        password,
      });

      if (res.data.success && res.data.data) {
        const { user, token } = res.data.data;
        if (user.role !== 'ADMIN') {
          setErrorMsg('Access Denied: You do not have Administrator permissions.');
          return;
        }
        login(token, user);
        navigate('/admin');
      } else {
        setErrorMsg(res.data.message || 'Invalid credentials');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Admin authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <BrandLogo size="lg" variant="light" />
          </div>
          <div className="inline-flex items-center gap-1.5 bg-brand-red/20 text-red-400 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Store Administrator Portal</span>
          </div>
          <h1 className="text-xl font-extrabold text-white">Admin Sign In</h1>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/80 border border-rose-600/50 rounded-xl text-xs font-semibold text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label htmlFor="admin-email" className="font-semibold text-slate-300 block mb-1">
              Admin Email or Username
            </label>
            <div className="relative">
              <input
                id="admin-email"
                required
                type="text"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-red focus:outline-none"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" className="font-semibold text-slate-300 block mb-1">
              Admin Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-red focus:outline-none"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-md"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Access Admin Control Panel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-700/60">
          <p className="text-[11px] text-slate-400">
            Default credentials: <code className="text-amber-400">admin@bigbasket.local</code> /{' '}
            <code className="text-amber-400">admin123</code>
          </p>
        </div>
      </div>
    </div>
  );
};
