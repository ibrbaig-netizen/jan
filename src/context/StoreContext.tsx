import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEPARTMENTS as INITIAL_DEPARTMENTS } from '../data/departments';
import { INITIAL_PRODUCTS } from '../data/initialProducts';
import {
  CartItem,
  DepartmentId,
  DepartmentInfo,
  OrderLog,
  OrderStatus,
  PrescriptionOrder,
  Product,
  StoreConfig,
  UserProfile
} from '../types';
import { DEFAULT_STORE_CONFIG, LOCKED_JAN_CHEMIST_DEFAULTS } from '../utils/whatsapp';
import {
  clearSupabaseConfig,
  getSupabaseConfig,
  saveSupabaseConfig,
  SupabaseConfig,
  testSupabaseConnection
} from '../lib/supabase';
import {
  createDepartmentInSupabase,
  createProductInSupabase,
  deleteDepartmentInSupabase,
  deleteProductInSupabase,
  fetchCmsSettingsFromSupabase,
  fetchDepartmentsFromSupabase,
  fetchOrdersFromSupabase,
  fetchProductsFromSupabase,
  getCurrentAdminSession,
  OrderCheckoutPayload,
  placeOrderInSupabase,
  signInAdmin,
  signOutAdmin,
  signUpAdmin,
  subscribeToOrders,
  updateCmsSettingInSupabase,
  updateDepartmentInSupabase,
  updateOrderStatusInSupabase,
  updateProductInSupabase
} from '../services/supabaseService';

interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

interface StoreContextType {
  // Products
  products: Product[];
  filteredProducts: Product[];
  isLoadingProducts: boolean;
  selectedDepartment: DepartmentId;
  setSelectedDepartment: (dept: DepartmentId) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;

  // Departments (Dynamic from Supabase)
  departments: DepartmentInfo[];
  addDepartment: (dept: Omit<DepartmentInfo, 'id'> & { slug?: string }) => Promise<void>;
  updateDepartment: (id: string, updates: Partial<DepartmentInfo>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;

  // Cart
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: Product, quantity?: number) => boolean;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => boolean;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isSearchOverlayOpen: boolean;
  setIsSearchOverlayOpen: (open: boolean) => void;

  // Prescription
  prescriptions: PrescriptionOrder[];
  submitPrescription: (data: Omit<PrescriptionOrder, 'id' | 'createdAt' | 'status'>) => Promise<PrescriptionOrder>;
  updatePrescriptionStatus: (id: string, status: PrescriptionOrder['status'], quoteAmount?: number, pharmacistNotes?: string) => Promise<void>;
  deletePrescription: (id: string) => Promise<void>;
  isPrescriptionModalOpen: boolean;
  setIsPrescriptionModalOpen: (open: boolean) => void;
  refreshBackendData: () => Promise<void>;
  lockAsRemixDefault: () => void;

  // Orders Log
  orders: OrderLog[];
  logOrder: (order: Omit<OrderLog, 'id' | 'createdAt' | 'status'>) => Promise<{ success: boolean; error?: string }>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  clearOrders: () => void;
  loadSampleOrders: () => void;

  // Inventory / Admin CRUD
  addProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  bulkDeleteProducts: (ids: string[]) => Promise<void>;
  bulkUploadProducts: (newProducts: Product[], mode: 'append' | 'replace') => Promise<void>;
  resetToDefaultData: () => void;

  // Config & Admin View
  storeConfig: StoreConfig;
  updateStoreConfig: (updates: Partial<StoreConfig>) => Promise<void>;
  isAdminView: boolean;
  setIsAdminView: (admin: boolean) => void;

  // Supabase Cloud Backend & Auth
  supabaseConfig: SupabaseConfig;
  isSupabaseConnected: boolean;
  adminProfile: UserProfile | null;
  saveSupabaseCredentials: (url: string, anonKey: string) => Promise<{ success: boolean; message: string }>;
  clearSupabaseCredentials: () => void;
  testSupabaseConnectionState: () => Promise<{ success: boolean; message: string; tablesFound?: string[] }>;
  loginAdminWithSupabase: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signupAdminWithSupabase: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdminSession: () => Promise<void>;

  // Owner Security PIN / Legacy Auth
  isOwnerAuthenticated: boolean;
  isPinModalOpen: boolean;
  setIsPinModalOpen: (open: boolean) => void;
  openAdminPortal: () => void;
  navigateToCustomerStore: () => void;
  authenticateOwner: (pin: string) => boolean;
  lockOwnerSession: () => void;

  // Toast
  toast: ToastNotification | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;

  // Theme (Light / Dark Mode)
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const SAMPLE_PRESCRIPTIONS: PrescriptionOrder[] = [
  {
    id: 'rx-101',
    customerName: 'Muhammad Tariq',
    phone: '03001234567',
    address: 'House # 42, Street 7, F-8/2, Islamabad',
    prescriptionImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600',
    notes: 'Prescription for blood pressure and cholesterol: Lipitor 20mg (1x daily at night) and Concor 5mg. Please check expiry dates.',
    urgency: 'urgent',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'pending',
    quoteAmount: 2450
  },
  {
    id: 'rx-102',
    customerName: 'Ayesha Siddiqui',
    phone: '03219876543',
    address: 'Flat 304, Green Heights, Gulberg III, Lahore',
    prescriptionImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600',
    notes: 'Doctor prescribed Augmentin 625mg for 5 days + Panadol drops for infant baby. Needs original GlaxoSmithKline pack.',
    urgency: 'standard',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: 'reviewed',
    quoteAmount: 1890
  }
];

const SAMPLE_ORDERS: OrderLog[] = [
  {
    id: 'ORD-849201',
    customerName: 'Muhammad Tariq',
    phone: '03001234567',
    address: 'House # 42, Street 7, Sector F-8/2, Islamabad',
    notes: 'Prescription for blood pressure and heart care. Needs verified authentic batch.',
    paymentMethod: 'Cash on Delivery (COD)',
    prescriptionImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600',
    prescriptionFileName: 'doctor-prescription-dr-naveed.jpg',
    prescriptionNotes: 'Doctor prescribed Lipitor 20mg (1x daily at night) and Concor 5mg. Urgent requirement.',
    whatsappMessage: `🟢 *JAN CHEMIST - NEW ORDER*\n_"With us its original"_\n━━━━━━━━━━━━━━━━━━━━━\n\n👤 *Customer Details:*\n• Name: *Muhammad Tariq*\n• Phone: *03001234567*\n• Address: *House # 42, Street 7, Sector F-8/2, Islamabad*\n• Payment: *Cash on Delivery (COD)*`,
    items: [
      { product: INITIAL_PRODUCTS[0], quantity: 1 },
      { product: INITIAL_PRODUCTS[1], quantity: 1 }
    ],
    subtotal: 5650,
    deliveryFee: 0,
    total: 5650,
    createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    status: 'approved'
  },
  {
    id: 'ORD-839174',
    customerName: 'Zainab Malik',
    phone: '03009876543',
    address: 'Apartment 4B, Silver Oaks, Sector F-10, Islamabad',
    notes: 'Urgent delivery. Please call rider upon arrival.',
    paymentMethod: 'JazzCash / EasyPaisa',
    whatsappMessage: `🟢 *JAN CHEMIST - NEW ORDER*\n_"With us its original"_\n━━━━━━━━━━━━━━━━━━━━━\n\n👤 *Customer Details:*\n• Name: *Zainab Malik*\n• Phone: *03009876543*`,
    items: [
      { product: INITIAL_PRODUCTS[2], quantity: 2 }
    ],
    subtotal: 3700,
    deliveryFee: 0,
    total: 3700,
    createdAt: new Date(Date.now() - 3600000 * 3.5).toISOString(),
    status: 'packed'
  }
];

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Supabase Configuration State
  const [supabaseConfigState, setSupabaseConfigState] = useState<SupabaseConfig>(getSupabaseConfig());
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [adminProfile, setAdminProfile] = useState<UserProfile | null>(null);

  // Departments (Dynamic from Supabase or Local State)
  const [departments, setDepartments] = useState<DepartmentInfo[]>(() => {
    try {
      const saved = localStorage.getItem('jan_chemist_departments');
      return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
    } catch {
      return INITIAL_DEPARTMENTS;
    }
  });

  // Products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('jan_chemist_products');
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('jan_chemist_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Prescriptions
  const [prescriptions, setPrescriptions] = useState<PrescriptionOrder[]>(() => {
    try {
      const saved = localStorage.getItem('jan_chemist_prescriptions');
      return saved ? JSON.parse(saved) : SAMPLE_PRESCRIPTIONS;
    } catch {
      return SAMPLE_PRESCRIPTIONS;
    }
  });

  // Orders Log
  const [orders, setOrders] = useState<OrderLog[]>(() => {
    try {
      const saved = localStorage.getItem('jan_chemist_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return SAMPLE_ORDERS;
    } catch {
      return SAMPLE_ORDERS;
    }
  });

  // Store Config
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(() => {
    try {
      const savedLogo = localStorage.getItem('jan_chemist_uploaded_logo');
      const saved = localStorage.getItem('jan_chemist_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (savedLogo && (!parsed.customLogoUrl || parsed.customLogoUrl === '/logo.svg')) {
          parsed.customLogoUrl = savedLogo;
        }
        parsed.logoType = 'custom-image';
        return parsed;
      }
      return {
        ...LOCKED_JAN_CHEMIST_DEFAULTS,
        logoType: 'custom-image',
        customLogoUrl: savedLogo || LOCKED_JAN_CHEMIST_DEFAULTS.customLogoUrl || '/logo.svg'
      };
    } catch {
      return { ...LOCKED_JAN_CHEMIST_DEFAULTS, logoType: 'custom-image' };
    }
  });

  // UI States
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Admin View & Owner Authentication
  const [isAdminView, setIsAdminView] = useState(() => {
    try {
      return (
        window.location.pathname.startsWith('/admin') ||
        window.location.search.includes('portal=owner') ||
        window.location.search.includes('admin=true') ||
        window.location.hash === '#owner' ||
        window.location.hash === '#admin'
      );
    } catch {
      return false;
    }
  });

  const [isOwnerAuthenticated, setIsOwnerAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('jan_chemist_owner_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Theme state (Light / Dark Mode)
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('jan_chemist_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {}
    return 'light';
  });

  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('jan_chemist_theme', theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Date.now().toString();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev));
    }, 4000);
  };

  // Keyboard shortcut: Cmd+K / Ctrl+K / /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOverlayOpen(prev => !prev);
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        setIsSearchOverlayOpen(true);
      } else if (e.key === 'Escape' && isSearchOverlayOpen) {
        setIsSearchOverlayOpen(false);
      } else if (e.altKey && (e.key === 'o' || e.key === 'O' || e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        openAdminPortal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOverlayOpen]);

  // Sync URL with Admin Portal route
  useEffect(() => {
    const checkUrl = () => {
      const isOwnerUrl =
        window.location.pathname.startsWith('/admin') ||
        window.location.pathname.startsWith('/portal') ||
        window.location.pathname.startsWith('/dashboard') ||
        window.location.search.includes('portal=owner') ||
        window.location.search.includes('admin=true') ||
        window.location.hash === '#owner' ||
        window.location.hash === '#admin';
      setIsAdminView(isOwnerUrl);
    };
    checkUrl();
    window.addEventListener('popstate', checkUrl);
    window.addEventListener('hashchange', checkUrl);
    return () => {
      window.removeEventListener('popstate', checkUrl);
      window.removeEventListener('hashchange', checkUrl);
    };
  }, []);

  // ----------------------------------------------------------------------------
  // DYNAMIC SUPABASE DATA SYNC & INITIALIZATION
  // ----------------------------------------------------------------------------
  const syncFromSupabase = async () => {
    const currentConfig = getSupabaseConfig();
    setSupabaseConfigState(currentConfig);

    if (!currentConfig.isConfigured) {
      setIsSupabaseConnected(false);
      return;
    }

    setIsLoadingProducts(true);
    try {
      const test = await testSupabaseConnection();
      if (!test.success) {
        setIsSupabaseConnected(false);
        setIsLoadingProducts(false);
        return;
      }

      setIsSupabaseConnected(true);

      // Check current session
      const sessionProfile = await getCurrentAdminSession();
      if (sessionProfile) {
        setAdminProfile(sessionProfile);
        setIsOwnerAuthenticated(true);
      }

      // 1. Fetch dynamic departments
      const fetchedDepts = await fetchDepartmentsFromSupabase();
      if (fetchedDepts.length > 0) {
        setDepartments(fetchedDepts);
        try {
          localStorage.setItem('jan_chemist_departments', JSON.stringify(fetchedDepts));
        } catch {}
      }

      // 2. Fetch dynamic products
      const fetchedProducts = await fetchProductsFromSupabase();
      if (fetchedProducts.length > 0) {
        setProducts(fetchedProducts);
        try {
          localStorage.setItem('jan_chemist_products', JSON.stringify(fetchedProducts));
        } catch {}
      }

      // 3. Fetch CMS Settings
      const fetchedCms = await fetchCmsSettingsFromSupabase();
      if (fetchedCms && Object.keys(fetchedCms).length > 0) {
        setStoreConfig(prev => {
          const next = { ...prev };
          if (fetchedCms.whatsapp_number) next.whatsappNumber = fetchedCms.whatsapp_number;
          if (fetchedCms.display_phone) next.displayPhone = fetchedCms.display_phone;
          if (fetchedCms.store_name) next.storeName = fetchedCms.store_name;
          if (fetchedCms.tagline) next.tagline = fetchedCms.tagline;
          if (fetchedCms.opening_time) next.openingTime = fetchedCms.opening_time;
          if (fetchedCms.closing_time) next.closingTime = fetchedCms.closing_time;
          if (fetchedCms.store_hours) next.daysOpen = fetchedCms.store_hours;
          if (fetchedCms.announcement_ticker) next.announcementTicker = fetchedCms.announcement_ticker;
          if (fetchedCms.hero_title) next.heroTitle = fetchedCms.hero_title;
          if (fetchedCms.hero_subtitle) next.heroSubtitle = fetchedCms.hero_subtitle;
          if (fetchedCms.free_delivery_threshold) next.freeDeliveryThreshold = Number(fetchedCms.free_delivery_threshold) || 2000;
          if (fetchedCms.standard_delivery_fee) next.standardDeliveryFee = Number(fetchedCms.standard_delivery_fee) || 150;
          return next;
        });
      }

      // 4. Fetch Orders
      const fetchedOrders = await fetchOrdersFromSupabase();
      if (fetchedOrders.length > 0) {
        setOrders(fetchedOrders);
        try {
          localStorage.setItem('jan_chemist_orders', JSON.stringify(fetchedOrders));
        } catch {}
      }
    } catch (err) {
      console.warn('Initial Supabase fetch exception:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    syncFromSupabase();

    // Subscribe to realtime orders if connected
    const unsubscribe = subscribeToOrders(() => {
      fetchOrdersFromSupabase().then(updated => {
        if (updated.length > 0) setOrders(updated);
      });
    });

    return () => unsubscribe();
  }, []);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('jan_chemist_departments', JSON.stringify(departments));
    } catch {}
  }, [departments]);

  useEffect(() => {
    try {
      localStorage.setItem('jan_chemist_products', JSON.stringify(products));
    } catch {}
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('jan_chemist_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('jan_chemist_orders', JSON.stringify(orders));
    } catch {}
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('jan_chemist_config', JSON.stringify(storeConfig));
    } catch {}
  }, [storeConfig]);

  // Synchronize prescriptions and orders with backend server
  const refreshBackendData = async () => {
    if (isSupabaseConnected) {
      await syncFromSupabase();
      return;
    }

    try {
      const rxRes = await fetch('/api/prescriptions');
      if (rxRes.ok) {
        const rxData = await rxRes.json();
        if (Array.isArray(rxData)) {
          setPrescriptions(rxData);
          try {
            localStorage.setItem('jan_chemist_prescriptions', JSON.stringify(rxData));
          } catch {}
        }
      }
    } catch {}

    try {
      const orderRes = await fetch('/api/orders');
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        if (Array.isArray(orderData) && orderData.length > 0) {
          setOrders(orderData);
          try {
            localStorage.setItem('jan_chemist_orders', JSON.stringify(orderData));
          } catch {}
        }
      }
    } catch {}
  };

  // ----------------------------------------------------------------------------
  // SUPABASE CREDENTIALS & AUTH MANAGEMENT
  // ----------------------------------------------------------------------------
  const saveSupabaseCredentials = async (url: string, anonKey: string) => {
    const saved = saveSupabaseConfig(url, anonKey);
    if (!saved) {
      return { success: false, message: 'Invalid URL or key.' };
    }

    const test = await testSupabaseConnection(url, anonKey);
    setSupabaseConfigState(getSupabaseConfig());
    setIsSupabaseConnected(test.success);

    if (test.success) {
      showToast('Connected to Supabase PostgreSQL Database!', 'success');
      await syncFromSupabase();
    } else {
      showToast(test.message, 'warning');
    }

    return test;
  };

  const clearSupabaseCredentials = () => {
    clearSupabaseConfig();
    setSupabaseConfigState(getSupabaseConfig());
    setIsSupabaseConnected(false);
    setAdminProfile(null);
    showToast('Supabase credentials cleared. Switched to local persistent storage.', 'info');
  };

  const testSupabaseConnectionState = async () => {
    return await testSupabaseConnection();
  };

  const loginAdminWithSupabase = async (email: string, password: string) => {
    const res = await signInAdmin(email, password);
    if (res.success && res.profile) {
      setAdminProfile(res.profile);
      setIsOwnerAuthenticated(true);
      try {
        sessionStorage.setItem('jan_chemist_owner_auth', 'true');
      } catch {}
      setIsPinModalOpen(false);
      showToast(`Welcome back, ${res.profile.email}! Admin access verified.`, 'success');
      return { success: true };
    }
    return { success: false, error: res.error || 'Login failed.' };
  };

  const signupAdminWithSupabase = async (email: string, password: string) => {
    const res = await signUpAdmin(email, password);
    if (res.success && res.profile) {
      setAdminProfile(res.profile);
      setIsOwnerAuthenticated(true);
      try {
        sessionStorage.setItem('jan_chemist_owner_auth', 'true');
      } catch {}
      showToast(`Admin account registered for ${res.profile.email}!`, 'success');
      return { success: true };
    }
    return { success: false, error: res.error || 'Registration failed.' };
  };

  const logoutAdminSession = async () => {
    await signOutAdmin();
    setAdminProfile(null);
    setIsOwnerAuthenticated(false);
    try {
      sessionStorage.removeItem('jan_chemist_owner_auth');
    } catch {}
    navigateToCustomerStore();
    showToast('Logged out of Admin Portal.', 'info');
  };

  // ----------------------------------------------------------------------------
  // CART OPERATIONS & NEGATIVE STOCK PREVENTION
  // ----------------------------------------------------------------------------
  const addToCart = (product: Product, quantity = 1): boolean => {
    const currentInCart = cart.find(i => i.product.id === product.id)?.quantity || 0;
    const requestedTotal = currentInCart + quantity;

    // Check available stock (Negative stock prevention!)
    if (requestedTotal > product.stock) {
      showToast(
        `Cannot add ${quantity} more. Only ${product.stock} available in stock!`,
        'warning'
      );
      return false;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });

    showToast(`Added ${quantity}x "${product.name.slice(0, 25)}..." to cart!`);
    return true;
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number): boolean => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return true;
    }

    const item = cart.find(i => i.product.id === productId);
    if (item && quantity > item.product.stock) {
      showToast(
        `Max available stock is ${item.product.stock} for "${item.product.name}"`,
        'warning'
      );
      return false;
    }

    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
    return true;
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);

  // ----------------------------------------------------------------------------
  // PRESCRIPTION OPERATIONS
  // ----------------------------------------------------------------------------
  const submitPrescription = async (data: Omit<PrescriptionOrder, 'id' | 'createdAt' | 'status'>): Promise<PrescriptionOrder> => {
    let createdRx: PrescriptionOrder = {
      ...data,
      id: `rx-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const result = await res.json();
        if (result.prescription) {
          createdRx = {
            ...result.prescription,
            viewUrl: result.viewUrl,
            imageUrl: result.imageUrl
          };
        }
      }
    } catch (err) {
      console.warn('Backend sync failed, storing locally:', err);
    }

    setPrescriptions(prev => {
      const filtered = prev.filter(p => p.id !== createdRx.id);
      const nextList = [createdRx, ...filtered];
      try {
        localStorage.setItem('jan_chemist_prescriptions', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    showToast('Prescription submitted successfully to Jan Chemist!', 'success');
    return createdRx;
  };

  const updatePrescriptionStatus = async (
    id: string,
    status: PrescriptionOrder['status'],
    quoteAmount?: number,
    pharmacistNotes?: string
  ) => {
    setPrescriptions(prev =>
      prev.map(rx => (rx.id === id ? {
        ...rx,
        status,
        quoteAmount: quoteAmount !== undefined ? quoteAmount : rx.quoteAmount,
        pharmacistNotes: pharmacistNotes !== undefined ? pharmacistNotes : rx.pharmacistNotes
      } : rx))
    );

    try {
      await fetch(`/api/prescriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, quoteAmount, pharmacistNotes })
      });
    } catch (e) {
      console.error(e);
    }
    showToast(`Prescription status updated to: ${status.toUpperCase()}`, 'info');
  };

  const deletePrescription = async (id: string) => {
    setPrescriptions(prev => prev.filter(rx => rx.id !== id));
    try {
      await fetch(`/api/prescriptions/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
    showToast('Prescription record removed', 'info');
  };

  // ----------------------------------------------------------------------------
  // ORDERS LOG & ATOMIC CHECKOUT (Negative stock prevention + Supabase persistence)
  // ----------------------------------------------------------------------------
  const logOrder = async (
    orderData: Omit<OrderLog, 'id' | 'createdAt' | 'status'>
  ): Promise<{ success: boolean; error?: string }> => {
    // 1. Stock check before confirmation
    for (const item of orderData.items) {
      const liveProduct = products.find(p => p.id === item.product.id);
      const availableStock = liveProduct ? liveProduct.stock : item.product.stock;
      if (item.quantity > availableStock) {
        const msg = `Insufficient stock for "${item.product.name}". Available: ${availableStock}, requested: ${item.quantity}.`;
        showToast(msg, 'warning');
        return { success: false, error: msg };
      }
    }

    let generatedOrderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    // 2. Submit to Supabase if connected
    if (isSupabaseConnected) {
      const payload: OrderCheckoutPayload = {
        customerName: orderData.customerName,
        phone: orderData.phone,
        address: orderData.address,
        notes: orderData.notes,
        paymentMethod: orderData.paymentMethod,
        prescriptionUrl: orderData.prescriptionImage,
        items: orderData.items,
        deliveryFee: orderData.deliveryFee
      };

      const result = await placeOrderInSupabase(payload);
      if (!result.success) {
        showToast(result.error || 'Failed to place order in database', 'warning');
        return { success: false, error: result.error };
      }
      if (result.orderCode) generatedOrderId = result.orderCode;
    }

    // 3. Atomically decrement local stock
    setProducts(prevProds =>
      prevProds.map(prod => {
        const orderedItem = orderData.items.find(i => i.product.id === prod.id);
        if (orderedItem) {
          const nextStock = Math.max(0, prod.stock - orderedItem.quantity);
          return { ...prod, stock: nextStock, inStock: nextStock > 0 };
        }
        return prod;
      })
    );

    // 4. Record new order in local state
    const newOrder: OrderLog = {
      ...orderData,
      id: generatedOrderId,
      createdAt: new Date().toISOString(),
      status: 'placed_on_whatsapp'
    };

    setOrders(prev => [newOrder, ...prev]);

    // Also notify Express server if running
    try {
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      }).catch(() => {});
    } catch {}

    return { success: true };
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    setOrders(prev =>
      prev.map(o => (o.id === id ? { ...o, status } : o))
    );

    if (isSupabaseConnected) {
      try {
        await updateOrderStatusInSupabase(id, status);
      } catch (err: any) {
        console.warn('Supabase status update error:', err);
      }
    }

    try {
      await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch {}

    showToast(`Order ${id} marked as: ${status.replace('_', ' ').toUpperCase()}`, 'info');
  };

  const clearOrders = () => {
    setOrders([]);
    try {
      localStorage.setItem('jan_chemist_orders', JSON.stringify([]));
    } catch {}
    showToast('Order history cleared from this device', 'info');
  };

  const loadSampleOrders = () => {
    setOrders(SAMPLE_ORDERS);
    try {
      localStorage.setItem('jan_chemist_orders', JSON.stringify(SAMPLE_ORDERS));
    } catch {}
    showToast('Loaded demo order history into local storage!', 'success');
  };

  // ----------------------------------------------------------------------------
  // INVENTORY & PRODUCT CRUD
  // ----------------------------------------------------------------------------
  const addProduct = async (productData: Omit<Product, 'id'>): Promise<Product> => {
    let createdProd: Product = {
      ...productData,
      id: `prod-${Date.now()}`
    };

    if (isSupabaseConnected) {
      try {
        const supaProd = await createProductInSupabase(productData);
        if (supaProd) createdProd = supaProd;
      } catch (err: any) {
        console.warn('Supabase product create error, saving locally:', err);
      }
    }

    setProducts(prev => [createdProd, ...prev]);
    showToast(`Added "${createdProd.name.slice(0, 30)}" to inventory!`, 'success');
    return createdProd;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    setProducts(prev =>
      prev.map(prod => (prod.id === id ? { ...prod, ...updates } : prod))
    );

    if (isSupabaseConnected) {
      try {
        await updateProductInSupabase(id, updates);
      } catch (err: any) {
        console.warn('Supabase product update error:', err);
      }
    }

    showToast('Product updated successfully!', 'success');
  };

  const deleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(prod => prod.id !== id));

    if (isSupabaseConnected) {
      try {
        await deleteProductInSupabase(id);
      } catch (err: any) {
        console.warn('Supabase product delete error:', err);
      }
    }

    showToast('Product deleted from inventory.', 'info');
  };

  const bulkDeleteProducts = async (ids: string[]) => {
    const idSet = new Set(ids);
    setProducts(prev => prev.filter(prod => !idSet.has(prod.id)));

    if (isSupabaseConnected) {
      for (const id of ids) {
        try {
          await deleteProductInSupabase(id);
        } catch {}
      }
    }

    showToast(`Deleted ${ids.length} product(s) from inventory.`, 'info');
  };

  const bulkUploadProducts = async (newProducts: Product[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      setProducts(newProducts);
      showToast(`Catalog replaced with ${newProducts.length} products!`, 'success');
    } else {
      setProducts(prev => {
        const existingSkus = new Set(prev.map(p => p.sku.toUpperCase()));
        const toAdd = newProducts.filter(p => !existingSkus.has(p.sku.toUpperCase()));
        const updated = prev.map(p => {
          const match = newProducts.find(np => np.sku.toUpperCase() === p.sku.toUpperCase());
          return match ? { ...p, ...match, id: p.id } : p;
        });
        return [...toAdd, ...updated];
      });
      showToast(`Successfully processed ${newProducts.length} items from Excel!`, 'success');
    }

    if (isSupabaseConnected) {
      for (const p of newProducts) {
        try {
          await createProductInSupabase(p);
        } catch {}
      }
    }
  };

  // ----------------------------------------------------------------------------
  // DEPARTMENTS CRUD (Dynamic from Supabase)
  // ----------------------------------------------------------------------------
  const addDepartment = async (dept: Omit<DepartmentInfo, 'id'> & { slug?: string }) => {
    const slug = (dept.slug || dept.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) as DepartmentId;
    const newDept: DepartmentInfo = {
      ...dept,
      id: slug,
      isActive: true,
      displayOrder: departments.length + 1
    };

    if (isSupabaseConnected) {
      try {
        const supaDept = await createDepartmentInSupabase({
          name: dept.name,
          slug,
          description: dept.description,
          image_url: dept.image,
          display_order: newDept.displayOrder,
          is_active: true
        });
        if (supaDept) {
          setDepartments(prev => [...prev, supaDept]);
          showToast(`Department "${dept.name}" created in Supabase!`, 'success');
          return;
        }
      } catch (err: any) {
        console.warn('Supabase department create error:', err);
      }
    }

    setDepartments(prev => [...prev, newDept]);
    showToast(`Department "${dept.name}" created!`, 'success');
  };

  const updateDepartment = async (id: string, updates: Partial<DepartmentInfo>) => {
    setDepartments(prev =>
      prev.map(d => (d.id === id ? { ...d, ...updates } : d))
    );

    if (isSupabaseConnected) {
      try {
        await updateDepartmentInSupabase(id, updates);
      } catch (err: any) {
        console.warn('Supabase department update error:', err);
      }
    }

    showToast('Department updated successfully!', 'success');
  };

  const deleteDepartment = async (id: string) => {
    setDepartments(prev => prev.filter(d => d.id !== id));

    if (isSupabaseConnected) {
      try {
        await deleteDepartmentInSupabase(id);
      } catch (err: any) {
        console.warn('Supabase department delete error:', err);
      }
    }

    showToast('Department removed.', 'info');
  };

  const resetToDefaultData = () => {
    const savedLogo = localStorage.getItem('jan_chemist_uploaded_logo');
    const defaultCfg: StoreConfig = {
      ...LOCKED_JAN_CHEMIST_DEFAULTS,
      logoType: 'custom-image',
      customLogoUrl: savedLogo || LOCKED_JAN_CHEMIST_DEFAULTS.customLogoUrl || '/logo.svg'
    };
    setProducts(INITIAL_PRODUCTS);
    setDepartments(INITIAL_DEPARTMENTS);
    setStoreConfig(defaultCfg);
    localStorage.removeItem('jan_chemist_products');
    localStorage.removeItem('jan_chemist_departments');
    localStorage.setItem('jan_chemist_config', JSON.stringify(defaultCfg));
    fetch('/api/store-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defaultCfg)
    }).catch(() => {});
    showToast('Locked Jan Chemist defaults restored!', 'success');
  };

  const lockAsRemixDefault = () => {
    const savedLogo = localStorage.getItem('jan_chemist_uploaded_logo');
    const lockedConfig: StoreConfig = {
      ...storeConfig,
      logoType: 'custom-image',
      customLogoUrl: storeConfig.customLogoUrl || savedLogo || '/logo.svg'
    };
    localStorage.setItem('jan_chemist_locked_defaults', JSON.stringify({
      storeConfig: lockedConfig,
      productsCount: products.length,
      lockedAt: new Date().toISOString()
    }));
    if (lockedConfig.customLogoUrl) {
      try {
        localStorage.setItem('jan_chemist_uploaded_logo', lockedConfig.customLogoUrl);
      } catch {}
    }
    fetch('/api/store-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lockedConfig)
    }).catch(() => {});
    showToast('Current store config locked as permanent default!', 'success');
  };

  // ----------------------------------------------------------------------------
  // CMS SETTINGS (Sync to Supabase and Local Storage)
  // ----------------------------------------------------------------------------
  const updateStoreConfig = async (updates: Partial<StoreConfig>) => {
    const next: StoreConfig = {
      ...storeConfig,
      ...updates,
      logoType: 'custom-image'
    };

    setStoreConfig(next);

    if (next.customLogoUrl) {
      try {
        localStorage.setItem('jan_chemist_uploaded_logo', next.customLogoUrl);
      } catch {}
    }

    // Sync to Supabase cms_settings table if connected
    if (isSupabaseConnected) {
      try {
        if (updates.whatsappNumber) await updateCmsSettingInSupabase('whatsapp_number', updates.whatsappNumber, 'contact');
        if (updates.displayPhone) await updateCmsSettingInSupabase('display_phone', updates.displayPhone, 'contact');
        if (updates.storeName) await updateCmsSettingInSupabase('store_name', updates.storeName, 'branding');
        if (updates.tagline) await updateCmsSettingInSupabase('tagline', updates.tagline, 'branding');
        if (updates.openingTime) await updateCmsSettingInSupabase('opening_time', updates.openingTime, 'hours');
        if (updates.closingTime) await updateCmsSettingInSupabase('closing_time', updates.closingTime, 'hours');
        if (updates.daysOpen) await updateCmsSettingInSupabase('store_hours', updates.daysOpen, 'hours');
        if (updates.announcementTicker) await updateCmsSettingInSupabase('announcement_ticker', updates.announcementTicker, 'promotion');
        if (updates.heroTitle) await updateCmsSettingInSupabase('hero_title', updates.heroTitle, 'promotion');
        if (updates.heroSubtitle) await updateCmsSettingInSupabase('hero_subtitle', updates.heroSubtitle, 'promotion');
        if (updates.freeDeliveryThreshold !== undefined) {
          await updateCmsSettingInSupabase('free_delivery_threshold', String(updates.freeDeliveryThreshold), 'shipping');
        }
        if (updates.standardDeliveryFee !== undefined) {
          await updateCmsSettingInSupabase('standard_delivery_fee', String(updates.standardDeliveryFee), 'shipping');
        }
      } catch (err) {
        console.warn('Supabase CMS settings sync error:', err);
      }
    }

    // Fallback Express route
    fetch('/api/store-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next)
    }).catch(() => {});

    showToast('Store settings saved to backend!', 'success');
  };

  // ----------------------------------------------------------------------------
  // ADMIN PORTAL NAVIGATION & OWNER LOCK
  // ----------------------------------------------------------------------------
  const openAdminPortal = () => {
    setIsAdminView(true);
    try {
      const url = new URL(window.location.href);
      if (url.pathname !== '/admin') {
        url.pathname = '/admin';
      }
      url.searchParams.delete('portal');
      url.searchParams.delete('admin');
      window.history.pushState({}, '', url.toString());
    } catch {}
  };

  const navigateToCustomerStore = () => {
    setIsAdminView(false);
    try {
      const url = new URL(window.location.href);
      url.pathname = '/';
      url.searchParams.delete('portal');
      url.searchParams.delete('admin');
      url.hash = '';
      window.history.pushState({}, '', url.toString());
    } catch {}
  };

  const authenticateOwner = (pin: string): boolean => {
    const validPin = storeConfig.adminPin || '1234';
    if (pin.trim() === validPin.trim()) {
      setIsOwnerAuthenticated(true);
      try {
        sessionStorage.setItem('jan_chemist_owner_auth', 'true');
      } catch {}
      setIsPinModalOpen(false);
      setIsAdminView(true);
      showToast('Owner Verified! Welcome to the Admin Portal.', 'success');
      return true;
    }
    return false;
  };

  const lockOwnerSession = () => {
    setIsOwnerAuthenticated(false);
    setAdminProfile(null);
    try {
      sessionStorage.removeItem('jan_chemist_owner_auth');
      const url = new URL(window.location.href);
      url.pathname = '/';
      url.searchParams.delete('portal');
      url.searchParams.delete('admin');
      url.hash = '';
      window.history.pushState({}, '', url.toString());
    } catch {}
    setIsAdminView(false);
    showToast('Owner session locked. Switched to Customer Storefront.', 'info');
  };

  // Filtered & sorted products (Customer Frontend)
  const filteredProducts = products.filter(product => {
    if (product.isActive === false) return false;
    const matchesDept = selectedDepartment === 'all' || product.department === selectedDepartment;
    const matchesQuery =
      searchQuery.trim() === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.barcode && product.barcode.includes(searchQuery));
    return matchesDept && matchesQuery;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'stock') return b.stock - a.stock;
    if (a.badge && !b.badge) return -1;
    if (!a.badge && b.badge) return 1;
    return 0;
  });

  return (
    <StoreContext.Provider
      value={{
        products,
        filteredProducts,
        isLoadingProducts,
        selectedDepartment,
        setSelectedDepartment,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        departments,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        cart,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        isSearchOverlayOpen,
        setIsSearchOverlayOpen,
        prescriptions,
        submitPrescription,
        updatePrescriptionStatus,
        deletePrescription,
        isPrescriptionModalOpen,
        setIsPrescriptionModalOpen,
        refreshBackendData,
        lockAsRemixDefault,
        orders,
        logOrder,
        updateOrderStatus,
        clearOrders,
        loadSampleOrders,
        addProduct,
        updateProduct,
        deleteProduct,
        bulkDeleteProducts,
        bulkUploadProducts,
        resetToDefaultData,
        storeConfig,
        updateStoreConfig,
        isAdminView,
        setIsAdminView,
        supabaseConfig: supabaseConfigState,
        isSupabaseConnected,
        adminProfile,
        saveSupabaseCredentials,
        clearSupabaseCredentials,
        testSupabaseConnectionState,
        loginAdminWithSupabase,
        signupAdminWithSupabase,
        logoutAdminSession,
        isOwnerAuthenticated,
        isPinModalOpen,
        setIsPinModalOpen,
        openAdminPortal,
        navigateToCustomerStore,
        authenticateOwner,
        lockOwnerSession,
        toast,
        showToast,
        theme,
        setTheme,
        toggleTheme
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
