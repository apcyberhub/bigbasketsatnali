import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { BrandLogo } from '../../components/common/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const { login } = useAuth();

  // Login Mode: 'otp-flow' (OTP + Password) or 'direct-password'
  const [authStep, setAuthStep] = useState<'IDENTIFIER' | 'OTP_AND_PASSWORD'>('IDENTIFIER');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState<{
    otpCode?: string;
    role?: string;
    userName?: string;
    msg?: string;
  } | null>(null);

  const [resendTimer, setResendTimer] = useState(0);

  // Timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // 1. Send OTP Step
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) {
      setErrorMsg('Please enter your registered Mobile Number or Email Address.');
      return;
    }

    try {
      setIsSendingOtp(true);
      setErrorMsg('');
      const res = await apiClient.post('/auth/send-otp', {
        emailOrPhone: emailOrPhone.trim(),
      });

      if (res.data.success) {
        setSuccessInfo({
          otpCode: res.data.data.otp,
          role: res.data.data.role,
          userName: res.data.data.name,
          msg: `Verification OTP sent to ${emailOrPhone.trim()}`,
        });
        setOtp(res.data.data.otp || '123456'); // Auto-fill demo OTP for effortless experience
        setAuthStep('OTP_AND_PASSWORD');
        setResendTimer(45);
      } else {
        setErrorMsg(res.data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // 2. Final Login Verification (OTP + Password)
  const handleFinalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Please enter your account password to verify login.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg('');

      const res = await apiClient.post('/auth/login', {
        emailOrPhone: emailOrPhone.trim(),
        password,
        otp: otp.trim() || undefined,
      });

      if (res.data.success && res.data.data) {
        const { token, user } = res.data.data;
        login(token, user);

        // Smart Role-Based Redirection
        if (user.role === 'ADMIN') {
          setSuccessInfo({
            msg: '🛡️ Administrator credentials verified! Redirecting to Admin Portal...',
          });
          setTimeout(() => {
            navigate('/admin');
          }, 800);
        } else {
          setSuccessInfo({
            msg: `🧺 Welcome back, ${user.name}! Redirecting...`,
          });
          setTimeout(() => {
            navigate(redirect);
          }, 800);
        }
      } else {
        setErrorMsg(res.data.message || 'Invalid credentials');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Login failed. Please check your OTP and password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex flex-col justify-center items-center px-4 py-12 bg-slate-50/60">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-elevated space-y-6">
        {/* BRAND HEADER */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <BrandLogo size="lg" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            {authStep === 'IDENTIFIER' ? 'Sign In to Big Basket' : 'Verify & Login'}
          </h1>
          <p className="text-xs text-slate-500">
            {authStep === 'IDENTIFIER'
              ? 'Enter Mobile Number or Email to access Customer or Admin portal'
              : `Enter 6-digit OTP & Password for ${emailOrPhone}`}
          </p>
        </div>

        {/* ERROR NOTIFICATION */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SUCCESS NOTIFICATION & OTP HELPER BANNER */}
        {successInfo?.msg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <div className="space-y-1">
              <p>{successInfo.msg}</p>
              {successInfo.otpCode && (
                <p className="font-mono text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded text-[11px] inline-block font-bold">
                  Demo OTP: {successInfo.otpCode}
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: ENTER MOBILE NUMBER OR EMAIL */}
        {authStep === 'IDENTIFIER' ? (
          <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
            <div>
              <label htmlFor="login-identifier" className="font-bold text-slate-700 block mb-1.5">
                Mobile Number or Email Address
              </label>
              <div className="relative">
                <input
                  id="login-identifier"
                  required
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="e.g. 9876500001 or customer@bigbasket.local"
                  className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-red focus:border-brand-red focus:outline-none transition-all"
                  autoFocus
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Enter your registered 10-digit mobile number or official email.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSendingOtp}
              className="btn-primary w-full !py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              {isSendingOtp ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send Verification OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: ENTER OTP & ACCOUNT PASSWORD */
          <form onSubmit={handleFinalLogin} className="space-y-4 text-xs">
            {/* OTP Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-otp" className="font-bold text-slate-700">
                  6-Digit Verification OTP *
                </label>
                {resendTimer > 0 ? (
                  <span className="text-[11px] text-slate-400">Resend in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-[11px] font-bold text-brand-red hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend OTP</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="login-otp"
                  required
                  maxLength={6}
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold tracking-widest text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-red focus:outline-none"
                  autoFocus
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-pass" className="font-bold text-slate-700">
                  Account Password *
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-semibold text-brand-red hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-pass"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-red focus:outline-none"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full !py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-md"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Login Securely</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthStep('IDENTIFIER');
                  setErrorMsg('');
                }}
                className="w-full py-2 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
              >
                ← Change Mobile Number / Email
              </button>
            </div>
          </form>
        )}

        {/* DEMO / QUICK REFERENCE ACCORDION */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <p className="text-center text-xs text-slate-600">
            Don&apos;t have an account?{' '}
            <Link
              to={`/register?redirect=${redirect}`}
              className="font-bold text-brand-red hover:underline"
            >
              Register as New Customer
            </Link>
          </p>

          <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-1 border border-slate-100">
            <span className="font-bold text-slate-800 block text-xs">⚡ Verified Login Test Credentials:</span>
            <div className="flex items-center justify-between text-slate-700 pt-0.5">
              <span>Customer: <code>9876500001</code> (Pass: <code>customer123</code>)</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Store Buyer</span>
            </div>
            <div className="flex items-center justify-between text-slate-700 pt-0.5">
              <span>Admin: <code>9876543210</code> (Pass: <code>admin123</code>)</span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">Admin Dashboard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
