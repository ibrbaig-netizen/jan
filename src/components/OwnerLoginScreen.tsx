import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Store,
  UserPlus
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { JanChemistLogo } from './JanChemistLogo';

export const OwnerLoginScreen: React.FC = () => {
  const {
    authenticateOwner,
    loginAdminWithSupabase,
    signupAdminWithSupabase,
    navigateToCustomerStore,
    storeConfig,
    isSupabaseConnected,
    supabaseConfig,
    saveSupabaseCredentials
  } = useStore();

  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'pin'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [cfgUrl, setCfgUrl] = useState(supabaseConfig.url || '');
  const [cfgAnonKey, setCfgAnonKey] = useState(supabaseConfig.anonKey || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSupabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    if (authMode === 'signup') {
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        setIsSubmitting(false);
        return;
      }
      const res = await signupAdminWithSupabase(email, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create admin user.');
      } else {
        setSuccessMsg('Admin user registered! Logging in...');
      }
    } else {
      const res = await loginAdminWithSupabase(email, password);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid admin credentials or role not set to "admin".');
      }
    }
    setIsSubmitting(false);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg('Please enter your owner security PIN.');
      return;
    }

    const success = authenticateOwner(pin);
    if (!success) {
      setErrorMsg('Incorrect owner PIN. Default is 1234.');
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const test = await saveSupabaseCredentials(cfgUrl, cfgAnonKey);
    setIsSubmitting(false);
    if (test.success) {
      setShowConfigModal(false);
      setSuccessMsg('Supabase connected! You can now log in with Supabase Auth.');
    } else {
      setErrorMsg(test.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between py-2">
        <button
          onClick={navigateToCustomerStore}
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300 hover:text-white transition bg-white/10 hover:bg-white/15 px-3 py-2 rounded-xl backdrop-blur-xs cursor-pointer border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Customer Storefront</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Supabase Status Pill */}
          <div
            onClick={() => setShowConfigModal(true)}
            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition border ${
              isSupabaseConnected
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                : 'bg-amber-950/80 text-amber-300 border-amber-700 hover:bg-amber-900'
            }`}
            title="Click to configure Supabase Project credentials"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isSupabaseConnected ? 'Supabase Connected' : 'Connect Supabase'}</span>
          </div>

          <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Role: Admin Protected</span>
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          {/* Card Top Branding */}
          <div className="bg-[#248243] p-7 text-center text-white relative">
            <div className="inline-block p-1 bg-white/15 rounded-2xl mb-2.5 shadow-inner">
              <JanChemistLogo size="md" variant="transparent-light" showTagline={false} />
            </div>

            <h2 className="text-xl font-black tracking-tight text-white mt-1">
              Admin &amp; Management Dashboard
            </h2>
            <p className="text-xs text-emerald-100 mt-1 max-w-xs mx-auto">
              Secure Cloud Backend for Inventory, Real-Time Orders, Departments &amp; CMS.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg('');
              }}
              className={`flex-1 py-3 text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'login'
                  ? 'bg-white text-emerald-700 border-b-2 border-emerald-600 font-extrabold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Supabase Login</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMsg('');
              }}
              className={`flex-1 py-3 text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'signup'
                  ? 'bg-white text-emerald-700 border-b-2 border-emerald-600 font-extrabold'
                  : 'hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Admin Setup</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('pin');
                setErrorMsg('');
              }}
              className={`py-3 px-3 text-center transition cursor-pointer flex items-center justify-center gap-1.5 text-slate-500 ${
                authMode === 'pin'
                  ? 'bg-white text-purple-700 border-b-2 border-purple-600 font-extrabold'
                  : 'hover:text-slate-900'
              }`}
              title="Local PIN Mode for offline development / preview"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>PIN Mode</span>
            </button>
          </div>

          {/* Messages */}
          <div className="px-7 pt-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600 mt-1 shrink-0"></span>
                <span className="font-semibold leading-relaxed">{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}
          </div>

          {/* Form */}
          {authMode === 'pin' ? (
            <form onSubmit={handlePinSubmit} className="p-7 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Local Security PIN:
                  </label>
                  <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded">
                    Default: {storeConfig.adminPin || '1234'}
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <KeyRound className="w-4 h-4" />
                  </div>

                  <input
                    type={showPassword ? 'text' : 'password'}
                    maxLength={10}
                    required
                    value={pin}
                    onChange={e => {
                      setPin(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="PIN (Default: 1234)"
                    className="w-full pl-10 pr-10 py-3.5 text-center text-xl font-mono tracking-widest bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <span>Local preview bypass</span>
                <button
                  type="button"
                  onClick={() => setPin(storeConfig.adminPin || '1234')}
                  className="text-purple-700 font-bold hover:underline cursor-pointer"
                >
                  Use PIN (1234)
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Log In via PIN</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleSupabaseSubmit} className="p-7 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Admin Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@janchemist.com"
                    className="w-full pl-10 pr-3.5 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isSupabaseConnected && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 space-y-1.5">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-amber-600" />
                    <span>Supabase project not connected yet</span>
                  </p>
                  <p className="text-amber-700">
                    You can either connect your Supabase credentials or use the <strong>PIN Mode</strong> tab with <strong>1234</strong> to enter the dashboard.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(true)}
                    className="font-bold text-emerald-800 underline hover:text-emerald-950 cursor-pointer"
                  >
                    Configure Supabase Keys Now &rarr;
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {authMode === 'signup' ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>{isSubmitting ? 'Creating Admin...' : 'Create Admin Account'}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>{isSubmitting ? 'Verifying...' : 'Sign In as Admin'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer of card */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="text-emerald-700 hover:underline cursor-pointer font-semibold flex items-center gap-1"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Project Settings</span>
            </button>

            <button
              type="button"
              onClick={navigateToCustomerStore}
              className="text-slate-600 hover:text-slate-900 cursor-pointer flex items-center gap-1"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Customer Store</span>
            </button>
          </div>
        </div>
      </div>

      {/* Supabase Connection Setup Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white text-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base">Connect Supabase Cloud Backend</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3">
              Enter your project URL and anon public key from your <strong>Supabase Dashboard &rarr; Project Settings &rarr; API</strong>.
            </p>

            <form onSubmit={handleSaveCredentials} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supabase Project URL:
                </label>
                <input
                  type="url"
                  required
                  value={cfgUrl}
                  onChange={e => setCfgUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Anon / Public API Key:
                </label>
                <textarea
                  required
                  rows={3}
                  value={cfgAnonKey}
                  onChange={e => setCfgAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800">
                💡 <strong>Tip:</strong> You can also copy the complete SQL schema script inside the Admin Dashboard to run in Supabase SQL editor.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Testing Connection...' : 'Save & Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer copyright */}
      <div className="text-center text-slate-500 text-xs py-2">
        JAN CHEMIST &bull; &ldquo;{storeConfig.tagline}&rdquo; &bull; Admin Zone Protected with Supabase Auth
      </div>
    </div>
  );
};
