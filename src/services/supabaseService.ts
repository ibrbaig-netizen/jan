import { getSupabaseClient } from '../lib/supabase';
import { DepartmentId, DepartmentInfo, OrderLog, OrderStatus, Product, UserProfile } from '../types';

/**
 * Maps Supabase products table row to frontend Product type.
 */
function mapSupabaseProduct(row: any, departmentsMap: Map<number | string, DepartmentInfo>): Product {
  const deptInfo = row.department_id ? departmentsMap.get(row.department_id) : null;
  const deptSlug: DepartmentId = deptInfo ? deptInfo.id : 'grocery';

  return {
    id: String(row.id),
    name: row.name || 'Unnamed Product',
    department: deptSlug,
    departmentId: row.department_id,
    category: deptInfo?.name || row.category || 'General',
    price: Number(row.price) || 0,
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    stock: Number(row.stock_qty ?? row.stock ?? 0),
    unit: row.unit || 'Piece',
    sku: row.sku || `SKU-${row.id}`,
    barcode: row.barcode || '',
    description: row.description || '',
    image: row.image_url || row.image || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500',
    inStock: Number(row.stock_qty ?? row.stock ?? 0) > 0,
    isOriginalGuaranteed: true,
    isActive: row.is_active !== false,
    isPrescriptionRequired: Boolean(row.is_prescription_required)
  };
}

/**
 * Maps Supabase departments table row to frontend DepartmentInfo type.
 */
function mapSupabaseDepartment(row: any): DepartmentInfo {
  return {
    id: row.slug || String(row.id),
    name: row.name,
    shortName: row.name.split(' ')[0] || row.name,
    description: row.description || '100% Original Products Guaranteed',
    tagline: row.description || '100% Original Products Guaranteed',
    iconName: 'Package',
    bgGradient: 'from-emerald-600 to-teal-700',
    accentColor: '#059669',
    sampleCategories: [],
    image: row.image_url || '/departments/food-staples.svg',
    displayOrder: row.display_order ?? 0,
    isActive: row.is_active !== false
  };
}

// ------------------------------------------------------------------------------
// 1. AUTHENTICATION & PROFILES (Supabase Auth + RBAC)
// ------------------------------------------------------------------------------

export async function signInAdmin(email: string, password: string): Promise<{
  success: boolean;
  profile?: UserProfile;
  error?: string;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase client is not configured. Please enter your project credentials.' };
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || 'Invalid credentials' };
    }

    // Query profiles table to enforce role = 'admin'
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      console.warn('Profile fetch note:', profileError.message);
    }

    let role = profileData?.role;

    // If profile does not exist or user metadata specifies admin, check or create
    if (!profileData) {
      const userMeta = authData.user.user_metadata;
      role = userMeta?.role || 'admin'; // fallback to metadata
      try {
        await supabase.from('profiles').insert({
          id: authData.user.id,
          email: authData.user.email,
          role: role
        });
      } catch (insertErr) {
        console.warn('Could not auto-insert profile:', insertErr);
      }
    }

    if (role !== 'admin') {
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Access Denied: Your account role is "' + role + '". Only role="admin" can access the Admin Dashboard.'
      };
    }

    return {
      success: true,
      profile: {
        id: authData.user.id,
        email: authData.user.email || email,
        role: 'admin',
        createdAt: authData.user.created_at
      }
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unexpected authentication error' };
  }
}

export async function signUpAdmin(email: string, password: string): Promise<{
  success: boolean;
  profile?: UserProfile;
  error?: string;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase client is not configured.' };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { role: 'admin' }
      }
    });

    if (error || !data.user) {
      return { success: false, error: error?.message || 'Could not register user' };
    }

    // Ensure profile row exists with role = 'admin'
    try {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        role: 'admin'
      });
    } catch {}

    return {
      success: true,
      profile: {
        id: data.user.id,
        email: data.user.email || email,
        role: 'admin'
      }
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Sign up failed' };
  }
}

export async function signOutAdmin(): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut().catch(() => {});
  }
}

export async function getCurrentAdminSession(): Promise<UserProfile | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profile && profile.role === 'admin') {
      return {
        id: session.user.id,
        email: session.user.email || '',
        role: 'admin',
        createdAt: profile.created_at
      };
    }
  } catch (err) {
    console.warn('Session check note:', err);
  }

  return null;
}

// ------------------------------------------------------------------------------
// 2. DEPARTMENTS API
// ------------------------------------------------------------------------------

export async function fetchDepartmentsFromSupabase(): Promise<DepartmentInfo[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.warn('Error fetching departments from Supabase:', error.message);
      return [];
    }

    return (data || []).map(mapSupabaseDepartment);
  } catch (err) {
    console.error('Fetch departments exception:', err);
    return [];
  }
}

export async function createDepartmentInSupabase(dept: {
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  display_order?: number;
  is_active?: boolean;
}): Promise<DepartmentInfo | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('departments')
    .insert({
      name: dept.name,
      slug: dept.slug,
      description: dept.description || '',
      image_url: dept.image_url || '/departments/food-staples.svg',
      display_order: dept.display_order ?? 0,
      is_active: dept.is_active !== false
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapSupabaseDepartment(data);
}

export async function updateDepartmentInSupabase(
  id: number | string,
  updates: Partial<DepartmentInfo>
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.displayOrder !== undefined) dbUpdates.display_order = updates.displayOrder;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.image !== undefined) dbUpdates.image_url = updates.image;

  // Match by slug or id
  const query = typeof id === 'number' || !isNaN(Number(id))
    ? supabase.from('departments').update(dbUpdates).eq('id', Number(id))
    : supabase.from('departments').update(dbUpdates).eq('slug', id);

  const { error } = await query;
  if (error) throw new Error(error.message);
  return true;
}

export async function deleteDepartmentInSupabase(id: number | string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const query = typeof id === 'number' || !isNaN(Number(id))
    ? supabase.from('departments').delete().eq('id', Number(id))
    : supabase.from('departments').delete().eq('slug', id);

  const { error } = await query;
  if (error) throw new Error(error.message);
  return true;
}

// ------------------------------------------------------------------------------
// 3. PRODUCTS & INVENTORY API
// ------------------------------------------------------------------------------

export async function fetchProductsFromSupabase(): Promise<Product[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    // Also fetch departments to resolve slugs
    const { data: deptRows } = await supabase.from('departments').select('*');
    const deptMap = new Map<number | string, DepartmentInfo>();
    if (deptRows) {
      deptRows.forEach(d => {
        const mapped = mapSupabaseDepartment(d);
        deptMap.set(d.id, mapped);
        deptMap.set(d.slug, mapped);
      });
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.warn('Error fetching products from Supabase:', error.message);
      return [];
    }

    return (data || []).map(row => mapSupabaseProduct(row, deptMap));
  } catch (err) {
    console.error('Fetch products exception:', err);
    return [];
  }
}

export async function createProductInSupabase(product: Omit<Product, 'id'>): Promise<Product | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  // Resolve department ID integer
  let departmentIdNum: number | null = null;
  if (product.departmentId && !isNaN(Number(product.departmentId))) {
    departmentIdNum = Number(product.departmentId);
  } else if (product.department) {
    const { data: dept } = await supabase
      .from('departments')
      .select('id')
      .eq('slug', product.department)
      .maybeSingle();
    if (dept) departmentIdNum = dept.id;
  }

  const insertData = {
    department_id: departmentIdNum,
    name: product.name,
    description: product.description || '',
    price: product.price,
    original_price: product.originalPrice || null,
    stock_qty: Math.max(0, product.stock ?? 0),
    image_url: product.image,
    is_active: product.isActive !== false,
    sku: product.sku || `SKU-${Date.now()}`,
    barcode: product.barcode || null,
    unit: product.unit || 'Piece',
    is_prescription_required: Boolean(product.isPrescriptionRequired)
  };

  const { data, error } = await supabase
    .from('products')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...product,
    id: String(data.id),
    departmentId: data.department_id,
    stock: data.stock_qty
  };
}

export async function updateProductInSupabase(
  id: string,
  updates: Partial<Product>
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.originalPrice !== undefined) dbUpdates.original_price = updates.originalPrice;
  if (updates.stock !== undefined) dbUpdates.stock_qty = Math.max(0, updates.stock);
  if (updates.image !== undefined) dbUpdates.image_url = updates.image;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
  if (updates.barcode !== undefined) dbUpdates.barcode = updates.barcode;
  if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
  if (updates.isPrescriptionRequired !== undefined) dbUpdates.is_prescription_required = updates.isPrescriptionRequired;

  const numericId = Number(id);
  const query = isNaN(numericId)
    ? supabase.from('products').update(dbUpdates).eq('sku', id)
    : supabase.from('products').update(dbUpdates).eq('id', numericId);

  const { error } = await query;
  if (error) throw new Error(error.message);
  return true;
}

export async function deleteProductInSupabase(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const numericId = Number(id);
  const query = isNaN(numericId)
    ? supabase.from('products').delete().eq('sku', id)
    : supabase.from('products').delete().eq('id', numericId);

  const { error } = await query;
  if (error) throw new Error(error.message);
  return true;
}

// ------------------------------------------------------------------------------
// 4. ORDERS & ATOMIC CHECKOUT API (Negative Stock Prevention & Price Freezing)
// ------------------------------------------------------------------------------

export interface OrderCheckoutPayload {
  customerName: string;
  phone: string;
  address: string;
  notes?: string;
  paymentMethod?: string;
  prescriptionUrl?: string;
  items: {
    product: Product;
    quantity: number;
  }[];
  deliveryFee: number;
}

export async function placeOrderInSupabase(payload: OrderCheckoutPayload): Promise<{
  success: boolean;
  orderId?: string;
  orderCode?: string;
  total?: number;
  error?: string;
}> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Database is not connected.' };
  }

  // 1. First verify in-memory stock to prevent negative stock before RPC
  for (const item of payload.items) {
    if (item.quantity > item.product.stock) {
      return {
        success: false,
        error: `Insufficient stock for "${item.product.name}". Available: ${item.product.stock}, requested: ${item.quantity}.`
      };
    }
  }

  // 2. Prepare payload for the atomic place_order stored function
  const rpcItems = payload.items.map(item => ({
    product_id: Number(item.product.id),
    quantity: item.quantity,
    unit_price: item.product.price
  }));

  try {
    // Attempt atomic stored function
    const { data, error } = await supabase.rpc('place_order', {
      p_customer_name: payload.customerName.trim(),
      p_customer_phone: payload.phone.trim(),
      p_delivery_address: payload.address.trim(),
      p_notes: payload.notes || '',
      p_payment_method: payload.paymentMethod || 'Cash on Delivery',
      p_prescription_url: payload.prescriptionUrl || '',
      p_items: rpcItems
    });

    if (!error && data && data.success) {
      return {
        success: true,
        orderId: String(data.order_id),
        orderCode: data.order_code,
        total: Number(data.total_amount)
      };
    }

    if (error) {
      console.warn('place_order RPC note, falling back to client transaction:', error.message);
    }
  } catch (rpcErr) {
    console.warn('RPC unavailable, executing direct transaction fallback:', rpcErr);
  }

  // Fallback direct table writes if RPC has not been executed yet in Supabase SQL editor
  try {
    const subtotal = payload.items.reduce((s, i) => s + i.product.price * i.quantity, 0);
    const orderTotal = subtotal + payload.deliveryFee;
    const orderCode = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_code: orderCode,
        customer_name: payload.customerName.trim(),
        customer_phone: payload.phone.trim(),
        delivery_address: payload.address.trim(),
        total_amount: orderTotal,
        status: 'pending',
        notes: payload.notes || '',
        payment_method: payload.paymentMethod || 'Cash on Delivery',
        prescription_url: payload.prescriptionUrl || ''
      })
      .select()
      .single();

    if (orderError || !orderData) {
      return { success: false, error: orderError?.message || 'Could not save order.' };
    }

    // Insert order items with frozen price & decrement stock
    for (const item of payload.items) {
      const prodId = Number(item.product.id);
      if (!isNaN(prodId)) {
        await supabase.from('order_items').insert({
          order_id: orderData.id,
          product_id: prodId,
          quantity: item.quantity,
          unit_price: item.product.price // Frozen price at purchase time
        });

        // Decrement stock
        const newStock = Math.max(0, item.product.stock - item.quantity);
        await supabase.from('products').update({ stock_qty: newStock }).eq('id', prodId);
      }
    }

    return {
      success: true,
      orderId: String(orderData.id),
      orderCode: orderCode,
      total: orderTotal
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Checkout failed' };
  }
}

export async function fetchOrdersFromSupabase(): Promise<OrderLog[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        order_code,
        customer_name,
        customer_phone,
        delivery_address,
        total_amount,
        status,
        notes,
        payment_method,
        prescription_url,
        created_at,
        order_items (
          id,
          product_id,
          quantity,
          unit_price,
          products (
            id,
            name,
            sku,
            unit,
            image_url,
            department_id
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.warn('Error fetching orders from Supabase:', ordersError.message);
      return [];
    }

    return (ordersData || []).map((row: any) => {
      const items = (row.order_items || []).map((oi: any) => ({
        product: {
          id: String(oi.product_id || oi.id),
          name: oi.products?.name || `Product #${oi.product_id}`,
          department: 'grocery' as DepartmentId,
          category: 'Order Item',
          price: Number(oi.unit_price) || 0,
          stock: 10,
          unit: oi.products?.unit || 'Piece',
          sku: oi.products?.sku || `SKU-${oi.product_id}`,
          description: '',
          image: oi.products?.image_url || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500',
          inStock: true,
          isOriginalGuaranteed: true
        },
        quantity: Number(oi.quantity) || 1
      }));

      const subtotal = items.reduce((s: number, i: any) => s + i.product.price * i.quantity, 0);
      const total = Number(row.total_amount) || subtotal;
      const deliveryFee = Math.max(0, total - subtotal);

      let statusMapped: OrderStatus = 'placed_on_whatsapp';
      if (row.status === 'confirmed') statusMapped = 'confirmed';
      else if (row.status === 'delivered') statusMapped = 'delivered';
      else if (row.status === 'cancelled') statusMapped = 'cancelled';
      else if (row.status === 'packed') statusMapped = 'packed';
      else if (row.status === 'pending') statusMapped = 'placed_on_whatsapp';

      return {
        id: row.order_code || `ORD-${row.id}`,
        customerName: row.customer_name,
        phone: row.customer_phone,
        address: row.delivery_address,
        notes: row.notes,
        paymentMethod: row.payment_method,
        prescriptionImage: row.prescription_url,
        items,
        subtotal,
        deliveryFee,
        total,
        createdAt: row.created_at,
        status: statusMapped
      };
    });
  } catch (err) {
    console.error('Fetch orders exception:', err);
    return [];
  }
}

export async function updateOrderStatusInSupabase(
  orderIdOrCode: string,
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled' | string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  // Map legacy UI statuses to Supabase constraint
  let dbStatus = 'pending';
  if (status === 'confirmed' || status === 'approved') dbStatus = 'confirmed';
  else if (status === 'delivered') dbStatus = 'delivered';
  else if (status === 'cancelled') dbStatus = 'cancelled';
  else if (status === 'packed') dbStatus = 'confirmed';

  const numericId = Number(orderIdOrCode);
  const query = isNaN(numericId)
    ? supabase.from('orders').update({ status: dbStatus }).eq('order_code', orderIdOrCode)
    : supabase.from('orders').update({ status: dbStatus }).eq('id', numericId);

  const { error } = await query;
  if (error) {
    console.error('Update order status error:', error.message);
    throw new Error(error.message);
  }
  return true;
}

// ------------------------------------------------------------------------------
// 5. CMS SETTINGS API (Dynamic store configuration)
// ------------------------------------------------------------------------------

export async function fetchCmsSettingsFromSupabase(): Promise<Record<string, string>> {
  const supabase = getSupabaseClient();
  if (!supabase) return {};

  try {
    const { data, error } = await supabase.from('cms_settings').select('*');
    if (error) {
      console.warn('Error fetching CMS settings:', error.message);
      return {};
    }

    const settings: Record<string, string> = {};
    (data || []).forEach(row => {
      settings[row.key] = row.value;
    });
    return settings;
  } catch (err) {
    console.error('Fetch CMS settings exception:', err);
    return {};
  }
}

export async function updateCmsSettingInSupabase(
  key: string,
  value: string,
  category = 'general'
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('cms_settings')
    .upsert({
      key,
      value: String(value),
      category,
      updated_at: new Date().toISOString()
    });

  if (error) throw new Error(error.message);
  return true;
}

export async function bulkUpdateCmsSettingsInSupabase(
  settings: Record<string, string>
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const rows = Object.entries(settings).map(([key, value]) => ({
    key,
    value: String(value),
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabase.from('cms_settings').upsert(rows);
  if (error) throw new Error(error.message);
  return true;
}

// ------------------------------------------------------------------------------
// 6. REALTIME SUBSCRIPTIONS
// ------------------------------------------------------------------------------

export function subscribeToOrders(onNewOrUpdatedOrder: () => void): () => void {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        onNewOrUpdatedOrder();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}
