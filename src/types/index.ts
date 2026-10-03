export type DepartmentId =
  | 'all'
  | 'cosmetics'
  | 'grocery'
  | 'drinks'
  | 'lingerie'
  | 'toiletries'
  | 'toys'
  | 'birthday-items'
  | 'crockery'
  | 'electronics'
  | 'pharmacy'
  | string;

export interface DepartmentInfo {
  id: DepartmentId;
  name: string;
  shortName: string;
  description: string;
  iconName: string;
  bgGradient: string;
  accentColor: string;
  sampleCategories: string[];
  image?: string;
  tagline?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'customer';
  createdAt?: string;
}

export interface CmsSettingItem {
  key: string;
  value: string;
  category?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  department: DepartmentId;
  departmentId?: number | string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  unit: string;
  sku: string;
  barcode?: string;
  description: string;
  formulation?: string;
  usage?: string;
  dose?: string;
  image: string;
  additionalImages?: string[];
  inStock: boolean;
  isOriginalGuaranteed: boolean;
  badge?: string;
  rating?: number;
  reviewsCount?: number;
  isActive?: boolean;
  isPrescriptionRequired?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PrescriptionOrder {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  prescriptionImage: string;
  fileName?: string;
  fileSize?: string;
  notes: string;
  urgency: 'standard' | 'urgent';
  createdAt: string;
  status: 'pending' | 'reviewed' | 'packed' | 'delivered' | 'cancelled';
  quoteAmount?: number;
  viewUrl?: string;
  imageUrl?: string;
  pharmacistNotes?: string;
}

export type OrderStatus =
  | 'placed_on_whatsapp'
  | 'approved'
  | 'packed'
  | 'delivered'
  | 'cancelled'
  | 'confirmed';

export interface OrderLog {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  notes?: string;
  paymentMethod?: string;
  prescriptionImage?: string;
  prescriptionFileName?: string;
  prescriptionNotes?: string;
  whatsappMessage?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  status: OrderStatus;
}

export interface StoreConfig {
  storeName: string;
  tagline: string;
  whatsappNumber: string;
  displayPhone: string;
  openingTime: string; // "08:00"
  closingTime: string; // "01:00"
  daysOpen: string; // "7 Days a Week"
  freeDeliveryThreshold: number;
  standardDeliveryFee: number;
  
  // Custom Logo & Branding editable from Backend
  logoType: 'official-vector' | 'custom-image' | 'text-only';
  customLogoUrl?: string; // custom image url or base64 data uri
  logoBadgeColor?: string; // background color for badge (default #248243)

  // Frontend Descriptions & Content editable from Backend
  heroTitle: string;
  heroSubtitle: string;
  announcementTicker: string;
  departmentDescriptions?: Partial<Record<DepartmentId, string>>;

  // Security Lock PIN for Owner
  adminPin: string;
}
