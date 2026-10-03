import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  CreditCard,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  FileCheck,
  FileCode,
  FileImage,
  FileQuestion,
  FileSpreadsheet,
  FileText,
  Filter,
  Globe,
  Image as ImageIcon,
  Key,
  Layers,
  Lock,
  MapPin,
  MessageCircle,
  MessageSquare,
  Package,
  PackageCheck,
  PackagePlus,
  Palette,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Square,
  Trash2,
  Truck,
  Type,
  Upload,
  X,
  Zap,
  Loader2,
  CheckSquare,
  Database
} from 'lucide-react';
import { DEPARTMENTS } from '../data/departments';
import { useStore } from '../context/StoreContext';
import { DepartmentId, OrderLog, OrderStatus, PrescriptionOrder, Product, StoreConfig } from '../types';
import { SupabaseBackendManager } from './admin/SupabaseBackendManager';
import { DepartmentsManager } from './admin/DepartmentsManager';
import {
  generateOrderStatusWhatsAppText,
  generateOrderStatusWhatsAppUrl,
  generatePrescriptionQuoteWhatsAppUrl,
  cleanPatientWhatsAppPhone,
  getStoreWhatsAppNumber,
  generateReplyToPatientWhatsAppUrl
} from '../utils/whatsapp';
import {
  downloadSampleExcelTemplate,
  exportProductsToExcel,
  parseExcelFile,
  ParseResult
} from '../utils/excelHandler';
import { JanChemistLogo } from './JanChemistLogo';
import { EditProductModal, PACKAGING_PRESETS } from './EditProductModal';
import { InventoryGoogleSearchModal } from './InventoryGoogleSearchModal';
import { GoogleSearchEnricher } from './GoogleSearchEnricher';
import {
  fetchFurtherPicturesFromGoogle,
  getGoogleImagesSearchUrl,
  getGoogleWebSearchUrl
} from '../utils/googleSearchService';
import {
  cleanAndResolveImageUrl,
  getProxiedImageUrl,
  DEFAULT_DEPT_IMAGES
} from '../utils/imageUrlResolver';

export const AdminPortal: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    bulkDeleteProducts,
    bulkUploadProducts,
    resetToDefaultData,
    prescriptions,
    updatePrescriptionStatus,
    deletePrescription,
    refreshBackendData,
    lockAsRemixDefault,
    orders,
    updateOrderStatus,
    clearOrders,
    loadSampleOrders,
    storeConfig,
    updateStoreConfig,
    setIsAdminView,
    navigateToCustomerStore,
    lockOwnerSession,
    isSupabaseConnected,
    adminProfile,
    logoutAdminSession,
    showToast
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    'inventory' | 'excel-upload' | 'departments' | 'branding' | 'playstore' | 'prescriptions' | 'orders' | 'settings' | 'cloud-backend' | 'deployment'
  >('inventory');

  // Custom Domain & Production Server Deployment Assistant
  const [deploymentDomain, setDeploymentDomain] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined' && window.location && window.location.hostname && !window.location.hostname.includes('run.app') && !window.location.hostname.includes('localhost')) {
        return window.location.hostname;
      }
    } catch {}
    return 'janchemist.com';
  });
  const [deploymentServerIp, setDeploymentServerIp] = useState<string>('142.93.120.45');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  const handleCopySnippet = (id: string, text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedSnippetId(id);
      showToast('Copied to clipboard!', 'info');
      setTimeout(() => setCopiedSnippetId(null), 2500);
    } catch {
      showToast('Snippet ready to copy', 'info');
    }
  };

  // Pharmacist Prescriptions Review State
  const [zoomedRx, setZoomedRx] = useState<PrescriptionOrder | null>(null);
  const [quotingRx, setQuotingRx] = useState<PrescriptionOrder | null>(null);
  const [quoteInputAmount, setQuoteInputAmount] = useState<number>(0);
  const [quoteInputNotes, setQuoteInputNotes] = useState<string>('');
  const [isRefreshingRx, setIsRefreshingRx] = useState<boolean>(false);

  // WhatsApp Orders Management & Processing State
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    'all' | 'placed_on_whatsapp' | 'has_prescription' | 'approved' | 'packed' | 'delivered' | 'cancelled'
  >('all');
  const [selectedOrderForWhatsAppMsg, setSelectedOrderForWhatsAppMsg] = useState<OrderLog | null>(null);
  const [selectedOrderForRxZoom, setSelectedOrderForRxZoom] = useState<OrderLog | null>(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());
  const [customStatusNote, setCustomStatusNote] = useState('');
  const [targetNotificationStatus, setTargetNotificationStatus] = useState<OrderStatus>('approved');
  const [targetPatientPhoneInput, setTargetPatientPhoneInput] = useState('');
  const [confirmClearOrdersModal, setConfirmClearOrdersModal] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [copiedMsg, setCopiedMsg] = useState(false);

  // Prescription direct reply modal
  const [replyingRxToPatient, setReplyingRxToPatient] = useState<PrescriptionOrder | null>(null);
  const [rxReplyMessage, setRxReplyMessage] = useState<string>('');
  const [rxPatientPhoneInput, setRxPatientPhoneInput] = useState<string>('');

  const toggleExpandOrder = (id: string) => {
    setExpandedOrderIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedOrderId(id);
    showToast(`Copied Order ID: ${id}`, 'info');
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const handleCopyMessageText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsg(true);
    showToast('WhatsApp message copied to clipboard!', 'info');
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  const handleOpenWhatsAppMsgModal = (order: OrderLog, defaultTargetStatus?: OrderStatus) => {
    setSelectedOrderForWhatsAppMsg(order);
    setTargetNotificationStatus(defaultTargetStatus || order.status || 'approved');
    setCustomStatusNote('');
    setTargetPatientPhoneInput(order.phone || '');
  };

  const handleOpenRxReplyModal = (rx: PrescriptionOrder) => {
    setReplyingRxToPatient(rx);
    setRxPatientPhoneInput(rx.phone || '');
    setRxReplyMessage(`Hello ${rx.customerName}! 🩺 This is the certified pharmacist at Jan Chemist regarding your prescription (#${rx.id}).\n\nYour prescription has been reviewed and verified for genuine medicines. Please let us know if you would like us to dispatch your order immediately.`);
  };

  const handleAdvanceOrderStatus = (order: OrderLog, nextStatus: OrderStatus, openWhatsApp = false) => {
    updateOrderStatus(order.id, nextStatus);
    if (openWhatsApp) {
      handleOpenWhatsAppMsgModal(order, nextStatus);
    }
  };

  // Search & Filter in admin inventory
  const [adminSearch, setAdminSearch] = useState('');
  const [adminDeptFilter, setAdminDeptFilter] = useState<DepartmentId | 'all'>('all');

  // Edit Product Modal State (with Google auto-enrich)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Standalone Google Product Search & Import Modal
  const [isGoogleSearchModalOpen, setIsGoogleSearchModalOpen] = useState(false);
  const [googleSearchQuery, setGoogleSearchQuery] = useState('');

  // Delete Product Confirmation Modals (Activated In-App Modal - Replaces blocked window.confirm)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Auto-Place Google Images in Stock Main Window State
  const [autoPlacingIds, setAutoPlacingIds] = useState<Set<string>>(new Set());
  const [isBulkAutoPlacing, setIsBulkAutoPlacing] = useState(false);
  const [activeQuickPicProduct, setActiveQuickPicProduct] = useState<Product | null>(null);
  const [quickPicOptions, setQuickPicOptions] = useState<string[]>([]);
  const [isLoadingQuickPics, setIsLoadingQuickPics] = useState(false);
  const [quickPicCustomUrl, setQuickPicCustomUrl] = useState('');

  // Quick Edit Packaging, Price & Description modal state
  const [quickEditProduct, setQuickEditProduct] = useState<Product | null>(null);
  const [quickEditUnit, setQuickEditUnit] = useState('');
  const [quickEditPrice, setQuickEditPrice] = useState(0);
  const [quickEditDesc, setQuickEditDesc] = useState('');

  // Auto-place Google Image directly on a product in the stock main window
  const handleAutoPlaceGoogleImage = async (product: Product) => {
    setAutoPlacingIds(prev => new Set(prev).add(product.id));
    try {
      const pictures = await fetchFurtherPicturesFromGoogle(product.name, product.department);
      if (pictures.length > 0) {
        const bestPic = pictures[0];
        updateProduct(product.id, {
          image: bestPic,
          additionalImages: pictures.slice(1, 4)
        });
        showToast(`Auto-placed Google picture for "${product.name}" in stock!`, 'success');
      } else {
        showToast(`No Google picture found for "${product.name}".`, 'warning');
      }
    } catch (err: any) {
      showToast(`Google image search: ${err.message}`, 'warning');
    } finally {
      setAutoPlacingIds(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  // Bulk auto-place Google Images for missing photos or selected items
  const handleBulkAutoPlaceGoogleImages = async () => {
    const targets = selectedProductIds.length > 0
      ? products.filter(p => selectedProductIds.includes(p.id))
      : products.filter(p => !p.image || p.image.includes('placeholder') || p.image.trim() === '');

    if (targets.length === 0) {
      showToast('All products have photos! Select specific products using checkboxes to replace their photos.', 'info');
      return;
    }

    setIsBulkAutoPlacing(true);
    let successCount = 0;
    for (const prod of targets) {
      try {
        const pictures = await fetchFurtherPicturesFromGoogle(prod.name, prod.department);
        if (pictures.length > 0) {
          updateProduct(prod.id, {
            image: pictures[0],
            additionalImages: pictures.slice(1, 4)
          });
          successCount++;
        }
      } catch {}
    }
    setIsBulkAutoPlacing(false);
    showToast(`Auto-placed Google images for ${successCount} product(s) in the stock main window!`, 'success');
  };

  // Open fast Google Image picker modal directly on thumbnail click
  const handleOpenQuickPicPicker = async (product: Product) => {
    setActiveQuickPicProduct(product);
    setQuickPicCustomUrl('');
    setIsLoadingQuickPics(true);
    try {
      const pictures = await fetchFurtherPicturesFromGoogle(product.name, product.department);
      const cleaned = pictures.map(cleanAndResolveImageUrl).filter(Boolean);
      setQuickPicOptions(cleaned);
    } catch {
      setQuickPicOptions([]);
    } finally {
      setIsLoadingQuickPics(false);
    }
  };

  // Checkbox toggle helpers
  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedProductIds.length === filteredAdminProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredAdminProducts.map(p => p.id));
    }
  };

  // Confirm Delete Actions (Activated In-App Modal)
  const handleConfirmDelete = () => {
    if (productToDelete) {
      const name = productToDelete.name;
      deleteProduct(productToDelete.id);
      setSelectedProductIds(prev => prev.filter(id => id !== productToDelete.id));
      setProductToDelete(null);
      showToast(`Deleted "${name}" from stock inventory.`, 'info');
    }
  };

  const handleConfirmBulkDelete = () => {
    if (selectedProductIds.length > 0) {
      const count = selectedProductIds.length;
      bulkDeleteProducts(selectedProductIds);
      setSelectedProductIds([]);
      setIsBulkDeleteModalOpen(false);
      showToast(`Deleted ${count} product(s) from inventory.`, 'info');
    }
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsEditModalOpen(true);
  };

  const handleOpenAddWithDetails = (details: Partial<Product>) => {
    if (details.name) setNewProdName(details.name);
    if (details.department) setNewProdDept(details.department);
    if (details.category) setNewProdCategory(details.category);
    if (details.price) setNewProdPrice(details.price);
    if (details.originalPrice) setNewProdOrigPrice(details.originalPrice);
    if (details.stock !== undefined) setNewProdStock(details.stock);
    if (details.unit) setNewProdUnit(details.unit);
    if (details.sku) setNewProdSku(details.sku);
    if (details.barcode) setNewProdBarcode(details.barcode);
    if (details.image) setNewProdImage(details.image);
    if (details.description) setNewProdDesc(details.description);
    setIsAddModalOpen(true);
  };

  // Add Product Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdDept, setNewProdDept] = useState<DepartmentId>('cosmetics');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdPrice, setNewProdPrice] = useState<number>(1000);
  const [newProdOrigPrice, setNewProdOrigPrice] = useState<number | undefined>(undefined);
  const [newProdStock, setNewProdStock] = useState<number>(20);
  const [newProdUnit, setNewProdUnit] = useState('Piece');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdBadge, setNewProdBadge] = useState('100% Genuine');

  // Excel Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsingExcel, setParsingExcel] = useState(false);
  const [parsedData, setParsedData] = useState<ParseResult | null>(null);
  const [uploadMode, setUploadMode] = useState<'append' | 'replace'>('append');

  // Prescription Zoom Modal
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Logo & Branding Editor State
  const [cfgStoreName, setCfgStoreName] = useState(storeConfig.storeName || 'JAN CHEMIST');
  const [cfgTagline, setCfgTagline] = useState(storeConfig.tagline || 'With us its original');
  const [cfgLogoType, setCfgLogoType] = useState<StoreConfig['logoType']>(storeConfig.logoType || 'custom-image');
  const [cfgCustomLogoUrl, setCfgCustomLogoUrl] = useState(storeConfig.customLogoUrl || '/logo.svg');
  const [cfgLogoBadgeColor, setCfgLogoBadgeColor] = useState(storeConfig.logoBadgeColor || '#248243');
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Frontend Descriptions Editor State
  const [cfgHeroTitle, setCfgHeroTitle] = useState(storeConfig.heroTitle || 'Your Complete Superstore & Trusted Pharmacy');
  const [cfgHeroSubtitle, setCfgHeroSubtitle] = useState(
    storeConfig.heroSubtitle ||
      'Shop 8+ departments: Cosmetics, Grocery, Drinks, Lingerie, Toiletries, Toys, Birthday Items, Crockery, Electronics, and certified Prescription Medicines.'
  );
  const [cfgAnnouncementTicker, setCfgAnnouncementTicker] = useState(
    storeConfig.announcementTicker || '“With us its original” — 100% Genuine Pharmacy & Superstore'
  );

  // Security Lock PIN State
  const [cfgNewPin, setCfgNewPin] = useState(storeConfig.adminPin || '1234');
  const [cfgConfirmPin, setCfgConfirmPin] = useState(storeConfig.adminPin || '1234');

  // Store Timings & Contact Form State
  const [cfgPhone, setCfgPhone] = useState(storeConfig.displayPhone);
  const [cfgWaNumber, setCfgWaNumber] = useState(storeConfig.whatsappNumber);
  const [cfgDaysOpen, setCfgDaysOpen] = useState(storeConfig.daysOpen);
  const [cfgFreeThreshold, setCfgFreeThreshold] = useState(storeConfig.freeDeliveryThreshold);
  const [cfgFee, setCfgFee] = useState(storeConfig.standardDeliveryFee);

  // Stats calculation
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock <= 5 && p.stock > 0).length;
  const outOfStockProducts = products.filter(p => p.stock === 0 || !p.inStock).length;
  const totalInventoryValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const pendingPrescriptions = prescriptions.filter(rx => rx.status === 'pending').length;

  // Filtered products in admin
  const filteredAdminProducts = products.filter(p => {
    const matchesDept = adminDeptFilter === 'all' || p.department === adminDeptFilter;
    const matchesSearch =
      adminSearch.trim() === '' ||
      p.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(adminSearch.toLowerCase()) ||
      (p.barcode && p.barcode.includes(adminSearch));
    return matchesDept && matchesSearch;
  });

  // Handle Add Product Submit
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      showToast('Product name is required', 'warning');
      return;
    }

    const defaultImg =
      newProdImage.trim() ||
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500';

    const sku =
      newProdSku.trim() ||
      `JAN-${newProdDept.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    addProduct({
      name: newProdName.trim(),
      department: newProdDept,
      category: newProdCategory.trim() || 'General',
      price: Number(newProdPrice) || 100,
      originalPrice: newProdOrigPrice ? Number(newProdOrigPrice) : undefined,
      stock: Number(newProdStock) || 0,
      unit: newProdUnit.trim() || 'Piece',
      sku,
      barcode: newProdBarcode.trim() || undefined,
      description:
        newProdDesc.trim() ||
        `${newProdName.trim()} - 100% Genuine original quality guaranteed at Jan Chemist.`,
      image: defaultImg,
      inStock: Number(newProdStock) > 0,
      isOriginalGuaranteed: true,
      badge: newProdBadge.trim() || undefined,
      rating: 4.9,
      reviewsCount: 12
    });

    setIsAddModalOpen(false);
    // Reset
    setNewProdName('');
    setNewProdCategory('');
    setNewProdPrice(1000);
    setNewProdOrigPrice(undefined);
    setNewProdStock(20);
    setNewProdSku('');
    setNewProdBarcode('');
    setNewProdImage('');
    setNewProdDesc('');
  };

  // Handle Excel File Drop/Select
  const handleExcelFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    setParsingExcel(true);
    try {
      const result = await parseExcelFile(file);
      setParsedData(result);
      if (result.validProducts.length > 0) {
        showToast(`Parsed ${result.validProducts.length} products successfully from spreadsheet!`, 'success');
      } else {
        showToast('No valid rows found in the selected sheet.', 'warning');
      }
    } catch (err: any) {
      showToast('Error reading Excel spreadsheet: ' + err.message, 'warning');
    } finally {
      setParsingExcel(false);
    }
  };

  // Commit Parsed Excel to Inventory
  const handleCommitExcelUpload = () => {
    if (!parsedData || parsedData.validProducts.length === 0) return;
    bulkUploadProducts(parsedData.validProducts, uploadMode);
    setParsedData(null);
    setExcelFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setActiveTab('inventory');
  };

  // Upload logo from local device
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Logo file size must be under 5MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result as string;
      setCfgCustomLogoUrl(result);
      setCfgLogoType('custom-image');
      try {
        localStorage.setItem('jan_chemist_uploaded_logo', result);
      } catch {}
      showToast('Logo image loaded! Click "Publish Branding Live" to apply as permanent default.', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Save Branding & Frontend Descriptions
  const handleSaveBranding = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cfgCustomLogoUrl.trim()) {
      try {
        localStorage.setItem('jan_chemist_uploaded_logo', cfgCustomLogoUrl.trim());
      } catch {}
    }
    updateStoreConfig({
      storeName: cfgStoreName.trim(),
      tagline: cfgTagline.trim(),
      logoType: 'custom-image',
      customLogoUrl: cfgCustomLogoUrl.trim(),
      logoBadgeColor: cfgLogoBadgeColor,
      heroTitle: cfgHeroTitle.trim(),
      heroSubtitle: cfgHeroSubtitle.trim(),
      announcementTicker: cfgAnnouncementTicker.trim()
    });
    showToast('Storefront logo picture and branding locked as default!', 'success');
  };

  // Save Owner Security PIN
  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfgNewPin.trim() || cfgNewPin.trim().length < 4) {
      showToast('Security PIN must be at least 4 digits.', 'warning');
      return;
    }
    if (cfgNewPin !== cfgConfirmPin) {
      showToast('PIN confirmation does not match.', 'warning');
      return;
    }
    updateStoreConfig({ adminPin: cfgNewPin.trim() });
    showToast(`Owner PIN successfully updated to: ${cfgNewPin.trim()}`, 'success');
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreConfig({
      tagline: cfgTagline,
      displayPhone: cfgPhone,
      whatsappNumber: cfgWaNumber,
      daysOpen: cfgDaysOpen,
      freeDeliveryThreshold: Number(cfgFreeThreshold),
      standardDeliveryFee: Number(cfgFee)
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      {/* Top Admin Header Bar */}
      <div className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300 font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-wide">
                  JAN CHEMIST BACKEND
                </h1>
                <span className="bg-purple-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Inventory Admin
                </span>
              </div>
              <p className="text-slate-400 text-xs">
                Tagline: &ldquo;{storeConfig.tagline}&rdquo; • WhatsApp: {storeConfig.displayPhone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Supabase Status Pill */}
            <button
              type="button"
              onClick={() => setActiveTab('cloud-backend')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                isSupabaseConnected
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                  : 'bg-amber-950/80 text-amber-300 border-amber-700 hover:bg-amber-900'
              }`}
              title="Click to manage Supabase PostgreSQL database and credentials"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isSupabaseConnected ? 'Supabase Live' : 'Local Storage Mode'}</span>
            </button>

            {adminProfile?.email && (
              <span className="hidden md:inline-flex text-[11px] text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 font-mono">
                🛡️ {adminProfile.email}
              </span>
            )}

            {/* Lock Session: Protects backend from customers */}
            <button
              onClick={() => {
                logoutAdminSession();
                lockOwnerSession();
              }}
              className="px-3 py-2 rounded-xl bg-red-600/90 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              title="Lock backend and exit to storefront"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Session</span>
            </button>

            {/* Quick action to switch back to storefront */}
            <button
              onClick={() => navigateToCustomerStore()}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Customer Storefront</span>
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto border-t border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('cloud-backend')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'cloud-backend'
                ? 'border-emerald-400 text-emerald-300 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Cloud Backend (Supabase)</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'inventory'
                ? 'border-purple-400 text-purple-300 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Product Inventory ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('departments')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'departments'
                ? 'border-purple-400 text-purple-300 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Departments</span>
          </button>

          <button
            onClick={() => setActiveTab('excel-upload')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'excel-upload'
                ? 'border-purple-400 text-purple-300 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel Bulk Upload</span>
          </button>

          <button
            onClick={() => setActiveTab('branding')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'branding'
                ? 'border-purple-400 text-purple-300 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4 text-pink-400" />
            <span>Logo &amp; Frontend Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('playstore')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'playstore'
                ? 'border-purple-400 text-purple-300 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Google Play Store Guide</span>
          </button>

          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'prescriptions'
                ? 'border-purple-400 text-purple-300 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-red-400" />
            <span>Prescriptions Queue</span>
            {pendingPrescriptions > 0 && (
              <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {pendingPrescriptions}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'orders'
                ? 'border-purple-400 text-purple-300 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp Orders &amp; Status ({orders.length})</span>
            {orders.filter(o => o.status === 'placed_on_whatsapp' || !o.status).length > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {orders.filter(o => o.status === 'placed_on_whatsapp' || !o.status).length} New
              </span>
            )}
            {orders.filter(o => Boolean(o.prescriptionImage)).length > 0 && (
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                Rx {orders.filter(o => Boolean(o.prescriptionImage)).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'border-purple-400 text-purple-300 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Store Timings &amp; WhatsApp Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('deployment')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'deployment'
                ? 'border-emerald-400 text-emerald-300 bg-slate-800/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Domain &amp; Server Setup</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* KPI Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Products
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalProducts}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              Across 9 Departments
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Low Stock Alert (≤5)
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1">{lowStockProducts}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Needs restock</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Out of Stock
            </div>
            <div className="text-2xl font-black text-red-600 mt-1">{outOfStockProducts}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Unavailable</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Inventory Value
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
              Rs. {totalInventoryValue.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Total stock valuation</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Prescriptions Pending
            </div>
            <div className="text-2xl font-black text-purple-700 mt-1">{pendingPrescriptions}</div>
            <div className="text-[11px] text-purple-600 font-semibold mt-0.5">
              Requires Pharmacist Review
            </div>
          </div>
        </div>

        {/* TAB 1: INVENTORY MANAGEMENT */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search & Dept Filter */}
              <div className="flex flex-1 flex-wrap items-center gap-2.5">
                <div className="relative min-w-56 flex-1">
                  <input
                    type="text"
                    placeholder="Search by product name, SKU, or barcode..."
                    value={adminSearch}
                    onChange={e => setAdminSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-purple-600"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <select
                  value={adminDeptFilter}
                  onChange={e => setAdminDeptFilter(e.target.value as any)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-purple-600 cursor-pointer"
                >
                  <option value="all">All Departments ({products.length})</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.shortName} ({products.filter(p => p.department === d.id).length})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Bulk Actions when items are selected */}
                {selectedProductIds.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-2 py-1 rounded-xl animate-in fade-in">
                    <span className="text-[11px] font-bold text-red-800 px-1">
                      {selectedProductIds.length} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsBulkDeleteModalOpen(true)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1 shadow-xs"
                      title="Permanently delete all selected products from inventory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Selected</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedProductIds([])}
                      className="px-2 py-1 text-slate-500 hover:text-slate-800 text-[11px] font-medium"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {/* Auto-Place Google Images in Stock Main Window */}
                <button
                  type="button"
                  onClick={handleBulkAutoPlaceGoogleImages}
                  disabled={isBulkAutoPlacing}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
                  title="Auto-search Google Images and place directly in stock main window for missing photos"
                >
                  {isBulkAutoPlacing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Placing in Stock...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span>
                        Auto-Place Google Pics{' '}
                        {selectedProductIds.length > 0 ? `(${selectedProductIds.length})` : ''}
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGoogleSearchQuery(adminSearch.trim());
                    setIsGoogleSearchModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="Search Google to discover, verify pricing, or auto-import products into inventory"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>Google Search</span>
                </button>

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>

                <button
                  onClick={() => setActiveTab('excel-upload')}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Bulk Excel Upload</span>
                </button>

                <button
                  onClick={() => exportProductsToExcel(products)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  title="Export current inventory to Excel (.xlsx)"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredAdminProducts.length > 0 &&
                            selectedProductIds.length === filteredAdminProducts.length
                          }
                          onChange={handleSelectAllFiltered}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                          title="Select all products"
                        />
                      </th>
                      <th className="py-3 px-4">Item &amp; Description</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Price (PKR)</th>
                      <th className="py-3 px-4">Packaging (Box/Pcs/Kg)</th>
                      <th className="py-3 px-4">Stock</th>
                      <th className="py-3 px-4">SKU / Barcode</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAdminProducts.length > 0 ? (
                      filteredAdminProducts.map(product => (
                        <tr
                          key={product.id}
                          className={`hover:bg-slate-50/80 transition ${
                            selectedProductIds.includes(product.id) ? 'bg-purple-50/40' : ''
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedProductIds.includes(product.id)}
                              onChange={() => handleToggleSelectProduct(product.id)}
                              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                          </td>

                          {/* Image & Title with Auto Google Image Placer */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative group shrink-0">
                                <img
                                  src={cleanAndResolveImageUrl(product.image)}
                                  alt={product.name}
                                  referrerPolicy="no-referrer"
                                  onClick={() => handleOpenQuickPicPicker(product)}
                                  onError={e => {
                                    const imgEl = e.target as HTMLImageElement;
                                    if (!imgEl.src.includes('/api/image-proxy') && !imgEl.src.startsWith('data:')) {
                                      imgEl.src = getProxiedImageUrl(product.image);
                                    } else {
                                      imgEl.src = DEFAULT_DEPT_IMAGES[product.department] || DEFAULT_DEPT_IMAGES.cosmetics;
                                    }
                                  }}
                                  className="w-14 h-14 object-contain rounded-xl border border-slate-200 bg-slate-50 p-1 group-hover:border-purple-500 transition shadow-2xs cursor-pointer"
                                  title="Click to pick or auto-place Google image"
                                />
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleAutoPlaceGoogleImage(product);
                                  }}
                                  disabled={autoPlacingIds.has(product.id)}
                                  className="absolute -bottom-1 -right-1 p-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-sm transition cursor-pointer"
                                  title="Auto-search and place Google picture directly in stock"
                                >
                                  {autoPlacingIds.has(product.id) ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                                  )}
                                </button>
                              </div>
                              <div className="min-w-0 max-w-sm">
                                <div
                                  onClick={() => handleOpenEditProduct(product)}
                                  className="font-bold text-slate-900 hover:text-purple-700 cursor-pointer line-clamp-1 transition"
                                  title="Click to edit product details, picture, and description"
                                >
                                  {product.name}
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <span className="font-semibold text-purple-900 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                                    {product.unit}
                                  </span>
                                  {product.badge && (
                                    <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold text-[10px]">
                                      {product.badge}
                                    </span>
                                  )}
                                  <span className="text-emerald-700 font-semibold text-[10px]">
                                    • Original
                                  </span>
                                </div>

                                {/* Quick Description Edit Trigger */}
                                <div className="flex items-center gap-1.5 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuickEditProduct(product);
                                      setQuickEditDesc(product.description || '');
                                      setQuickEditUnit(product.unit || 'Piece');
                                      setQuickEditPrice(product.price);
                                    }}
                                    className="text-[10px] text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200 transition flex items-center gap-1 cursor-pointer shrink-0"
                                    title="Edit description, price, and packaging"
                                  >
                                    <Edit2 className="w-2.5 h-2.5" />
                                    <span>Edit Info</span>
                                  </button>
                                  {product.description ? (
                                    <span
                                      onClick={() => {
                                        setQuickEditProduct(product);
                                        setQuickEditDesc(product.description || '');
                                        setQuickEditUnit(product.unit || 'Piece');
                                        setQuickEditPrice(product.price);
                                      }}
                                      className="text-[10px] text-slate-500 hover:text-slate-800 line-clamp-1 italic cursor-pointer"
                                      title={product.description}
                                    >
                                      &ldquo;{product.description}&rdquo;
                                    </span>
                                  ) : (
                                    <span
                                      onClick={() => {
                                        setQuickEditProduct(product);
                                        setQuickEditDesc(product.description || '');
                                        setQuickEditUnit(product.unit || 'Piece');
                                        setQuickEditPrice(product.price);
                                      }}
                                      className="text-[10px] text-slate-400 italic cursor-pointer hover:underline"
                                    >
                                      + Add description
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="py-3 px-4 font-semibold text-emerald-800 uppercase tracking-wider text-[11px]">
                            {product.department}
                          </td>

                          {/* Price Inline Edit */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400 text-xs font-bold">Rs.</span>
                              <input
                                type="number"
                                defaultValue={product.price}
                                onBlur={e => {
                                  const val = parseInt(e.target.value, 10);
                                  if (!isNaN(val) && val > 0 && val !== product.price) {
                                    updateProduct(product.id, { price: val });
                                    showToast(`Updated price for "${product.name}" to Rs. ${val}`, 'success');
                                  }
                                }}
                                className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-900 focus:outline-none focus:border-purple-600 shadow-2xs text-xs"
                                title="Edit retail price in PKR"
                              />
                            </div>
                          </td>

                          {/* Packaging Unit Inline Edit (Box / Pieces / Dozen / Kg) */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                defaultValue={product.unit}
                                key={`${product.id}-unit-${product.unit}`}
                                onBlur={e => {
                                  const val = e.target.value.trim();
                                  if (val && val !== product.unit) {
                                    updateProduct(product.id, { unit: val });
                                    showToast(`Set packaging to "${val}"`, 'success');
                                  }
                                }}
                                placeholder="Packaging unit"
                                className="w-24 px-2 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-900 text-xs focus:outline-none focus:border-purple-600 shadow-2xs"
                                title="Edit packaging unit (box, pieces, dozen, kg, pack, etc.)"
                              />
                              <select
                                value={PACKAGING_PRESETS.includes(product.unit) ? product.unit : ''}
                                onChange={e => {
                                  if (e.target.value) {
                                    updateProduct(product.id, { unit: e.target.value });
                                    showToast(`Set packaging for "${product.name}" to ${e.target.value}`, 'success');
                                  }
                                }}
                                className="p-1 bg-slate-50 border border-slate-300 rounded text-[11px] text-slate-700 cursor-pointer focus:outline-none hover:bg-slate-100"
                                title="Select packaging preset (Box, Pieces, Dozen, Kg, Pack, Bottle, Strip)"
                              >
                                <option value="" disabled>Presets...</option>
                                {PACKAGING_PRESETS.map(preset => (
                                  <option key={preset} value={preset}>
                                    {preset}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>

                          {/* Stock Inline Edit */}
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              defaultValue={product.stock}
                              onBlur={e => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val) && val >= 0 && val !== product.stock) {
                                  updateProduct(product.id, {
                                    stock: val,
                                    inStock: val > 0
                                  });
                                }
                              }}
                              className={`w-16 px-2 py-1 bg-white border rounded font-bold focus:outline-none focus:border-purple-600 ${
                                product.stock === 0
                                  ? 'border-red-400 text-red-700'
                                  : product.stock <= 5
                                  ? 'border-amber-400 text-amber-700'
                                  : 'border-slate-300 text-slate-900'
                              }`}
                            />
                          </td>

                          {/* SKU / Barcode */}
                          <td className="py-3 px-4">
                            <div className="font-mono text-[11px] text-slate-700 font-semibold">
                              {product.sku}
                            </div>
                            {product.barcode && (
                              <div className="font-mono text-[10px] text-slate-400">
                                {product.barcode}
                              </div>
                            )}
                          </td>

                          {/* Status Toggle */}
                          <td className="py-3 px-4">
                            <button
                              onClick={() =>
                                updateProduct(product.id, { inStock: !product.inStock })
                              }
                              className={`px-2 py-1 rounded-full text-[10px] font-bold cursor-pointer transition ${
                                product.inStock
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {product.inStock ? 'Available' : 'Disabled'}
                            </button>
                          </td>

                          {/* Actions: Auto Google Pic, Edit, Google Search, Delete */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Direct 1-Click Auto-Place Google Image */}
                              <button
                                type="button"
                                onClick={() => handleAutoPlaceGoogleImage(product)}
                                disabled={autoPlacingIds.has(product.id)}
                                className="px-2 py-1.5 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-emerald-200 hover:border-emerald-400 shadow-2xs disabled:opacity-50"
                                title="Auto-search Google Images and place directly into stock main window"
                              >
                                {autoPlacingIds.has(product.id) ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                                    <span className="hidden xl:inline">Placing...</span>
                                  </>
                                ) : (
                                  <>
                                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                    <span>Google Pic</span>
                                  </>
                                )}
                              </button>

                              {/* Edit Button with Google Auto-Lookup */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditProduct(product)}
                                className="px-2 py-1.5 text-purple-800 bg-purple-50 hover:bg-purple-100 rounded-lg transition cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-purple-200 hover:border-purple-400 shadow-2xs"
                                title="Edit Product Picture, Description & Specifications"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-purple-600" />
                                <span>Edit</span>
                              </button>

                              {/* Google Web Search Link */}
                              <a
                                href={getGoogleWebSearchUrl(product.name)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50 border border-slate-200 transition cursor-pointer"
                                title="Search Google for Pakistani price and specifications"
                              >
                                <Globe className="w-3.5 h-3.5" />
                              </a>

                              {/* Google Images Link */}
                              <a
                                href={getGoogleImagesSearchUrl(product.name)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-emerald-600 hover:text-emerald-800 rounded-lg hover:bg-emerald-50 border border-slate-200 transition cursor-pointer"
                                title="Search Google Images for high resolution packaging"
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                              </a>

                              {/* Activated Delete Button (Opens In-App Confirmation Modal) */}
                              <button
                                type="button"
                                onClick={() => setProductToDelete(product)}
                                className="p-1.5 text-red-500 hover:text-white rounded-lg hover:bg-red-600 border border-red-200 hover:border-red-600 transition cursor-pointer"
                                title="Delete Product from Stock"
                                aria-label="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                          <div className="max-w-md mx-auto space-y-3">
                            <p className="text-slate-600 font-medium">
                              No products found in local stock matching &ldquo;{adminSearch}&rdquo;.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setGoogleSearchQuery(adminSearch.trim());
                                setIsGoogleSearchModalOpen(true);
                              }}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer inline-flex items-center gap-1.5 text-xs"
                            >
                              <Globe className="w-4 h-4 text-blue-200" />
                              <span>Search Google for &ldquo;{adminSearch}&rdquo; &amp; Auto-Import</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXCEL BULK UPLOAD & EXPORT */}
        {activeTab === 'excel-upload' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                    <span>Bulk Upload Products via Excel Spreadsheet (.xlsx, .csv)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload your entire inventory spreadsheet at once. Automatically parses product names, 8+ departments, prices, stock quantities, units, and images.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Download Excel Template */}
                  <button
                    onClick={downloadSampleExcelTemplate}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Excel Template (.xlsx)</span>
                  </button>

                  {/* Export Current Inventory */}
                  <button
                    onClick={() => exportProductsToExcel(products)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    <span>Export Current Catalog (.xlsx)</span>
                  </button>
                </div>
              </div>

              {/* Upload Drag & Drop Box */}
              <div className="border-2 border-dashed border-emerald-400/80 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-3xl p-8 text-center transition space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleExcelFileSelect}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <Upload className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Select or Drag &amp; Drop Excel File Here
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) files.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={parsingExcel}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{parsingExcel ? 'Parsing Spreadsheet...' : 'Choose Excel File'}</span>
                  </button>
                </div>

                {excelFile && (
                  <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-emerald-200 text-xs text-emerald-900 font-semibold shadow-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>File Selected: {excelFile.name} ({(excelFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>

              {/* Parsed Preview Table & Confirmation */}
              {parsedData && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>Preview Parsed Products:</span>
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full">
                          {parsedData.validProducts.length} items ready
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Total rows read: {parsedData.totalRows}. Review the rows below before saving.
                      </p>
                    </div>

                    {/* Mode Selector */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setUploadMode('append')}
                          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                            uploadMode === 'append'
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600'
                          }`}
                        >
                          Append / Update
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadMode('replace')}
                          className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                            uploadMode === 'replace'
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'text-slate-600'
                          }`}
                        >
                          Replace Entire Catalog
                        </button>
                      </div>

                      <button
                        onClick={handleCommitExcelUpload}
                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                      >
                        Confirm &amp; Import to Inventory
                      </button>
                    </div>
                  </div>

                  {/* Warnings / Errors */}
                  {parsedData.errors.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1">
                      <div className="font-bold">Parsing Errors (rows skipped):</div>
                      {parsedData.errors.slice(0, 5).map((err, i) => (
                        <div key={i}>• {err}</div>
                      ))}
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 sticky top-0 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Product Name</th>
                          <th className="py-2.5 px-3">Department</th>
                          <th className="py-2.5 px-3">Price</th>
                          <th className="py-2.5 px-3">Stock</th>
                          <th className="py-2.5 px-3">Unit</th>
                          <th className="py-2.5 px-3">SKU</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedData.validProducts.slice(0, 30).map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-800">{p.name}</td>
                            <td className="py-2 px-3 uppercase text-emerald-700 font-bold text-[10px]">
                              {p.department}
                            </td>
                            <td className="py-2 px-3 font-bold">Rs. {p.price.toLocaleString()}</td>
                            <td className="py-2 px-3">{p.stock}</td>
                            <td className="py-2 px-3 text-slate-500">{p.unit}</td>
                            <td className="py-2 px-3 font-mono text-[10px] text-slate-600">
                              {p.sku}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: BRANDING, LOGO & FRONTEND DESCRIPTIONS EDITOR */}
        {activeTab === 'branding' && (
          <div className="space-y-6">
            {/* Top Action Header */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Palette className="w-6 h-6 text-pink-600" />
                  <span>Storefront Branding, Logo &amp; Content Editor</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Change the store logo, business name, tagline, hero banner headlines, and descriptions displayed to your customers. All changes reflect live on the website.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveBranding()}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Publish Branding Live</span>
                </button>
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-3xl border border-emerald-500/30 shadow-lg space-y-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Live Frontend Preview (How Customers See Your Store)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
                {/* Logo Preview */}
                <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
                  <div className="text-[11px] text-emerald-200/80 mb-2 font-medium">Header Brand Lockup</div>
                  <JanChemistLogo
                    size="lg"
                    variant="green-card"
                    showTagline={true}
                    overrideLogoUrl={cfgCustomLogoUrl}
                  />
                </div>

                {/* Hero Headlines Preview */}
                <div className="space-y-2">
                  <div className="text-[11px] text-emerald-200/80 font-medium">Hero Banner Headline</div>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {cfgHeroTitle || 'Your Complete Superstore & Trusted Pharmacy'}
                  </h3>
                  <p className="text-xs text-emerald-100/90 leading-relaxed">
                    {cfgHeroSubtitle || 'Shop 8+ departments...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Editing Form: Logo & Descriptions */}
            <form onSubmit={handleSaveBranding} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Logo & Visual Branding (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 pb-3 border-b border-slate-100">
                  <ImageIcon className="w-5 h-5 text-emerald-600" />
                  <span>1. Store Logo &amp; Identity</span>
                </h3>

                {/* Logo Style Options */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    Choose Logo Style:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <label
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center text-center gap-1.5 cursor-pointer transition ${
                        cfgLogoType === 'official-vector'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-1 ring-emerald-500'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="logoType"
                        checked={cfgLogoType === 'official-vector'}
                        onChange={() => setCfgLogoType('official-vector')}
                        className="hidden"
                      />
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                      <span>Official ECG Vector</span>
                      <span className="text-[10px] text-slate-400 font-normal">Original Jan Chemist</span>
                    </label>

                    <label
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center text-center gap-1.5 cursor-pointer transition ${
                        cfgLogoType === 'custom-image'
                          ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-xs ring-1 ring-purple-500'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="logoType"
                        checked={cfgLogoType === 'custom-image'}
                        onChange={() => setCfgLogoType('custom-image')}
                        className="hidden"
                      />
                      <ImageIcon className="w-5 h-5 text-purple-600" />
                      <span>Custom Image / Photo</span>
                      <span className="text-[10px] text-slate-400 font-normal">Upload or Paste URL</span>
                    </label>

                    <label
                      className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center text-center gap-1.5 cursor-pointer transition ${
                        cfgLogoType === 'text-only'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs ring-1 ring-blue-500'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="logoType"
                        checked={cfgLogoType === 'text-only'}
                        onChange={() => setCfgLogoType('text-only')}
                        className="hidden"
                      />
                      <Type className="w-5 h-5 text-blue-600" />
                      <span>Clean Bold Text</span>
                      <span className="text-[10px] text-slate-400 font-normal">Minimalist Style</span>
                    </label>
                  </div>
                </div>

                {/* Custom Logo Image Upload Area (if custom-image is selected) */}
                {cfgLogoType === 'custom-image' && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <label className="block text-xs font-bold text-slate-800">
                      Upload Custom Logo Image or Paste URL:
                    </label>

                    <input
                      type="file"
                      ref={logoFileInputRef}
                      onChange={handleLogoFileUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Logo File from Device</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCfgCustomLogoUrl('/logo.svg');
                          setCfgLogoType('custom-image');
                        }}
                        className={`px-3 py-2 text-xs rounded-xl border transition cursor-pointer font-bold ${
                          cfgCustomLogoUrl === '/logo.svg'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        Default Picture Logo (/logo.svg)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCfgCustomLogoUrl('/logo-badge.svg');
                          setCfgLogoType('custom-image');
                        }}
                        className={`px-3 py-2 text-xs rounded-xl border transition cursor-pointer font-bold ${
                          cfgCustomLogoUrl === '/logo-badge.svg'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        Badge Picture (/logo-badge.svg)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCfgCustomLogoUrl('/icon.svg');
                          setCfgLogoType('custom-image');
                        }}
                        className={`px-3 py-2 text-xs rounded-xl border transition cursor-pointer font-bold ${
                          cfgCustomLogoUrl === '/icon.svg'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        App Icon (/icon.svg)
                      </button>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">Or Direct Image URL:</span>
                      <input
                        type="url"
                        placeholder="https://example.com/logo.png"
                        value={cfgCustomLogoUrl}
                        onChange={e => setCfgCustomLogoUrl(e.target.value)}
                        className="w-full px-3 py-2 text-xs border rounded-xl bg-white focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>
                )}

                {/* Store Name & Tagline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Business / Store Name:
                    </label>
                    <input
                      type="text"
                      required
                      value={cfgStoreName}
                      onChange={e => setCfgStoreName(e.target.value)}
                      placeholder="e.g. JAN CHEMIST"
                      className="w-full px-3.5 py-2.5 border rounded-xl font-bold text-slate-900 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Store Tagline:
                    </label>
                    <input
                      type="text"
                      required
                      value={cfgTagline}
                      onChange={e => setCfgTagline(e.target.value)}
                      placeholder="e.g. With us its original"
                      className="w-full px-3.5 py-2.5 border rounded-xl font-bold text-slate-900 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Logo Badge Color */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Badge Theme Color (Hex):
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={cfgLogoBadgeColor}
                      onChange={e => setCfgLogoBadgeColor(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-slate-300 p-0.5 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={cfgLogoBadgeColor}
                      onChange={e => setCfgLogoBadgeColor(e.target.value)}
                      className="w-28 px-3 py-2 text-xs border rounded-xl font-mono text-slate-800 font-bold focus:outline-none"
                    />
                    <span className="text-xs text-slate-500">
                      Default: #248243 (Authentic Pharmacy Green)
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Descriptions & Tickers (5 cols) */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 pb-3 border-b border-slate-100">
                    <Type className="w-5 h-5 text-purple-600" />
                    <span>2. Frontend Descriptions &amp; Headlines</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Hero Banner Headline:
                    </label>
                    <input
                      type="text"
                      required
                      value={cfgHeroTitle}
                      onChange={e => setCfgHeroTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs border rounded-xl font-bold text-slate-900 focus:border-purple-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Hero Subtitle / Description:
                    </label>
                    <textarea
                      rows={3}
                      value={cfgHeroSubtitle}
                      onChange={e => setCfgHeroSubtitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs border rounded-xl text-slate-800 focus:border-purple-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Top Announcement Ticker:
                    </label>
                    <input
                      type="text"
                      value={cfgAnnouncementTicker}
                      onChange={e => setCfgAnnouncementTicker(e.target.value)}
                      className="w-full px-3 py-2 text-xs border rounded-xl text-slate-800 focus:border-purple-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Save Branding &amp; Update Frontend</span>
                  </button>
                  <p className="text-[10px] text-center text-slate-400">
                    Updates will immediately appear on the storefront.
                  </p>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* TAB: GOOGLE PLAY STORE & ANDROID PACKAGING GUIDE */}
        {activeTab === 'playstore' && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-6 h-6 text-emerald-600" />
                  <span>Google Play Store &amp; Android App Publishing Guide</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Step-by-step instructions to convert Jan Chemist into an official Android App Bundle (.aab) and publish on Google Play Console.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                  PWA &amp; TWA Ready
                </span>
              </div>
            </div>

            {/* Readiness Checklist Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Play Store Android Requirements Status</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-emerald-400 font-bold flex items-center gap-1 mb-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Manifest Configured
                  </div>
                  <div className="text-slate-300 font-mono text-[11px]">/manifest.json</div>
                  <div className="text-[10px] text-slate-400 mt-1">Standalone mode, portrait lock, shortcuts</div>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-emerald-400 font-bold flex items-center gap-1 mb-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Service Worker Active
                  </div>
                  <div className="text-slate-300 font-mono text-[11px]">/sw.js</div>
                  <div className="text-[10px] text-slate-400 mt-1">Offline caching &amp; install trigger</div>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-emerald-400 font-bold flex items-center gap-1 mb-1">
                    <CheckCircle className="w-3.5 h-3.5" /> High-Res Icons
                  </div>
                  <div className="text-slate-300 font-mono text-[11px]">192px &amp; 512px</div>
                  <div className="text-[10px] text-slate-400 mt-1">Maskable safe zones for Android squircles</div>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-emerald-400 font-bold flex items-center gap-1 mb-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Digital Asset Links
                  </div>
                  <div className="text-slate-300 font-mono text-[11px]">/.well-known/assetlinks.json</div>
                  <div className="text-[10px] text-slate-400 mt-1">Hides Chrome address bar inside APK</div>
                </div>
              </div>
            </div>

            {/* Method 1: PWABuilder (Fastest, Recommended) */}
            <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                    1
                  </span>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      Method 1: PWABuilder (Recommended — No Coding Required, 5 Mins)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Microsoft &amp; Google backed free tool that packages your live web app into a signed Android App Bundle (.aab).
                    </p>
                  </div>
                </div>

                <a
                  href="https://www.pwabuilder.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <span>Open PWABuilder.com</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 text-[10px] flex items-center justify-center font-bold">1</span>
                    <span>Enter URL</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-snug">
                    Open <strong className="text-slate-700">pwabuilder.com</strong> and paste your published web app URL. Click &quot;Start&quot;.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 text-[10px] flex items-center justify-center font-bold">2</span>
                    <span>Click Package</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-snug">
                    It will score 100% PWA compliance. Click <strong className="text-slate-700">&quot;Package for Stores&quot;</strong>.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 text-[10px] flex items-center justify-center font-bold">3</span>
                    <span>Select Android</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-snug">
                    Under <strong className="text-slate-700">Google Play</strong>, enter Package ID: <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">com.janchemist.superstore</code>.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 text-[10px] flex items-center justify-center font-bold">4</span>
                    <span>Download .aab</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-snug">
                    Click <strong className="text-slate-700">&quot;Generate&quot;</strong> to download your signed <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">.aab</code> package for Google Play Console.
                  </p>
                </div>
              </div>
            </div>

            {/* Method 2: Google Official Bubblewrap CLI */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-purple-700 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  2
                </span>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Method 2: Google&apos;s Official Bubblewrap CLI (Terminal / Developer Method)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Google Chrome team&apos;s CLI that builds a native Trusted Web Activity (TWA) Android project.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs space-y-2 overflow-x-auto">
                <div className="text-slate-400"># 1. Install Google Bubblewrap CLI globally:</div>
                <div className="text-emerald-400 font-bold">npm install -g @bubblewrap/cli</div>
                <div className="text-slate-400 pt-2"># 2. Initialize your Android project from your deployed URL:</div>
                <div className="text-emerald-400 font-bold">bubblewrap init --manifest=https://your-domain.com/manifest.json</div>
                <div className="text-slate-400 pt-2"># 3. Build signed Android App Bundle (.aab):</div>
                <div className="text-emerald-400 font-bold">bubblewrap build</div>
              </div>
            </div>

            {/* Google Play Console Step-by-Step Publishing Guide */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 pb-3 border-b border-slate-100">
                <FileCode className="w-5 h-5 text-blue-600" />
                <span>Google Play Console Submission Checklist</span>
              </h3>

              <div className="space-y-3.5 text-xs text-slate-700">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div className="space-y-1">
                    <strong className="text-slate-900">Google Play Developer Account:</strong>
                    <p className="text-slate-500">
                      Sign in to <a href="https://play.google.com/console" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">play.google.com/console</a> (one-time $25 registration fee).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div className="space-y-1">
                    <strong className="text-slate-900">Create New App:</strong>
                    <p className="text-slate-500">
                      Click <strong className="text-slate-800">&quot;Create App&quot;</strong> &bull; App Name: <strong>JAN CHEMIST - Superstore &amp; Pharmacy</strong> &bull; Type: <strong>App</strong> &bull; Free or Paid: <strong>Free</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div className="space-y-2 flex-1">
                    <strong className="text-slate-900">Store Listing Copy &amp; Metadata:</strong>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                        <div>
                          <span className="text-[10px] text-slate-400 block">App Title (≤ 30 chars):</span>
                          <span className="font-bold text-slate-800 text-xs">Jan Chemist - Superstore &amp; Rx</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('Jan Chemist - Superstore & Rx');
                            showToast('App title copied!', 'info');
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Short Description (≤ 80 chars):</span>
                          <span className="text-slate-800 text-xs">With us its original. Order pharmacy, cosmetics &amp; groceries on WhatsApp.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('With us its original. Order pharmacy, cosmetics & groceries on WhatsApp.');
                            showToast('Short description copied!', 'info');
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    4
                  </span>
                  <div className="space-y-1">
                    <strong className="text-slate-900">Upload .aab Bundle to Production / Closed Testing:</strong>
                    <p className="text-slate-500">
                      Go to <strong className="text-slate-800">Production &rarr; Create New Release</strong>, drag and drop the downloaded <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">.aab</code> file.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    5
                  </span>
                  <div className="space-y-1">
                    <strong className="text-slate-900">Digital Asset Links Verification:</strong>
                    <p className="text-slate-500">
                      Once uploaded, copy your app&apos;s SHA-256 certificate fingerprint from Google Play Console &rarr; App Integrity &rarr; paste into <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">public/.well-known/assetlinks.json</code>. This removes the browser top bar completely in the published app!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PRESCRIPTIONS QUEUE & DISPENSARY MANAGEMENT */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </span>
                  <h2 className="text-xl font-black text-slate-900">
                    Customer Uploaded Doctor Prescriptions
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Review prescription photos sent by customers, verify genuine drug dosage with on-duty certified pharmacist, generate price quotations, and notify customers on WhatsApp.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    setIsRefreshingRx(true);
                    await refreshBackendData();
                    setIsRefreshingRx(false);
                    showToast('Refreshed latest prescriptions from Jan Chemist server!', 'success');
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  title="Reload from server"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshingRx ? 'animate-spin' : ''}`} />
                  <span>Refresh Server</span>
                </button>

                <span className="text-xs bg-red-100 text-red-800 font-bold px-3 py-1.5 rounded-xl border border-red-200">
                  {prescriptions.length} Total Submissions
                </span>
              </div>
            </div>

            {prescriptions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prescriptions.map(rx => {
                  const viewUrl = rx.viewUrl || `/api/prescriptions/view/${rx.id}`;
                  const cleanPhone = cleanPatientWhatsAppPhone(rx.phone);

                  return (
                    <div
                      key={rx.id}
                      className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4 hover:border-emerald-400 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-slate-900 text-base">{rx.customerName}</h3>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                rx.urgency === 'urgent'
                                  ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {rx.urgency === 'urgent' ? '🚨 URGENT' : 'Standard Routine'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <span>Phone:</span>
                            <a
                              href={`tel:${rx.phone}`}
                              className="font-bold text-slate-800 hover:text-emerald-700 flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{rx.phone}</span>
                            </a>
                            <span className="text-slate-300">•</span>
                            {cleanPhone ? (
                              <a
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                                title={`Open WhatsApp chat with ${rx.customerName} (${cleanPhone})`}
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-600" />
                                <span>WhatsApp ({cleanPhone})</span>
                              </a>
                            ) : (
                              <span className="text-amber-600 text-[10px] font-semibold">No Valid Phone</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5 flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{rx.address || 'Address provided via WhatsApp chat'}</span>
                          </div>
                        </div>

                        {/* Status Selector */}
                        <select
                          value={rx.status}
                          onChange={e => updatePrescriptionStatus(rx.id, e.target.value as any)}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border cursor-pointer focus:outline-none ${
                            rx.status === 'pending'
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : rx.status === 'reviewed'
                              ? 'bg-blue-50 text-blue-900 border-blue-300'
                              : rx.status === 'packed'
                              ? 'bg-purple-50 text-purple-900 border-purple-300'
                              : rx.status === 'delivered'
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : 'bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="pending">⏳ Pending Review</option>
                          <option value="reviewed">🔍 Verified by Pharmacist</option>
                          <option value="packed">📦 Packed for Dispatch</option>
                          <option value="delivered">✅ Delivered to Customer</option>
                          <option value="cancelled">❌ Cancelled</option>
                        </select>
                      </div>

                      {/* Prescription Image & Notes */}
                      <div className="flex gap-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                        <div className="relative group shrink-0">
                          <img
                            src={rx.prescriptionImage}
                            alt="Prescription preview"
                            onClick={() => setZoomedRx(rx)}
                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-slate-300 cursor-pointer group-hover:opacity-90 shrink-0 bg-white shadow-2xs"
                            title="Click to zoom image"
                          />
                          <button
                            type="button"
                            onClick={() => setZoomedRx(rx)}
                            className="absolute inset-0 bg-black/40 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="text-xs text-slate-700 space-y-1.5 flex-1 min-w-0">
                          <div className="font-bold text-slate-900 flex items-center justify-between">
                            <span>Instructions / Medication:</span>
                            <a
                              href={viewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                              title="Open standalone web view"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Web Link</span>
                            </a>
                          </div>

                          <div className="italic text-slate-600 text-xs bg-white p-2 rounded-lg border border-slate-100 line-clamp-3">
                            {rx.notes ? `"${rx.notes}"` : 'No written notes provided. Please check prescription photo.'}
                          </div>

                          {rx.quoteAmount ? (
                            <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                              Quoted Bill: Rs. {rx.quoteAmount.toLocaleString()}
                            </div>
                          ) : null}

                          <div className="text-[10px] text-slate-400">
                            Prescription ID: <strong className="font-mono">{rx.id}</strong> • Submitted: {new Date(rx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(rx.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setQuotingRx(rx);
                              setQuoteInputAmount(rx.quoteAmount || 0);
                              setQuoteInputNotes(rx.pharmacistNotes || '');
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-white/20" />
                            <span>Send Quotation on WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenRxReplyModal(rx)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                            title="Reply to patient directly from Store WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Reply to Patient</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setZoomedRx(rx)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Inspect high resolution image"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </div>

                        <button
                          onClick={() => deletePrescription(rx.id)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                          title="Delete Prescription record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
                <FileText className="w-10 h-10 mx-auto text-slate-300" />
                <div className="font-bold text-slate-700">No prescription uploads received yet</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  When customers upload prescriptions on the store or via WhatsApp checkout, they appear here live.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: WHATSAPP ORDERS & STATUS PROCESS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Header & Controls */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 fill-emerald-600/20" />
                  </span>
                  <h2 className="text-xl font-black text-slate-900">
                    WhatsApp Orders &amp; Fulfillment Workflow
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Review customer WhatsApp orders with optional attached doctor prescriptions, advance fulfillment stages (<strong className="text-emerald-700">Approved &rarr; Packed &rarr; Delivered</strong>), and open pre-formatted WhatsApp status messages to notify customers directly.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => loadSampleOrders()}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  title="Reload default sample orders for testing"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Load Demo Orders</span>
                </button>

                {orders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setConfirmClearOrdersModal(true)}
                    className="px-3.5 py-2 border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    <span>Clear Orders</span>
                  </button>
                )}
              </div>
            </div>

            {/* Workflow Pipeline Stats Summary (Interactive Filters) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* All Orders */}
              <button
                type="button"
                onClick={() => setOrderStatusFilter('all')}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                  orderStatusFilter === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-800'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 shadow-xs'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-75">All Orders</div>
                <div className="text-2xl font-black mt-1">{orders.length}</div>
                <div className="text-[10px] opacity-75 mt-0.5">Total registered</div>
              </button>

              {/* Placed on WhatsApp */}
              <button
                type="button"
                onClick={() => setOrderStatusFilter('placed_on_whatsapp')}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                  orderStatusFilter === 'placed_on_whatsapp'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md ring-2 ring-amber-400'
                    : 'bg-white border-slate-200 hover:border-amber-300 text-slate-800 shadow-xs'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>New on WhatsApp</span>
                </div>
                <div className="text-2xl font-black mt-1">
                  {orders.filter(o => o.status === 'placed_on_whatsapp' || !o.status).length}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Awaiting review</div>
              </button>

              {/* With Prescription Attached */}
              <button
                type="button"
                onClick={() => setOrderStatusFilter('has_prescription')}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                  orderStatusFilter === 'has_prescription'
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-md ring-2 ring-emerald-600'
                    : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-800 shadow-xs'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-emerald-600" />
                  <span>Rx Prescriptions</span>
                </div>
                <div className="text-2xl font-black mt-1">
                  {orders.filter(o => Boolean(o.prescriptionImage)).length}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Doctor slip attached</div>
              </button>

              {/* Approved */}
              <button
                type="button"
                onClick={() => setOrderStatusFilter('approved')}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                  orderStatusFilter === 'approved'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400'
                    : 'bg-white border-slate-200 hover:border-blue-300 text-slate-800 shadow-xs'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-blue-600" />
                  <span>Approved</span>
                </div>
                <div className="text-2xl font-black mt-1">
                  {orders.filter(o => o.status === 'approved').length}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Pharmacist verified</div>
              </button>

              {/* Packed */}
              <button
                type="button"
                onClick={() => setOrderStatusFilter('packed')}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                  orderStatusFilter === 'packed'
                    ? 'bg-purple-700 text-white border-purple-700 shadow-md ring-2 ring-purple-500'
                    : 'bg-white border-slate-200 hover:border-purple-300 text-slate-800 shadow-xs'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1">
                  <Package className="w-3 h-3 text-purple-600" />
                  <span>Packed</span>
                </div>
                <div className="text-2xl font-black mt-1">
                  {orders.filter(o => o.status === 'packed').length}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Ready for rider</div>
              </button>

              {/* Delivered */}
              <button
                type="button"
                onClick={() => setOrderStatusFilter('delivered')}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                  orderStatusFilter === 'delivered'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-md ring-2 ring-teal-500'
                    : 'bg-white border-slate-200 hover:border-teal-300 text-slate-800 shadow-xs'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-teal-600 flex items-center gap-1">
                  <Truck className="w-3 h-3 text-teal-600" />
                  <span>Delivered</span>
                </div>
                <div className="text-2xl font-black mt-1">
                  {orders.filter(o => o.status === 'delivered').length}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Completed</div>
              </button>
            </div>

            {/* Search and Filters Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-md">
                <input
                  type="text"
                  placeholder="Search by Order ID, customer, phone, address, or product..."
                  value={orderSearchQuery}
                  onChange={e => setOrderSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-xs focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                {orderSearchQuery && (
                  <button
                    onClick={() => setOrderSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter pills */}
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                <span className="text-[11px] font-semibold text-slate-400 mr-1">Filter:</span>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'placed_on_whatsapp', label: 'New' },
                  { key: 'has_prescription', label: 'Rx Attached' },
                  { key: 'approved', label: 'Approved' },
                  { key: 'packed', label: 'Packed' },
                  { key: 'delivered', label: 'Delivered' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setOrderStatusFilter(tab.key as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      orderStatusFilter === tab.key
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Feed */}
            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="font-bold text-slate-900 text-base">No WhatsApp Orders Logged Yet</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    When customers checkout items and upload prescriptions through the WhatsApp store, orders will appear here automatically with their complete status pipeline.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => loadSampleOrders()}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  Load Demo Orders to Test
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders
                  .filter(order => {
                    if (orderStatusFilter === 'has_prescription' && !order.prescriptionImage) return false;
                    if (orderStatusFilter === 'placed_on_whatsapp' && order.status !== 'placed_on_whatsapp' && Boolean(order.status)) return false;
                    if (orderStatusFilter === 'approved' && order.status !== 'approved') return false;
                    if (orderStatusFilter === 'packed' && order.status !== 'packed') return false;
                    if (orderStatusFilter === 'delivered' && order.status !== 'delivered') return false;
                    if (orderStatusFilter === 'cancelled' && order.status !== 'cancelled') return false;

                    if (orderSearchQuery.trim()) {
                      const q = orderSearchQuery.toLowerCase().trim();
                      const matchId = order.id.toLowerCase().includes(q);
                      const matchName = order.customerName.toLowerCase().includes(q);
                      const matchPhone = order.phone.toLowerCase().includes(q);
                      const matchAddress = order.address.toLowerCase().includes(q);
                      const matchItem = order.items.some(i => i.product.name.toLowerCase().includes(q));
                      const matchRx = order.prescriptionNotes?.toLowerCase().includes(q);
                      return matchId || matchName || matchPhone || matchAddress || matchItem || matchRx;
                    }
                    return true;
                  })
                  .map(order => {
                    const isExpanded = expandedOrderIds.has(order.id);
                    const hasRx = Boolean(order.prescriptionImage);

                    return (
                      <div
                        key={order.id}
                        className={`bg-white rounded-3xl border transition shadow-xs overflow-hidden ${
                          order.status === 'placed_on_whatsapp' || !order.status
                            ? 'border-amber-300 ring-1 ring-amber-200/60'
                            : order.status === 'approved'
                            ? 'border-blue-300'
                            : order.status === 'packed'
                            ? 'border-purple-300'
                            : order.status === 'delivered'
                            ? 'border-emerald-300'
                            : 'border-slate-200'
                        }`}
                      >
                        {/* Order Card Top Bar */}
                        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2.5">
                            {/* Order ID */}
                            <button
                              type="button"
                              onClick={() => handleCopyOrderId(order.id)}
                              className="inline-flex items-center gap-1.5 font-mono font-black text-xs text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 transition cursor-pointer"
                              title="Click to copy Order ID"
                            >
                              <span>{order.id}</span>
                              <Copy className="w-3 h-3 text-slate-400" />
                              {copiedOrderId === order.id && (
                                <span className="text-[10px] text-emerald-600 font-sans font-bold">Copied!</span>
                              )}
                            </button>

                            {/* Timestamp */}
                            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>
                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                                {new Date(order.createdAt).toLocaleDateString()}
                              </span>
                            </span>

                            {/* Prescription Badge */}
                            {hasRx && (
                              <button
                                type="button"
                                onClick={() => setSelectedOrderForRxZoom(order)}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200 transition cursor-pointer"
                              >
                                <FileText className="w-3 h-3 text-emerald-700" />
                                <span>Rx Doctor Prescription Attached</span>
                              </button>
                            )}

                            {/* Payment Badge */}
                            {order.paymentMethod && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700">
                                <CreditCard className="w-3 h-3 text-slate-500" />
                                <span>{order.paymentMethod}</span>
                              </span>
                            )}
                          </div>

                          {/* Current Status Badge */}
                          <div className="flex items-center gap-2">
                            {order.status === 'approved' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                                <span>Approved by Pharmacist</span>
                              </span>
                            ) : order.status === 'packed' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200">
                                <Package className="w-3.5 h-3.5 text-purple-600" />
                                <span>Packed &amp; Ready for Delivery</span>
                              </span>
                            ) : order.status === 'delivered' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Delivered</span>
                              </span>
                            ) : order.status === 'cancelled' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-200">
                                <X className="w-3.5 h-3.5 text-red-600" />
                                <span>Cancelled</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-950 border border-amber-300">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                <span>New on WhatsApp</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Order Card Body */}
                        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                          {/* Left Column: Customer details & Notes (5 cols) */}
                          <div className="lg:col-span-5 space-y-3">
                            <div>
                              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Customer Details</div>
                              <h3 className="text-base font-extrabold text-slate-900 mt-0.5 flex items-center gap-2">
                                <span>{order.customerName}</span>
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <a
                                  href={`tel:${order.phone}`}
                                  className="text-xs font-bold text-slate-700 hover:text-emerald-700 flex items-center gap-1"
                                >
                                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{order.phone}</span>
                                </a>
                                {cleanPatientWhatsAppPhone(order.phone) ? (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <a
                                      href={`https://wa.me/${cleanPatientWhatsAppPhone(order.phone)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                                    >
                                      <MessageCircle className="w-3 h-3 text-emerald-600" />
                                      <span>Direct Chat</span>
                                    </a>
                                  </>
                                ) : null}
                              </div>
                            </div>

                            {/* Delivery Address */}
                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                              <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Delivery Destination
                                </div>
                                <div className="text-xs font-medium text-slate-800 leading-snug mt-0.5">
                                  {order.address}
                                </div>
                              </div>
                            </div>

                            {/* Customer Notes */}
                            {order.notes && (
                              <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-snug">
                                <span className="font-bold">Customer Note: </span>
                                <span>&ldquo;{order.notes}&rdquo;</span>
                              </div>
                            )}

                            {/* Attached Prescription (Rx) Preview Box */}
                            {hasRx && (
                              <div className="p-3 bg-emerald-50/80 border border-emerald-300/80 rounded-2xl space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
                                    <FileText className="w-4 h-4 text-emerald-700" />
                                    <span>Attached Doctor Prescription</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedOrderForRxZoom(order)}
                                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-0.5 cursor-pointer"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>Zoom &amp; Review</span>
                                    </button>
                                    {cleanPatientWhatsAppPhone(order.phone) ? (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenWhatsAppMsgModal(order, 'approved')}
                                        className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline flex items-center gap-0.5 cursor-pointer"
                                        title="Reply to patient directly from Store/Staff WhatsApp regarding this prescription attachment"
                                      >
                                        <MessageCircle className="w-3 h-3 text-blue-600" />
                                        <span>Reply to Patient</span>
                                      </button>
                                    ) : null}
                                  </div>
                                </div>

                                <div className="flex items-start gap-3 pt-1">
                                  <img
                                    src={order.prescriptionImage}
                                    alt="Prescription slip"
                                    onClick={() => setSelectedOrderForRxZoom(order)}
                                    className="w-14 h-14 object-cover rounded-xl border border-emerald-300 shadow-2xs cursor-pointer hover:opacity-90 transition shrink-0"
                                    title="Click to zoom in full resolution"
                                  />
                                  <div className="min-w-0 flex-1 text-xs">
                                    <div className="font-bold text-slate-800 truncate" title={order.prescriptionFileName}>
                                      {order.prescriptionFileName || 'prescription-slip.jpg'}
                                    </div>
                                    {order.prescriptionNotes ? (
                                      <p className="text-[11px] text-emerald-900/90 italic line-clamp-2 mt-0.5">
                                        &ldquo;{order.prescriptionNotes}&rdquo;
                                      </p>
                                    ) : (
                                      <p className="text-[10px] text-slate-500 mt-0.5">
                                        Uploaded by customer during WhatsApp checkout.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right Column: Items summary, Bill breakdown, and Actions (7 cols) */}
                          <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
                            {/* Items Header & Toggle */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="text-xs font-bold text-slate-800">
                                  Order Items ({order.items.reduce((s, i) => s + i.quantity, 0)} items across {order.items.length} products)
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleExpandOrder(order.id)}
                                  className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                                >
                                  <span>{isExpanded ? 'Hide Itemized List' : 'View Items & Breakdown'}</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>

                              {/* Compact preview when collapsed */}
                              {!isExpanded ? (
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 text-xs">
                                  <div className="text-slate-600 line-clamp-1 min-w-0">
                                    {order.items.map(i => `${i.quantity}x ${i.product.name}`).join(' • ')}
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className="text-sm font-black text-emerald-900 font-mono">
                                      Rs. {order.total.toLocaleString()}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      {order.deliveryFee === 0 ? 'Free Delivery' : `+Rs. ${order.deliveryFee} fee`}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                /* Full breakdown when expanded */
                                <div className="space-y-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in duration-200">
                                  <div className="divide-y divide-slate-200/70 max-h-48 overflow-y-auto pr-1">
                                    {order.items.map((item, idx) => (
                                      <div key={idx} className="py-2 flex items-center justify-between gap-3 text-xs">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <img
                                            src={item.product.image}
                                            alt={item.product.name}
                                            onError={e => {
                                              (e.target as HTMLImageElement).src =
                                                'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500';
                                            }}
                                            className="w-9 h-9 object-contain rounded-lg bg-white border border-slate-200 p-0.5 shrink-0"
                                          />
                                          <div className="min-w-0">
                                            <div className="font-bold text-slate-800 truncate" title={item.product.name}>
                                              {item.product.name}
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                              Qty: {item.quantity} &times; Rs. {item.product.price.toLocaleString()} ({item.product.unit})
                                            </div>
                                          </div>
                                        </div>
                                        <div className="font-mono font-bold text-slate-900 shrink-0">
                                          Rs. {(item.quantity * item.product.price).toLocaleString()}
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                                    <div className="flex justify-between text-slate-600">
                                      <span>Subtotal:</span>
                                      <span className="font-mono">Rs. {order.subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                      <span>Delivery Fee:</span>
                                      <span className="font-mono">
                                        {order.deliveryFee === 0 ? 'FREE' : `Rs. ${order.deliveryFee}`}
                                      </span>
                                    </div>
                                    <div className="flex justify-between font-extrabold text-sm text-emerald-950 pt-1 border-t border-slate-200">
                                      <span>Grand Total:</span>
                                      <span className="font-mono text-base font-black text-emerald-900">
                                        Rs. {order.total.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Workflow Actions Pipeline (Process like Approved, Packed, Delivered) */}
                            <div className="pt-3 border-t border-slate-100 space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                  Process Order &amp; WhatsApp Status:
                                </span>

                                {/* Quick Status Selector Dropdown */}
                                <select
                                  value={order.status || 'placed_on_whatsapp'}
                                  onChange={e => {
                                    const next = e.target.value as OrderStatus;
                                    handleAdvanceOrderStatus(order, next, true);
                                  }}
                                  className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-purple-600 cursor-pointer shadow-2xs"
                                >
                                  <option value="placed_on_whatsapp">🟡 New on WhatsApp</option>
                                  <option value="approved">🔵 Approved by Pharmacist</option>
                                  <option value="packed">🟣 Packed &amp; Ready</option>
                                  <option value="delivered">🟢 Delivered</option>
                                  <option value="cancelled">🔴 Cancelled</option>
                                </select>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {/* Workflow Stage Buttons */}
                                {order.status === 'placed_on_whatsapp' || !order.status ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleAdvanceOrderStatus(order, 'approved', true)}
                                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Approve Order &amp; Rx</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAdvanceOrderStatus(order, 'packed', true)}
                                      className="py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                                    >
                                      <Package className="w-3.5 h-3.5" />
                                      <span>Pack</span>
                                    </button>
                                  </>
                                ) : order.status === 'approved' ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleAdvanceOrderStatus(order, 'packed', true)}
                                      className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                                    >
                                      <Package className="w-3.5 h-3.5" />
                                      <span>Mark as Packed &amp; Dispatched</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAdvanceOrderStatus(order, 'delivered', true)}
                                      className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                                    >
                                      <Truck className="w-3.5 h-3.5" />
                                      <span>Deliver</span>
                                    </button>
                                  </>
                                ) : order.status === 'packed' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleAdvanceOrderStatus(order, 'delivered', true)}
                                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                                  >
                                    <Truck className="w-3.5 h-3.5" />
                                    <span>Mark as Successfully Delivered</span>
                                  </button>
                                ) : order.status === 'delivered' ? (
                                  <div className="flex-1 py-1.5 px-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                                    <span>Order Completed &amp; Delivered</span>
                                  </div>
                                ) : null}

                                {/* Big Green Button: Open WhatsApp Message Dialog */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenWhatsAppMsgModal(order)}
                                  className="py-2 px-3.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-700/20 transition cursor-pointer shrink-0"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 fill-white/20" />
                                  <span>Open WhatsApp Msg</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-3xl space-y-6">
            <div className="pb-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-6 h-6 text-purple-600" />
                <span>Storefront Configuration &amp; Contact Numbers</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Update store timings, tagline, and the delivery WhatsApp phone number.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Store Tagline:
                  </label>
                  <input
                    type="text"
                    value={cfgTagline}
                    onChange={e => setCfgTagline(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-semibold text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400">Required: &ldquo;With us its original&rdquo;</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Delivery WhatsApp Hotline (Display):
                  </label>
                  <input
                    type="text"
                    value={cfgPhone}
                    onChange={e => setCfgPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-semibold text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400">User number: 03205868464</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    WhatsApp Country Code Format (wa.me):
                  </label>
                  <input
                    type="text"
                    value={cfgWaNumber}
                    onChange={e => setCfgWaNumber(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-semibold text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400">Pakistan: 923205868464</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Operating Timings:
                  </label>
                  <input
                    type="text"
                    value={cfgDaysOpen}
                    onChange={e => setCfgDaysOpen(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-semibold text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400">8:00 AM to 1:00 AM, 7 Days a Week</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Free Delivery Threshold (PKR):
                  </label>
                  <input
                    type="number"
                    value={cfgFreeThreshold}
                    onChange={e => setCfgFreeThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Standard Delivery Fee (PKR):
                  </label>
                  <input
                    type="number"
                    value={cfgFee}
                    onChange={e => setCfgFee(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Save Store Settings
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetToDefaultData();
                  }}
                  className="px-3.5 py-2 text-red-600 hover:bg-red-50 rounded-xl font-semibold transition cursor-pointer"
                >
                  Reset to Factory Data
                </button>
              </div>
            </form>

            {/* REMIX DEFAULTS LOCK MANAGEMENT CARD */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="bg-emerald-50/80 border border-emerald-300 rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-base text-emerald-950">
                        Locked Jan Chemist Remix Defaults
                      </h3>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300">
                        Default Baseline Locked
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      This application is locked to <strong>Jan Chemist</strong> defaults: original vector logo (<code>/logo.svg</code>), WhatsApp ordering number <strong>03205868464</strong>, 10 department categories, and authentic inventory pictures. Any new remix will automatically launch with this pristine baseline, while allowing custom owner changes.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 bg-white/90 p-3.5 rounded-2xl border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span><strong>Logo:</strong> /logo.svg (White text + Red pulse)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span><strong>WhatsApp:</strong> 03205868464 (923205868464)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span><strong>Motto:</strong> &ldquo;With us its original&rdquo;</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span><strong>Departments:</strong> 10 Authentic retail depts</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      lockAsRemixDefault();
                    }}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Lock Current State as Remix Default</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      resetToDefaultData();
                    }}
                    className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4 text-emerald-700" />
                    <span>Restore Locked Baseline Defaults</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Owner Security Lock & PIN Management Card */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Owner Security Lock &amp; PIN
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Protects your backend and customer orders. Customers will be prompted for this PIN before entering.
                    </p>
                  </div>
                </div>

                <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-full">
                  PIN Active: {storeConfig.adminPin || '1234'}
                </span>
              </div>

              <form onSubmit={handleSavePin} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      New 4-Digit Owner PIN:
                    </label>
                    <input
                      type="password"
                      maxLength={8}
                      required
                      placeholder="e.g. 5678"
                      value={cfgNewPin}
                      onChange={e => setCfgNewPin(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl font-mono text-slate-800 font-bold focus:border-purple-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Confirm New PIN:
                    </label>
                    <input
                      type="password"
                      maxLength={8}
                      required
                      placeholder="Re-enter PIN"
                      value={cfgConfirmPin}
                      onChange={e => setCfgConfirmPin(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl font-mono text-slate-800 font-bold focus:border-purple-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Update Owner PIN</span>
                  </button>

                  <button
                    type="button"
                    onClick={lockOwnerSession}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock Session &amp; Test Customer Screen</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 8: CUSTOM DOMAIN & BACKEND SERVER DEPLOYMENT */}
        {activeTab === 'deployment' && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-emerald-800/60 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-3xl space-y-3 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/70 border border-emerald-600/60 text-emerald-300 text-xs font-bold">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Production Deployment Assistant</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Deploy Jan Chemist on Your Custom Domain &amp; Server
                </h2>
                <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
                  Configure your official domain (e.g. <strong>{deploymentDomain}</strong>) and set up the Node.js/Express backend server with 24/7 uptime, automated Nginx reverse proxy, and free Let&apos;s Encrypt SSL/HTTPS.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs border border-white/15">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Customer Website: <strong>100% Shopper-Only</strong></span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs border border-white/15">
                    <Lock className="w-4 h-4 text-purple-400" />
                    <span>Backend Admin: <strong>https://{deploymentDomain}/admin</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Domain & IP Configurator */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-emerald-600" />
                    <span>Interactive Domain Configurator</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enter your purchased domain and server IP address to generate tailored DNS records and configuration files.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Your Custom Domain Name *:
                  </label>
                  <input
                    type="text"
                    value={deploymentDomain}
                    onChange={e => setDeploymentDomain(e.target.value.toLowerCase().replace(/https?:\/\//, '').replace(/\/.*$/, '').trim())}
                    placeholder="e.g. janchemist.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Domain purchased on GoDaddy, Namecheap, Cloudflare, etc.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Your VPS / Server Public IP Address *:
                  </label>
                  <input
                    type="text"
                    value={deploymentServerIp}
                    onChange={e => setDeploymentServerIp(e.target.value.trim())}
                    placeholder="e.g. 142.93.120.45"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Assigned by DigitalOcean, Hetzner, AWS EC2, Linode, etc.
                  </span>
                </div>
              </div>

              {/* Dynamic DNS Records Table */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    DNS Records to add in your Domain Registrar (Cloudflare, GoDaddy, Namecheap):
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleCopySnippet('dns', `Type: A | Host: @ | Value: ${deploymentServerIp || 'YOUR_SERVER_IP'}\nType: CNAME | Host: www | Value: ${deploymentDomain || 'janchemist.com'}`)}
                    className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedSnippetId === 'dns' ? 'Copied!' : 'Copy DNS Info'}</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Name / Host</th>
                        <th className="py-2.5 px-3">Value / Target</th>
                        <th className="py-2.5 px-3">TTL</th>
                        <th className="py-2.5 px-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-bold text-blue-700">A</td>
                        <td className="py-2.5 px-3">@ (apex)</td>
                        <td className="py-2.5 px-3 font-bold">{deploymentServerIp || 'YOUR_SERVER_IP'}</td>
                        <td className="py-2.5 px-3 text-slate-500">Auto / 300s</td>
                        <td className="py-2.5 px-3 font-sans">
                          <button
                            type="button"
                            onClick={() => handleCopySnippet('a-record', deploymentServerIp || 'YOUR_SERVER_IP')}
                            className="text-emerald-700 hover:underline text-[11px] font-bold"
                          >
                            {copiedSnippetId === 'a-record' ? 'Copied' : 'Copy IP'}
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-bold text-purple-700">CNAME</td>
                        <td className="py-2.5 px-3">www</td>
                        <td className="py-2.5 px-3 font-bold">{deploymentDomain || 'janchemist.com'}</td>
                        <td className="py-2.5 px-3 text-slate-500">Auto / 300s</td>
                        <td className="py-2.5 px-3 font-sans">
                          <button
                            type="button"
                            onClick={() => handleCopySnippet('cname-record', deploymentDomain || 'janchemist.com')}
                            className="text-emerald-700 hover:underline text-[11px] font-bold"
                          >
                            {copiedSnippetId === 'cname-record' ? 'Copied' : 'Copy Host'}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Step-by-Step Server Setup Tabs/Steps */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Step 1: Provisioning & Node 20 */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                      1
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">
                      Install Node.js 20 &amp; PM2 on Ubuntu
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopySnippet('step1', `sudo apt update && sudo apt upgrade -y\ncurl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -\nsudo apt install -y nodejs git nginx certbot python3-certbot-nginx\nsudo npm install -g pm2`)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                    title="Copy commands"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Log in to your Ubuntu 22.04/24.04 LTS VPS via SSH (`ssh root@{deploymentServerIp || 'YOUR_IP'}`) and run:
                </p>

                <div className="bg-slate-900 rounded-xl p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto border border-slate-800">
                  <code>
                    <span className="text-slate-500"># 1. Update packages &amp; install Node.js 20 + Nginx</span><br />
                    sudo apt update &amp;&amp; sudo apt upgrade -y<br />
                    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -<br />
                    sudo apt install -y nodejs git nginx certbot python3-certbot-nginx<br /><br />
                    <span className="text-slate-500"># 2. Install PM2 process manager globally</span><br />
                    sudo npm install -g pm2
                  </code>
                </div>
              </div>

              {/* Step 2: Clone & Build App */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                      2
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">
                      Deploy App &amp; Run with PM2
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopySnippet('step2', `sudo mkdir -p /var/www/janchemist\nsudo chown -R $USER:$USER /var/www/janchemist\ncd /var/www/janchemist\n# Clone your repository files here\nnpm install\nnpm run build\npm2 start server.ts --name "janchemist" --interpreter ./node_modules/.bin/tsx\npm2 save\npm2 startup`)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                    title="Copy commands"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Clone your repository into `/var/www/janchemist`, install dependencies, build Vite, and start PM2:
                </p>

                <div className="bg-slate-900 rounded-xl p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto border border-slate-800">
                  <code>
                    <span className="text-slate-500"># In /var/www/janchemist:</span><br />
                    npm install<br />
                    npm run build<br /><br />
                    <span className="text-slate-500"># Start backend daemon on port 3000:</span><br />
                    pm2 start server.ts --name &quot;janchemist&quot; --interpreter ./node_modules/.bin/tsx<br />
                    pm2 save<br />
                    pm2 startup
                  </code>
                </div>
              </div>
            </div>

            {/* Step 3: Nginx Reverse Proxy & Port 80/443 Forwarding */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <h4 className="font-bold text-base text-slate-900">
                      Nginx Reverse Proxy Configuration (Port 80/443 &rarr; Port 3000)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Creates `/etc/nginx/sites-available/janchemist` customized for <strong>{deploymentDomain}</strong>.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopySnippet('nginx-config', `server {
    listen 80;
    listen [::]:80;
    server_name ${deploymentDomain} www.${deploymentDomain};

    # High body size limit for customer prescription photo uploads
    client_max_body_size 50M;

    # Gzip compression for fast loading
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # Cache static assets
    location ~* \\.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|webp)$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}`)}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedSnippetId === 'nginx-config' ? 'Copied Nginx Config!' : 'Copy Tailored Nginx Config'}</span>
                </button>
              </div>

              <div className="bg-slate-900 rounded-2xl p-4 font-mono text-[11px] text-slate-200 overflow-x-auto border border-slate-800">
                <pre className="text-emerald-300">
{`server {
    listen 80;
    listen [::]:80;
    server_name ${deploymentDomain} www.${deploymentDomain};

    # High body size limit for customer prescription photo uploads
    client_max_body_size 50M;

    # Gzip compression for fast mobile loading
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location ~* \\.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|webp)$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}`}
                </pre>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs text-slate-700">
                <div className="font-bold text-slate-900">How to apply this Nginx config on your server:</div>
                <div className="font-mono text-[11px] text-purple-700 bg-white p-2 rounded-lg border border-slate-200">
                  sudo nano /etc/nginx/sites-available/janchemist<br />
                  <span className="text-slate-500"># Paste config, save (Ctrl+O, Enter, Ctrl+X), then:</span><br />
                  sudo ln -s /etc/nginx/sites-available/janchemist /etc/nginx/sites-enabled/<br />
                  sudo nginx -t &amp;&amp; sudo systemctl restart nginx
                </div>
              </div>
            </div>

            {/* Step 4: Free SSL / HTTPS via Let's Encrypt */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    4
                  </span>
                  <div>
                    <h4 className="font-bold text-base text-slate-900">
                      Enable Free Automatic SSL / HTTPS (Let&apos;s Encrypt)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Locks your domain with the green padlock and enables PWA installability and secure camera uploads.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopySnippet('ssl-command', `sudo certbot --nginx -d ${deploymentDomain} -d www.${deploymentDomain}`)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedSnippetId === 'ssl-command' ? 'Copied!' : 'Copy SSL Command'}</span>
                </button>
              </div>

              <div className="bg-slate-900 rounded-xl p-3.5 font-mono text-[12px] text-emerald-400 border border-slate-800">
                <code>sudo certbot --nginx -d {deploymentDomain} -d www.{deploymentDomain}</code>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Certbot will automatically obtain an A+ rating SSL certificate, configure Nginx to renew it every 60 days, and redirect all standard HTTP traffic to secure HTTPS.
              </p>
            </div>

            {/* Step 5: Customer vs. Admin Portal Separation Verification */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900">
                    Customer Storefront vs. Backend Portal Route Separation
                  </h4>
                  <p className="text-xs text-slate-500">
                    How URLs work once your custom domain is live.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-800">
                      Customer Storefront (Customer-Only)
                    </span>
                  </div>
                  <div className="font-mono font-bold text-xs text-emerald-950 bg-white p-2 rounded-lg border border-emerald-200">
                    https://{deploymentDomain}/
                  </div>
                  <p className="text-[11px] text-emerald-900 leading-relaxed">
                    Shoppers browse 9+ departments, view product formulations, add to cart, upload doctor prescriptions, and checkout directly via WhatsApp. Zero admin buttons or internal tools are displayed.
                  </p>
                </div>

                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                    <span className="font-extrabold text-xs uppercase tracking-wider text-purple-800">
                      Owner &amp; Pharmacist Backend Portal
                    </span>
                  </div>
                  <div className="font-mono font-bold text-xs text-purple-950 bg-white p-2 rounded-lg border border-purple-200">
                    https://{deploymentDomain}/admin
                  </div>
                  <p className="text-[11px] text-purple-900 leading-relaxed">
                    Direct access for store owners and staff. Protected by the 4-digit PIN ({storeConfig.adminPin || '1234'}). Allows full catalog editing, Google search auto-enrichment, prescription verification, and order processing.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 6: Alternative Cloud Run / Container Hosting */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">
                      Alternative: 1-Command Serverless Hosting (Google Cloud Run)
                    </h4>
                    <p className="text-xs text-slate-400">
                      No Linux maintenance. Zero-cost scale to zero when not in use.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopySnippet('cloud-run', `gcloud run deploy janchemist --source . --port 3000 --allow-unauthenticated --region asia-southeast1`)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedSnippetId === 'cloud-run' ? 'Copied' : 'Copy Deploy Cmd'}</span>
                </button>
              </div>

              <div className="bg-slate-950 rounded-xl p-3 font-mono text-[11px] text-teal-300 border border-slate-800">
                <code>gcloud run deploy janchemist --source . --port 3000 --allow-unauthenticated --region asia-southeast1</code>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                After deployment, navigate to <strong>Google Cloud Console &gt; Cloud Run &gt; Manage Custom Domains &gt; Add Mapping</strong> and enter <strong>{deploymentDomain}</strong>. Google automatically provisions SSL certificates and handles DNS routing!
              </p>
            </div>
          </div>
        )}

        {/* TAB: DEPARTMENTS CRUD */}
        {activeTab === 'departments' && <DepartmentsManager />}

        {/* TAB: SUPABASE CLOUD BACKEND & SQL SCHEMA */}
        {activeTab === 'cloud-backend' && <SupabaseBackendManager />}
      </div>

      {/* Modal: Add Product Manually */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 bg-purple-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-purple-300" />
                <span>Add Product to Jan Chemist Inventory</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {/* Google Auto-Search & Auto-Fill in Add Modal */}
              <GoogleSearchEnricher
                initialQuery={newProdName}
                preferredDept={newProdDept}
                currentImageUrl={newProdImage}
                onApplyResult={res => {
                  setNewProdName(res.name);
                  setNewProdDept(res.department);
                  if (res.category) setNewProdCategory(res.category);
                  if (res.price) setNewProdPrice(res.price);
                  if (res.originalPrice) setNewProdOrigPrice(res.originalPrice);
                  if (res.unit) setNewProdUnit(res.unit);
                  if (res.sku) setNewProdSku(res.sku);
                  if (res.barcode) setNewProdBarcode(res.barcode);
                  if (res.image) setNewProdImage(res.image);
                  if (res.description) setNewProdDesc(res.description);
                }}
                onSelectImage={imgUrl => setNewProdImage(imgUrl)}
              />

              <div>
                <label className="block font-bold text-slate-800 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maybelline Superstay Matte Ink Lipstick"
                  value={newProdName}
                  onChange={e => setNewProdName(e.target.value)}
                  className="w-full px-3.5 py-2 border rounded-xl focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Department *</label>
                  <select
                    value={newProdDept}
                    onChange={e => setNewProdDept(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl focus:border-purple-600 focus:outline-none capitalize font-semibold"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Category / Subcategory</label>
                  <input
                    type="text"
                    placeholder="e.g. Lipsticks, Skincare, Breakfast"
                    value={newProdCategory}
                    onChange={e => setNewProdCategory(e.target.value)}
                    className="w-full px-3.5 py-2 border rounded-xl focus:border-purple-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Price (PKR) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newProdPrice}
                    onChange={e => setNewProdPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border rounded-xl focus:border-purple-600 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Original Price (Strike)</label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={newProdOrigPrice || ''}
                    onChange={e => setNewProdOrigPrice(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3.5 py-2 border rounded-xl focus:border-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newProdStock}
                    onChange={e => setNewProdStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border rounded-xl focus:border-purple-600 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Packaging Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. 100g, Pack, Bottle"
                    value={newProdUnit}
                    onChange={e => setNewProdUnit(e.target.value)}
                    className="w-full px-3.5 py-2 border rounded-xl focus:border-purple-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">SKU Code</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={newProdSku}
                    onChange={e => setNewProdSku(e.target.value)}
                    className="w-full px-3.5 py-2 border rounded-xl focus:border-purple-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Barcode (UPC/EAN)</label>
                  <input
                    type="text"
                    placeholder="e.g. 8964000318012"
                    value={newProdBarcode}
                    onChange={e => setNewProdBarcode(e.target.value)}
                    className="w-full px-3.5 py-2 border rounded-xl focus:border-purple-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newProdImage}
                  onChange={e => setNewProdImage(e.target.value)}
                  className="w-full px-3.5 py-2 border rounded-xl focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Detailed description, genuine guarantees, dosage or usage..."
                  value={newProdDesc}
                  onChange={e => setNewProdDesc(e.target.value)}
                  className="w-full px-3.5 py-2 border rounded-xl focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  Save Product to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Zoom Prescription Image */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white p-2">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 bg-slate-900/80 text-white p-2 rounded-full hover:bg-slate-900"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={zoomedImage}
              alt="Prescription Zoom"
              className="max-h-[85vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Modal: Edit Product with Google Auto-Lookup */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={(id, updates) => {
            updateProduct(id, updates);
            showToast(`Updated "${updates.name || editingProduct.name}" successfully!`, 'success');
          }}
        />
      )}

      {/* Modal: Standalone Google Inventory Search & Auto-Import */}
      <InventoryGoogleSearchModal
        isOpen={isGoogleSearchModalOpen}
        onClose={() => setIsGoogleSearchModalOpen(false)}
        initialQuery={googleSearchQuery}
        onAddProduct={addProduct}
        onOpenAddModalWithDetails={handleOpenAddWithDetails}
        showToast={showToast}
      />

      {/* Activated In-App Delete Confirmation Modal (Replaces blocked window.confirm) */}
      {productToDelete && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setProductToDelete(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Delete Inventory Product?
                </h3>
                <p className="text-xs text-slate-500">
                  Permanently remove this product from Jan Chemist inventory catalog and customer storefront.
                </p>
              </div>
            </div>

            {/* Product Summary */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <img
                src={productToDelete.image}
                alt={productToDelete.name}
                onError={e => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500';
                }}
                className="w-14 h-14 object-contain rounded-xl border border-slate-200 bg-white p-1 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-slate-900 line-clamp-1">
                  {productToDelete.name}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  SKU: <span className="font-mono font-semibold">{productToDelete.sku}</span> • Dept: <span className="capitalize">{productToDelete.department}</span>
                </div>
                <div className="text-xs font-extrabold text-emerald-800 mt-0.5">
                  Rs. {productToDelete.price.toLocaleString()} • Stock: {productToDelete.stock} ({productToDelete.unit})
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Product</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activated Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsBulkDeleteModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Delete {selectedProductIds.length} Selected Products?
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to permanently delete these {selectedProductIds.length} items from your inventory catalog?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All {selectedProductIds.length} Items</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Google Image Picker Modal (Auto-Place directly into stock window) */}
      {activeQuickPicProduct && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setActiveQuickPicProduct(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h3 className="font-bold text-sm text-slate-900">
                  Auto-Place Google Image into Stock Window
                </h3>
              </div>
              <button
                onClick={() => setActiveQuickPicProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Product: <strong className="text-slate-900">{activeQuickPicProduct.name}</strong>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Click any picture discovered from Google below to automatically place it in your stock main window:
              </p>
            </div>

            {/* Paste direct Google Image URL */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Or Paste Image URL Directly from Google / Web:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={quickPicCustomUrl}
                  onChange={e => setQuickPicCustomUrl(cleanAndResolveImageUrl(e.target.value))}
                  placeholder="https://... paste image URL or Google Images link"
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-xl focus:border-purple-600 focus:outline-none text-xs font-mono"
                />
                <button
                  type="button"
                  disabled={!quickPicCustomUrl.trim()}
                  onClick={() => {
                    const cleaned = cleanAndResolveImageUrl(quickPicCustomUrl.trim());
                    updateProduct(activeQuickPicProduct.id, { image: cleaned });
                    showToast(`Placed image for "${activeQuickPicProduct.name}" in stock!`, 'success');
                    setActiveQuickPicProduct(null);
                  }}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer shrink-0 shadow-xs"
                >
                  Place in Stock
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Tip: Automatically extracts image URLs from Google search redirects and proxies hotlink-blocked servers.
              </p>
            </div>

            {isLoadingQuickPics ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                <span>Searching Google Images for authentic packaging...</span>
              </div>
            ) : quickPicOptions.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {quickPicOptions.map((picUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      updateProduct(activeQuickPicProduct.id, { image: picUrl });
                      showToast(`Placed Google image for "${activeQuickPicProduct.name}" in stock!`, 'success');
                      setActiveQuickPicProduct(null);
                    }}
                    className="relative group rounded-xl overflow-hidden border-2 border-slate-200 hover:border-emerald-500 transition p-1 bg-slate-50 cursor-pointer shadow-xs text-left"
                  >
                    <img
                      src={cleanAndResolveImageUrl(picUrl)}
                      alt={`Option ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      onError={e => {
                        const imgEl = e.target as HTMLImageElement;
                        if (!imgEl.src.includes('/api/image-proxy') && !imgEl.src.startsWith('data:')) {
                          imgEl.src = getProxiedImageUrl(picUrl);
                        } else {
                          imgEl.src = DEFAULT_DEPT_IMAGES[activeQuickPicProduct.department] || DEFAULT_DEPT_IMAGES.cosmetics;
                        }
                      }}
                      className="w-full h-24 object-contain"
                    />
                    <div className="mt-1 text-[10px] font-bold text-center text-emerald-700 bg-emerald-50 py-0.5 rounded">
                      Place in Stock
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs space-y-2">
                <p>No automatic picture candidates found for this exact title.</p>
                <a
                  href={getGoogleImagesSearchUrl(activeQuickPicProduct.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Search Google Images Directly ↗</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Edit Packaging, Price & Description Modal */}
      {quickEditProduct && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setQuickEditProduct(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Edit Stock Packaging, Price &amp; Description
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {quickEditProduct.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickEditProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Packaging Unit (Box/Pieces/Dozen/Kg) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Packaging Unit (Box / Pieces / Dozen / Kg / Pack):
              </label>
              <input
                type="text"
                required
                value={quickEditUnit}
                onChange={e => setQuickEditUnit(e.target.value)}
                placeholder="e.g. Box, Pieces, Dozen, Kg"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:border-purple-600 focus:outline-none text-xs font-semibold"
              />
              <div className="flex flex-wrap items-center gap-1 mt-1">
                <span className="text-[10px] text-slate-400 font-semibold mr-1">Presets:</span>
                {PACKAGING_PRESETS.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuickEditUnit(preset)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                      quickEditUnit.toLowerCase() === preset.toLowerCase()
                        ? 'bg-purple-700 text-white border-purple-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Retail Price */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Retail Price (PKR):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  Rs.
                </span>
                <input
                  type="number"
                  min={1}
                  required
                  value={quickEditPrice}
                  onChange={e => setQuickEditPrice(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:border-purple-600 focus:outline-none text-xs font-bold text-emerald-800"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  Product Description:
                </label>
                <span className="text-[10px] text-slate-400">
                  {quickEditDesc.length} characters
                </span>
              </div>
              <textarea
                rows={4}
                value={quickEditDesc}
                onChange={e => setQuickEditDesc(e.target.value)}
                placeholder="Product description, active formulation, dosage, or usage guidelines..."
                className="w-full p-3 border border-slate-300 rounded-xl focus:border-purple-600 focus:outline-none text-xs leading-relaxed"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setQuickEditProduct(null);
                  handleOpenEditProduct(quickEditProduct);
                }}
                className="text-xs text-purple-700 font-bold hover:underline"
              >
                Open Full Specifications Editor &rarr;
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuickEditProduct(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateProduct(quickEditProduct.id, {
                      unit: quickEditUnit.trim() || quickEditProduct.unit,
                      price: Number(quickEditPrice) || quickEditProduct.price,
                      description: quickEditDesc.trim()
                    });
                    showToast(`Updated "${quickEditProduct.name}" info!`, 'success');
                    setQuickEditProduct(null);
                  }}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Order Details & Customer Notification Modal */}
      {selectedOrderForWhatsAppMsg && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedOrderForWhatsAppMsg(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 fill-emerald-600/30" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <span>WhatsApp Order Status &amp; Message</span>
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {selectedOrderForWhatsAppMsg.id}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Customer: <strong className="text-slate-800">{selectedOrderForWhatsAppMsg.customerName}</strong> ({selectedOrderForWhatsAppMsg.phone})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForWhatsAppMsg(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold">Current Status in System:</span>
                <span className="font-bold uppercase text-slate-800">
                  {selectedOrderForWhatsAppMsg.status?.replace('_', ' ') || 'New'}
                </span>
              </div>
              <div className="font-bold text-emerald-900 font-mono">
                Order Total: Rs. {selectedOrderForWhatsAppMsg.total.toLocaleString()}
              </div>
            </div>

            {/* Section 1: Customer's Original WhatsApp Order Message */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>Incoming Customer Order Message:</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyMessageText(
                      selectedOrderForWhatsAppMsg.whatsappMessage ||
                        generateOrderStatusWhatsAppText(selectedOrderForWhatsAppMsg, selectedOrderForWhatsAppMsg.status || 'placed_on_whatsapp', storeConfig)
                    )
                  }
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedMsg ? 'Copied!' : 'Copy Order Text'}</span>
                </button>
              </div>

              <div className="p-3.5 bg-slate-900 text-emerald-300 font-mono text-[11px] leading-relaxed rounded-2xl max-h-48 overflow-y-auto whitespace-pre-wrap select-all shadow-inner">
                {selectedOrderForWhatsAppMsg.whatsappMessage ||
                  generateOrderStatusWhatsAppText(
                    selectedOrderForWhatsAppMsg,
                    selectedOrderForWhatsAppMsg.status || 'placed_on_whatsapp',
                    storeConfig
                  )}
              </div>
            </div>

            {/* Section 2: Send Status Notification on WhatsApp to Customer */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                  <Send className="w-4 h-4 text-emerald-700" />
                  <span>Send Status Notification to Customer via WhatsApp:</span>
                </div>
                <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                  Target: {selectedOrderForWhatsAppMsg.phone}
                </span>
              </div>

              {/* Status pills selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  Select Workflow Stage to Notify Customer:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetNotificationStatus('approved')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      targetNotificationStatus === 'approved'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approved &amp; Rx Verified</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetNotificationStatus('packed')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      targetNotificationStatus === 'packed'
                        ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Packed &amp; Dispatched</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetNotificationStatus('delivered')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      targetNotificationStatus === 'delivered'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Delivered</span>
                  </button>
                </div>
              </div>

              {/* Recipient Phone Validation & Edit */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-800">
                    Patient WhatsApp Phone Number:
                  </label>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    Sending From Store: {storeConfig.displayPhone}
                  </span>
                </div>
                <input
                  type="tel"
                  placeholder="e.g. 03201234567 or 923201234567"
                  value={targetPatientPhoneInput}
                  onChange={e => setTargetPatientPhoneInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
                <p className="text-[10px] text-slate-500">
                  Target patient: <strong>{selectedOrderForWhatsAppMsg.customerName}</strong> &bull; Normalized: <strong className="font-mono text-emerald-800">{cleanPatientWhatsAppPhone(targetPatientPhoneInput || selectedOrderForWhatsAppMsg.phone) || 'Needs valid number'}</strong>
                </p>
              </div>

              {/* Custom note for rider / pharmacist */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Optional Custom Remarks (Rider Name, Contact, ETA, or Pharmacist Advice):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rider Naveed (0300-9876543) will reach in 30 mins, please keep Rs. 2,450 ready."
                  value={customStatusNote}
                  onChange={e => setCustomStatusNote(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
              </div>

              {/* Message Preview */}
              <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Live Message Preview (Will open directly in WhatsApp chat with {selectedOrderForWhatsAppMsg.customerName}):
                </div>
                <div className="text-[11px] text-slate-700 font-mono whitespace-pre-wrap max-h-28 overflow-y-auto leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                  {generateOrderStatusWhatsAppText(
                    { ...selectedOrderForWhatsAppMsg, phone: targetPatientPhoneInput || selectedOrderForWhatsAppMsg.phone },
                    targetNotificationStatus,
                    storeConfig,
                    customStatusNote
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const cleanPhone = cleanPatientWhatsAppPhone(targetPatientPhoneInput || selectedOrderForWhatsAppMsg.phone);
                    if (!cleanPhone) {
                      showToast('Please enter a valid patient phone number (e.g. 03201234567).', 'warning');
                      return;
                    }
                    updateOrderStatus(selectedOrderForWhatsAppMsg.id, targetNotificationStatus);
                    const orderWithPhone = {
                      ...selectedOrderForWhatsAppMsg,
                      phone: cleanPhone
                    };
                    const url = generateOrderStatusWhatsAppUrl(
                      orderWithPhone,
                      targetNotificationStatus,
                      storeConfig,
                      customStatusNote
                    );
                    if (!url) {
                      showToast('Could not format patient WhatsApp URL.', 'warning');
                      return;
                    }
                    window.open(url, '_blank');
                    showToast(`Updated ${selectedOrderForWhatsAppMsg.id} to ${targetNotificationStatus.toUpperCase()} and opened WhatsApp chat!`, 'success');
                    setSelectedOrderForWhatsAppMsg(null);
                  }}
                  className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <MessageCircle className="w-4 h-4 fill-white/20" />
                  <span>Update Order Status &amp; Open WhatsApp Msg</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const cleanPhone = cleanPatientWhatsAppPhone(targetPatientPhoneInput || selectedOrderForWhatsAppMsg.phone);
                    if (!cleanPhone) {
                      showToast('Please enter a valid patient phone number.', 'warning');
                      return;
                    }
                    window.open(`https://wa.me/${cleanPhone}`, '_blank');
                  }}
                  className="w-full sm:w-auto py-3 px-4 border border-slate-300 hover:bg-white text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition text-center cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>Chat Without Preset Msg</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pharmacist Direct Reply to Patient WhatsApp Modal */}
      {replyingRxToPatient && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setReplyingRxToPatient(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Reply to Patient on WhatsApp
                  </h3>
                  <p className="text-xs text-slate-500">
                    Prescription #{replyingRxToPatient.id} &bull; {replyingRxToPatient.customerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyingRxToPatient(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-blue-900">
                  <span>Store WhatsApp: Jan Chemist ({storeConfig.displayPhone})</span>
                  <span>Direct to Patient</span>
                </div>
                <p className="text-[10px] text-blue-800/80">
                  This opens a chat directly with the patient from your store WhatsApp to answer questions or verify prescription.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Patient WhatsApp Phone Number:
                </label>
                <input
                  type="tel"
                  value={rxPatientPhoneInput}
                  onChange={e => setRxPatientPhoneInput(e.target.value)}
                  placeholder="e.g. 03201234567"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Quick Template Chips */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600">
                  Quick Reply Templates:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setRxReplyMessage(
                        `Hello ${replyingRxToPatient.customerName}! 🩺 Your prescription (#${replyingRxToPatient.id}) has been reviewed by our certified pharmacist. All original medicines are available. May we confirm delivery to ${replyingRxToPatient.address}?`
                      )
                    }
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-semibold text-slate-700 cursor-pointer"
                  >
                    Verified &amp; Available
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRxReplyMessage(
                        `Hello ${replyingRxToPatient.customerName}! 🚚 Your prescription order (#${replyingRxToPatient.id}) is packed and dispatched with our rider. Please keep your phone active.`
                      )
                    }
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-semibold text-slate-700 cursor-pointer"
                  >
                    Rider Dispatched
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRxReplyMessage(
                        `Hello ${replyingRxToPatient.customerName}! 🩺 Regarding your prescription (#${replyingRxToPatient.id}), our pharmacist needs a quick clarification on one of the medicine strengths. Could you please advise?`
                      )
                    }
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-semibold text-slate-700 cursor-pointer"
                  >
                    Dosage Clarification
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Message Text:
                </label>
                <textarea
                  rows={4}
                  value={rxReplyMessage}
                  onChange={e => setRxReplyMessage(e.target.value)}
                  placeholder="Type your message to the patient..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-blue-600 focus:outline-none font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReplyingRxToPatient(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const cleanPhone = cleanPatientWhatsAppPhone(rxPatientPhoneInput);
                  if (!cleanPhone) {
                    showToast('Please enter a valid patient phone number.', 'warning');
                    return;
                  }
                  const url = generateReplyToPatientWhatsAppUrl(cleanPhone, rxReplyMessage);
                  window.open(url, '_blank');
                  showToast(`Opened WhatsApp chat with patient ${replyingRxToPatient.customerName}!`, 'success');
                  setReplyingRxToPatient(null);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send via WhatsApp to Patient</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Zoom & Review Modal for WhatsApp Order */}
      {selectedOrderForRxZoom && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedOrderForRxZoom(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Review Doctor Prescription — {selectedOrderForRxZoom.id}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Patient / Customer: <strong className="text-slate-800">{selectedOrderForRxZoom.customerName}</strong> ({selectedOrderForRxZoom.phone})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForRxZoom(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High-res Image Preview */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center max-h-[60vh]">
              <img
                src={selectedOrderForRxZoom.prescriptionImage}
                alt="Prescription slip"
                className="w-full h-auto max-h-[58vh] object-contain select-none"
              />
            </div>

            {/* Prescription Details & Instructions */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  File: {selectedOrderForRxZoom.prescriptionFileName || 'prescription-upload.jpg'}
                </span>
                <span className="font-semibold text-slate-500">
                  Address: {selectedOrderForRxZoom.address}
                </span>
              </div>
              {selectedOrderForRxZoom.prescriptionNotes && (
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-950">
                  <strong className="block text-[10px] uppercase font-bold text-emerald-800">Doctor / Patient Dosage Instructions:</strong>
                  <span>&ldquo;{selectedOrderForRxZoom.prescriptionNotes}&rdquo;</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <a
                href={selectedOrderForRxZoom.prescriptionImage}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Full Original in New Tab</span>
              </a>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForRxZoom(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const currentOrder = selectedOrderForRxZoom;
                    setSelectedOrderForRxZoom(null);
                    handleOpenWhatsAppMsgModal(currentOrder, 'approved');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition"
                  title="Reply to patient directly from Store WhatsApp regarding this prescription attachment"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white/20" />
                  <span>Reply to Patient via WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAdvanceOrderStatus(selectedOrderForRxZoom, 'approved', true);
                    setSelectedOrderForRxZoom(null);
                  }}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve Prescription &amp; Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zoomed Customer Prescription Modal */}
      {zoomedRx && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
          onClick={() => setZoomedRx(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                  <span className="text-xs font-bold text-red-300 uppercase tracking-wider">
                    {zoomedRx.urgency === 'urgent' ? '🚨 URGENT PRESCRIPTION' : 'Standard Routine Prescription'}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-white mt-0.5">
                  Prescription #{zoomedRx.id} &bull; {zoomedRx.customerName} ({zoomedRx.phone})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setZoomedRx(null)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-950 flex flex-col items-center justify-center">
              <img
                src={zoomedRx.prescriptionImage}
                alt="Prescription"
                className="max-h-[60vh] max-w-full object-contain rounded-2xl border border-white/10 shadow-2xl"
              />
              {zoomedRx.notes && (
                <div className="w-full max-w-2xl bg-white/10 text-slate-200 p-3.5 rounded-2xl border border-white/15 text-xs text-center">
                  <strong>Patient Instructions:</strong> &ldquo;{zoomedRx.notes}&rdquo;
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <a
                  href={zoomedRx.viewUrl || `/api/prescriptions/view/${zoomedRx.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Open Public Web Page</span>
                </a>
                <a
                  href={`/api/prescriptions/${zoomedRx.id}/image`}
                  download={`${zoomedRx.fileName || 'prescription.jpg'}`}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download High-Res</span>
                </a>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuotingRx(zoomedRx);
                    setQuoteInputAmount(zoomedRx.quoteAmount || 0);
                    setQuoteInputNotes(zoomedRx.pharmacistNotes || '');
                    setZoomedRx(null);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white/20" />
                  <span>Send Quotation to Patient</span>
                </button>
                <button
                  type="button"
                  onClick={() => setZoomedRx(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quoting Prescription Modal */}
      {quotingRx && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setQuotingRx(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Verify &amp; Quote Prescription #{quotingRx.id}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Patient: {quotingRx.customerName} ({quotingRx.phone})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuotingRx(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Prescription Total Bill Amount (PKR) *:
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">Rs.</span>
                  <input
                    type="number"
                    value={quoteInputAmount || ''}
                    onChange={e => setQuoteInputAmount(Number(e.target.value))}
                    placeholder="e.g. 2450"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Pharmacist Dosage Instructions / Brand Notes:
                </label>
                <textarea
                  rows={3}
                  value={quoteInputNotes}
                  onChange={e => setQuoteInputNotes(e.target.value)}
                  placeholder="e.g. Lipitor 20mg 1 tab at night after meal, Concor 5mg half tab morning. Original Pfizer batch verified."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
                Clicking <strong>Send Quotation via WhatsApp</strong> will update the status on the Jan Chemist server to <strong>Verified by Pharmacist</strong> and open WhatsApp directly to {quotingRx.phone}.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuotingRx(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await updatePrescriptionStatus(quotingRx.id, 'reviewed', quoteInputAmount, quoteInputNotes);
                  const waUrl = generatePrescriptionQuoteWhatsAppUrl(
                    quotingRx,
                    quoteInputAmount,
                    quoteInputNotes,
                    storeConfig
                  );
                  if (!waUrl) {
                    showToast('Patient WhatsApp phone number is invalid. Please verify phone number.', 'warning');
                    return;
                  }
                  window.open(waUrl, '_blank');
                  setQuotingRx(null);
                  showToast(`Quotation sent to ${quotingRx.customerName} on WhatsApp!`, 'success');
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white/20" />
                <span>Send Quotation via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activated Clear Orders Confirmation Modal */}
      {confirmClearOrdersModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setConfirmClearOrdersModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Clear All Logged Orders?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  This will remove all {orders.length} order entries stored in your browser session. You can reload demo orders at any time.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearOrdersModal(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearOrders();
                  setConfirmClearOrdersModal(false);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                Yes, Clear All Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
