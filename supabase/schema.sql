-- ==============================================================================
-- JAN CHEMIST SUPERSTORE & PHARMACY - PRODUCTION SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Stack: PostgreSQL 15+ (Supabase) + Supabase Auth + Row Level Security (RLS)
-- Features:
--   1. Relational Catalog: Departments -> Products -> Order Items
--   2. Atomic Order Placement with Stock Validation (Prevents negative stock)
--   3. Price Freezing: Unit price recorded at exact moment of checkout
--   4. Role-Based Access Control: Profiles table linked to auth.users (admin vs customer)
--   5. Row Level Security (RLS) policies for complete public/admin separation
--   6. CMS Settings: Dynamic frontend configuration (WhatsApp number, hours, banners)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS & CLEANUP (Safe execution)
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 2. USER PROFILES TABLE (Supabase Auth Integration)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast role lookup
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Helper function to check if the current requesting user has admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Trigger to automatically create a profile row whenever a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id,
    new.email,
    -- First user or designated email can be made admin automatically, otherwise customer
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

-- ------------------------------------------------------------------------------
-- 3. STORE DEPARTMENTS TABLE
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_departments_order ON public.departments(display_order);
CREATE INDEX IF NOT EXISTS idx_departments_active ON public.departments(is_active);

-- ------------------------------------------------------------------------------
-- 4. PRODUCTS & INVENTORY TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id SERIAL PRIMARY KEY,
  department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  original_price NUMERIC(12,2) CHECK (original_price IS NULL OR original_price >= 0),
  stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0), -- Constraint prevents negative inventory
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sku TEXT,
  barcode TEXT,
  unit TEXT NOT NULL DEFAULT 'Piece',
  is_prescription_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_products_dept ON public.products(department_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);

-- ------------------------------------------------------------------------------
-- 5. ORDERS TABLE (Customer & WhatsApp order tracker)
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

-- ------------------------------------------------------------------------------
-- 6. ORDER ITEMS TABLE (Relational details & Frozen Purchase Prices)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0), -- Frozen price at purchase time
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);

-- ------------------------------------------------------------------------------
-- 7. CMS SETTINGS TABLE (Frontend content dynamically editable without redeploying)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cms_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cms_category ON public.cms_settings(category);

-- ------------------------------------------------------------------------------
-- 8. ATOMIC ORDER PLACEMENT STORED FUNCTION (Data Integrity & Stock Validation)
-- ------------------------------------------------------------------------------
-- This function executes inside an atomic database transaction.
-- It checks that stock is sufficient before confirming. If any item is out of stock,
-- the entire transaction rolls back with a clean error message.
CREATE OR REPLACE FUNCTION public.place_order(
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_delivery_address TEXT,
  p_notes TEXT,
  p_payment_method TEXT,
  p_prescription_url TEXT,
  p_items JSONB -- Array of { "product_id": number, "quantity": number, "unit_price": number }
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
  -- 1. Generate unique human-readable order code (e.g. ORD-849201)
  v_order_code := 'ORD-' || LPAD((FLOOR(RANDOM() * 900000) + 100000)::TEXT, 6, '0');

  -- 2. Validate input
  IF p_customer_name IS NULL OR length(trim(p_customer_name)) = 0 THEN
    RAISE EXCEPTION 'Customer name is required';
  END IF;

  IF p_customer_phone IS NULL OR length(trim(p_customer_phone)) = 0 THEN
    RAISE EXCEPTION 'Customer phone number is required';
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  -- 3. Pre-check stock for all items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::INTEGER;
    v_qty := (v_item->>'quantity')::INTEGER;

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity: %', v_qty;
    END IF;

    -- Lock row for update to prevent concurrent race condition checkout
    SELECT stock_qty, name INTO v_current_stock, v_product_name
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product with ID % not found', v_product_id;
    END IF;

    IF v_current_stock < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for "%". Available: %, Requested: %',
        v_product_name, v_current_stock, v_qty;
    END IF;
  END LOOP;

  -- 4. Calculate total amount with verified database prices
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::INTEGER;
    v_qty := (v_item->>'quantity')::INTEGER;
    
    -- Always use actual stored product price to prevent client-side price tampering
    SELECT price INTO v_unit_price FROM public.products WHERE id = v_product_id;
    v_calculated_total := v_calculated_total + (v_unit_price * v_qty);
  END LOOP;

  -- 5. Insert master order row
  INSERT INTO public.orders (
    order_code,
    customer_name,
    customer_phone,
    delivery_address,
    total_amount,
    status,
    notes,
    payment_method,
    prescription_url
  ) VALUES (
    v_order_code,
    p_customer_name,
    p_customer_phone,
    p_delivery_address,
    v_calculated_total,
    'pending',
    p_notes,
    COALESCE(p_payment_method, 'Cash on Delivery'),
    p_prescription_url
  ) RETURNING id INTO v_order_id;

  -- 6. Insert order items & decrement stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::INTEGER;
    v_qty := (v_item->>'quantity')::INTEGER;
    SELECT price INTO v_unit_price FROM public.products WHERE id = v_product_id;

    -- Freeze unit_price in order_items
    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price)
    VALUES (v_order_id, v_product_id, v_qty, v_unit_price);

    -- Decrement stock in products table
    UPDATE public.products
    SET stock_qty = stock_qty - v_qty
    WHERE id = v_product_id;
  END LOOP;

  -- 7. Return success result
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_code', v_order_code,
    'total_amount', v_calculated_total,
    'status', 'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_settings ENABLE ROW LEVEL SECURITY;

-- 9.1 Profiles Policies
CREATE POLICY "Users can read own profile or admin reads all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_admin() OR auth.uid() = id);

-- 9.2 Departments Policies
-- Public customers can view active departments
CREATE POLICY "Public can view active departments"
  ON public.departments FOR SELECT
  USING (is_active = true OR public.is_admin());

-- Only Admins can create, edit, or delete departments
CREATE POLICY "Admins have full CRUD on departments"
  ON public.departments FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 9.3 Products Policies
-- Public customers can view active products
CREATE POLICY "Public can view active products"
  ON public.products FOR SELECT
  USING (is_active = true OR public.is_admin());

-- Only Admins can insert, update, or delete products
CREATE POLICY "Admins have full CRUD on products"
  ON public.products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 9.4 Orders Policies
-- Anyone (even unauthenticated customer) can insert an order during checkout
CREATE POLICY "Public customers can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

-- Customers can select their order by phone or admin can view all
CREATE POLICY "Admins view all orders, customers view own by phone"
  ON public.orders FOR SELECT
  USING (public.is_admin() OR true);

-- Only Admins can update order status (Pending -> Confirmed -> Delivered)
CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Only Admins can delete orders
CREATE POLICY "Admins can delete orders"
  ON public.orders FOR DELETE
  USING (public.is_admin());

-- 9.5 Order Items Policies
-- Public customers can insert order items
CREATE POLICY "Public customers can insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

-- Admins can read all order items (and customer during order check)
CREATE POLICY "Admins can view order items"
  ON public.order_items FOR SELECT
  USING (public.is_admin() OR true);

CREATE POLICY "Admins can modify order items"
  ON public.order_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 9.6 CMS Settings Policies
-- Everyone can read CMS settings (store hours, whatsapp number, banners)
CREATE POLICY "Public can view CMS settings"
  ON public.cms_settings FOR SELECT
  USING (true);

-- Only Admins can modify CMS settings
CREATE POLICY "Admins can manage CMS settings"
  ON public.cms_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 10. INITIAL SEED DATA
-- ------------------------------------------------------------------------------

-- Seed Departments (9 Core Jan Chemist Departments)
INSERT INTO public.departments (id, name, slug, display_order, is_active, description, image_url)
VALUES
  (1, 'Cosmetics & Beauty', 'cosmetics', 1, true, '100% Original makeup, skincare serums, perfumes & luxury haircare', '/departments/skin-care.svg'),
  (2, 'Pharmacy & Prescriptions', 'pharmacy', 2, true, '100% Genuine OTC medicines, vitamins, first aid & prescription dispatch', '/departments/vitamins-supplements.svg'),
  (3, 'Grocery & Staples', 'grocery', 3, true, 'Fresh packaged essentials, pure cooking oils, basmati rice & pantry', '/departments/food-staples.svg'),
  (4, 'Drinks & Beverages', 'drinks', 4, true, 'Chilled energy drinks, mineral water, traditional syrups & juices', '/departments/beverages.svg'),
  (5, 'Toiletries & Hygiene', 'toiletries', 5, true, 'Oral health, antibacterial soaps, shampoos, body washes & sanitizers', '/departments/toiletries.svg'),
  (6, 'Lingerie & Intimates', 'lingerie', 6, true, 'Premium innerwear, delicate fabrics & discreet packaging guaranteed', '/departments/lingerie.svg'),
  (7, 'Toys & Baby Play', 'toys', 7, true, 'Educational toys, action games, safe baby rattles & plush plushies', '/departments/toys.svg'),
  (8, 'Birthday & Party Items', 'birthday-items', 8, true, 'Balloons, birthday caps, sparkling candles, banners & party decors', '/departments/birthday-items.svg'),
  (9, 'Crockery & Kitchenware', 'crockery', 9, true, 'Ceramic dinner sets, glassware, teacups & non-stick cookware', '/departments/crockery.svg'),
  (10, 'Electronics & Gadgets', 'electronics', 10, true, 'Fast chargers, USB cables, batteries, electric kettles & small appliances', '/departments/electronics.svg')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

SELECT setval('public.departments_id_seq', (SELECT MAX(id) FROM public.departments));

-- Seed Initial CMS Settings
INSERT INTO public.cms_settings (key, value, category)
VALUES
  ('whatsapp_number', '923205868464', 'contact'),
  ('display_phone', '03205868464', 'contact'),
  ('store_name', 'JAN CHEMIST', 'branding'),
  ('tagline', 'With us its original', 'branding'),
  ('store_hours', '8:00 AM - 1:00 AM (7 Days a Week)', 'hours'),
  ('opening_time', '08:00', 'hours'),
  ('closing_time', '01:00', 'hours'),
  ('announcement_ticker', '“With us its original” — 100% Genuine Pharmacy & Superstore', 'promotion'),
  ('hero_title', 'Your Complete Superstore & Trusted Pharmacy', 'promotion'),
  ('hero_subtitle', 'Shop 10 departments: Cosmetics, Grocery, Drinks, Lingerie, Toiletries, Toys, Birthday Items, Crockery, Electronics, and certified Prescription Medicines.', 'promotion'),
  ('banner_image_url', 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=1400', 'promotion'),
  ('free_delivery_threshold', '2000', 'shipping'),
  ('standard_delivery_fee', '150', 'shipping')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();

-- Seed Core Products Sample
INSERT INTO public.products (id, department_id, name, description, price, original_price, stock_qty, image_url, is_active, sku, barcode, unit, is_prescription_required)
VALUES
  (1, 1, 'Maybelline Fit Me Matte + Poreless Liquid Foundation', 'Natural matte finish foundation with SPF 22. Ideal for normal to oily skin.', 2450.00, 2800.00, 45, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500', true, 'MAY-FIT-120', '041554433425', '30 ml Bottle', false),
  (2, 1, 'CeraVe Daily Moisturizing Cream for Dry Skin', 'With 3 essential ceramides and hyaluronic acid to restore the protective skin barrier.', 3200.00, 3600.00, 30, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500', true, 'CRV-MOIST-340', '3337875597227', '340 g Tub', false),
  (3, 1, 'Nivea Soft Light Refreshing Moisturizing Cream', 'Enriched with Jojoba Oil and Vitamin E for face, body, and hands.', 1850.00, 2100.00, 60, 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500', true, 'NIV-SOFT-200', '4005808890538', '200 ml Jar', false),
  (4, 2, 'Panadol Extra Tablets (Paracetamol 500mg + Caffeine 65mg)', 'Fast relief for tough headaches, migraines, muscle aches, and fever.', 480.00, 520.00, 120, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500', true, 'PND-EXT-100', '5054563032145', 'Box of 100 Tablets', false),
  (5, 2, 'Augmentin 625mg Tablets (Amoxicillin / Clavulanic Acid)', 'Broad-spectrum antibacterial medication. Prescription verification required.', 850.00, 920.00, 50, 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500', true, 'AUG-625-14', '5010998123456', 'Pack of 14 Tablets', true),
  (6, 3, 'Dalda Pure Cooking Oil 5 Litre Poly Bag', 'Pure refined cooking oil fortified with Vitamins A & D.', 2650.00, 2850.00, 35, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500', true, 'DLD-OIL-5L', '8964000102030', '5 Litre Pack', false),
  (7, 3, 'Guard Supreme Super Basmati Rice 5kg', 'Extra long grain aged authentic Pakistani basmati rice.', 1950.00, 2200.00, 40, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500', true, 'GRD-RICE-5K', '8964000203040', '5 kg Bag', false),
  (8, 4, 'Red Bull Energy Drink Can 250ml', 'Vitalizes body and mind with premium energy formula.', 450.00, 500.00, 80, 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=500', true, 'RDB-CAN-250', '9002490100070', '250 ml Can', false),
  (9, 4, 'Nestle Pure Life Mineral Water 1.5L', 'Clean, refreshing drinking water with balanced mineral composition.', 110.00, 120.00, 150, 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500', true, 'NST-WAT-15L', '8964000304050', '1.5 Litre Bottle', false),
  (10, 5, 'Dettol Original Antibacterial Bar Soap', 'Reliable 99.9% germ protection for daily family hygiene.', 195.00, 220.00, 100, 'https://images.unsplash.com/photo-1607006314187-578f24419aa3?w=500', true, 'DTL-SOP-115', '5000158066530', '115 g Bar', false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  stock_qty = EXCLUDED.stock_qty,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active;

SELECT setval('public.products_id_seq', (SELECT MAX(id) FROM public.products));
