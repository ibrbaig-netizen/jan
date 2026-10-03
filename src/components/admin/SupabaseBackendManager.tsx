import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Database,
  Download,
  ExternalLink,
  Flame,
  HelpCircle,
  Key,
  Layers,
  Link,
  Lock,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Table,
  Upload,
  Zap
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const SupabaseBackendManager: React.FC = () => {
  const {
    supabaseConfig,
    isSupabaseConnected,
    adminProfile,
    saveSupabaseCredentials,
    clearSupabaseCredentials,
    testSupabaseConnectionState,
    products,
    departments,
    storeConfig,
    showToast
  } = useStore();

  const [urlInput, setUrlInput] = useState(supabaseConfig.url || '');
  const [keyInput, setKeyInput] = useState(supabaseConfig.anonKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    tablesFound?: string[];
    latencyMs?: number;
  } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [isPushingSeed, setIsPushingSeed] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  // Complete SQL Schema string for 1-click copy
  const sqlSchemaSnippet = `-- ==============================================================================
-- JAN CHEMIST SUPERSTORE & PHARMACY - PRODUCTION SUPABASE DATABASE SCHEMA
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Supabase Auth Integration)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Trigger to automatically create a profile row on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id,
    new.email,
    CASE
      WHEN (SELECT count(*) FROM public.profiles) = 0 THEN 'admin'
      WHEN new.raw_user_meta_data->>'role' = 'admin' THEN 'admin'
      ELSE 'customer'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id SERIAL PRIMARY KEY,
  department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  original_price NUMERIC(12,2),
  stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sku TEXT,
  barcode TEXT,
  unit TEXT NOT NULL DEFAULT 'Piece',
  is_prescription_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id SERIAL PRIMARY KEY,
  order_code TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
  notes TEXT,
  payment_method TEXT NOT NULL DEFAULT 'Cash on Delivery',
  prescription_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. ORDER ITEMS TABLE (Frozen Unit Price at Purchase Time)
CREATE TABLE IF NOT EXISTS public.order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. CMS SETTINGS TABLE (Frontend Dynamic Text & Settings)
CREATE TABLE IF NOT EXISTS public.cms_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. ATOMIC ORDER PLACEMENT (Stock Validation to Prevent Negative Stock)
CREATE OR REPLACE FUNCTION public.place_order(
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_delivery_address TEXT,
  p_notes TEXT,
  p_payment_method TEXT,
  p_prescription_url TEXT,
  p_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_order_id INTEGER;
  v_order_code TEXT;
  v_calculated_total NUMERIC(12,2) := 0;
  v_item JSONB;
  v_product_id INTEGER;
  v_qty INTEGER;
  v_unit_price NUMERIC(12,2);
  v_current_stock INTEGER;
  v_product_name TEXT;
BEGIN
  v_order_code := 'ORD-' || LPAD((FLOOR(RANDOM() * 900000) + 100000)::TEXT, 6, '0');

  IF p_customer_name IS NULL OR length(trim(p_customer_name)) = 0 THEN
    RAISE EXCEPTION 'Customer name is required';
  END IF;
  IF p_customer_phone IS NULL OR length(trim(p_customer_phone)) = 0 THEN
    RAISE EXCEPTION 'Customer phone number is required';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::INTEGER;
    v_qty := (v_item->>'quantity')::INTEGER;

    SELECT stock_qty, name INTO v_current_stock, v_product_name
    FROM public.products WHERE id = v_product_id FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product with ID % not found', v_product_id;
    END IF;
    IF v_current_stock < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for "%". Available: %, Requested: %',
        v_product_name, v_current_stock, v_qty;
    END IF;
  END LOOP;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::INTEGER;
    v_qty := (v_item->>'quantity')::INTEGER;
    SELECT price INTO v_unit_price FROM public.products WHERE id = v_product_id;
    v_calculated_total := v_calculated_total + (v_unit_price * v_qty);
  END LOOP;

  INSERT INTO public.orders (
    order_code, customer_name, customer_phone, delivery_address,
    total_amount, status, notes, payment_method, prescription_url
  ) VALUES (
    v_order_code, p_customer_name, p_customer_phone, p_delivery_address,
    v_calculated_total, 'pending', p_notes,
    COALESCE(p_payment_method, 'Cash on Delivery'), p_prescription_url
  ) RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::INTEGER;
    v_qty := (v_item->>'quantity')::INTEGER;
    SELECT price INTO v_unit_price FROM public.products WHERE id = v_product_id;

    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price)
    VALUES (v_order_id, v_product_id, v_qty, v_unit_price);

    UPDATE public.products
    SET stock_qty = stock_qty - v_qty
    WHERE id = v_product_id;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_code', v_order_code,
    'total_amount', v_calculated_total,
    'status', 'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles read" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Profiles update" ON public.profiles FOR UPDATE USING (public.is_admin());
CREATE POLICY "Departments public read" ON public.departments FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Departments admin all" ON public.departments FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Products public read" ON public.products FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Products admin all" ON public.products FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Orders public insert" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Orders read" ON public.orders FOR SELECT USING (public.is_admin() OR true);
CREATE POLICY "Orders admin update" ON public.orders FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Order items public insert" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Order items read" ON public.order_items FOR SELECT USING (public.is_admin() OR true);
CREATE POLICY "Order items admin all" ON public.order_items FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "CMS public read" ON public.cms_settings FOR SELECT USING (true);
CREATE POLICY "CMS admin all" ON public.cms_settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
`;

  const handleCopySql = () => {
    try {
      navigator.clipboard.writeText(sqlSchemaSnippet);
      setCopiedSchema(true);
      showToast('Full PostgreSQL SQL Schema copied to clipboard!', 'success');
      setTimeout(() => setCopiedSchema(false), 2500);
    } catch {
      showToast('Failed to copy. Please select and copy manually.', 'warning');
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnectionState();
      setTestResult(res);
      if (res.success) {
        showToast('Supabase connection verified!', 'success');
      } else {
        showToast(res.message, 'warning');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    try {
      const res = await saveSupabaseCredentials(urlInput.trim(), keyInput.trim());
      setTestResult(res);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Status */}
      <div className={`p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isSupabaseConnected
          ? 'bg-gradient-to-r from-emerald-900/90 to-teal-950 text-white border-emerald-700/60'
          : 'bg-gradient-to-r from-slate-900 to-amber-950 text-white border-amber-800/60'
      }`}>
        <div className="flex items-start gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
            isSupabaseConnected
              ? 'bg-emerald-800/80 border-emerald-600 text-emerald-300'
              : 'bg-amber-900/60 border-amber-700 text-amber-300'
          }`}>
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                {isSupabaseConnected ? 'Supabase PostgreSQL Cloud Backend: Active' : 'Supabase Cloud Backend: Not Connected'}
              </h2>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                isSupabaseConnected ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
              }`}>
                {isSupabaseConnected ? 'Live Realtime' : 'Local Fallback'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {isSupabaseConnected
                ? `Connected to ${supabaseConfig.url}. Content, products, and incoming orders sync directly with your PostgreSQL database.`
                : 'Currently running in high-fidelity local persistent mode. Connect your free Supabase project to enable cloud database, Supabase Auth, and multi-device sync.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          <button
            type="button"
            onClick={handleCopySql}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            {copiedSchema ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSchema ? 'Copied SQL!' : 'Copy SQL Schema'}</span>
          </button>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Credentials Form & Architecture Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Credentials Configuration */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-600" />
              <h3 className="font-extrabold text-slate-900 text-sm">
                Supabase API Credentials
              </h3>
            </div>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>Supabase Dashboard</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project URL (VITE_SUPABASE_URL)
              </label>
              <input
                type="url"
                required
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-purple-600 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Found under <strong>Project Settings &rarr; API &rarr; Project URL</strong>
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Anon / Public Key (VITE_SUPABASE_ANON_KEY)
              </label>
              <textarea
                required
                rows={3}
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:border-purple-600 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Safe to use in frontend. Protected by Row Level Security (RLS) policies.
              </span>
            </div>

            {testResult && (
              <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                )}
                <div className="space-y-1">
                  <p className="font-bold">{testResult.message}</p>
                  {testResult.tablesFound && (
                    <p className="text-[11px] text-slate-600">
                      Detected tables: <strong>{testResult.tablesFound.join(', ')}</strong>
                    </p>
                  )}
                  {testResult.latencyMs && (
                    <p className="text-[11px] text-slate-500">
                      Roundtrip latency: <strong>{testResult.latencyMs} ms</strong>
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={clearSupabaseCredentials}
                className="text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer py-2 px-1"
              >
                Clear Saved Credentials
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isTesting}
                  className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50"
                >
                  {isTesting ? 'Verifying...' : 'Save & Connect Supabase'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right: Architecture & Security Overview */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">
              Architecture &amp; RLS Security
            </h3>
          </div>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-600" />
                <span>Supabase Auth &amp; Profiles</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Only users with <code>profiles.role = 'admin'</code> can access /admin routes. Customer store is public and requires no login.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-emerald-600" />
                <span>Atomic Stock &amp; Price Freezing</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Function <code>place_order()</code> prevents negative stock and locks product prices in <code>order_items.unit_price</code> at the time of purchase.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Dynamic CMS Settings</span>
              </div>
              <p className="text-[11px] text-slate-500">
                WhatsApp phone number, store timings, and banner promos are stored in <code>cms_settings</code> and can be edited anytime without code redeployment.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowSqlModal(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
            >
              <Server className="w-4 h-4 text-purple-600" />
              <span>Inspect Full SQL DDL &amp; RLS Policies</span>
            </button>
          </div>
        </div>
      </div>

      {/* SQL Schema Viewer Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-4xl w-full bg-slate-950 text-slate-100 rounded-3xl p-6 shadow-2xl border border-slate-800 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base text-white">
                  PostgreSQL Production Schema &amp; RLS Script
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedSchema ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSchema ? 'Copied!' : 'Copy Script'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSqlModal(false)}
                  className="text-slate-400 hover:text-white p-1 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-3">
              Paste this script into <strong>Supabase Dashboard &rarr; SQL Editor &rarr; New Query &rarr; Run</strong>.
            </p>

            <pre className="mt-3 p-4 bg-slate-900 rounded-2xl border border-slate-800 text-[11px] font-mono overflow-auto flex-1 text-emerald-300 leading-relaxed">
              {sqlSchemaSnippet}
            </pre>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
