import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  FileQuestion,
  FileUp,
  HelpCircle,
  History,
  LifeBuoy,
  MapPin,
  MessageCircle,
  Moon,
  Navigation,
  Package,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Trash2,
  Truck,
  X
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OrderLog } from '../types';
import { getStoreWhatsAppNumber } from '../utils/whatsapp';

type QuickActionTab = 'help' | 'track' | 'faqs' | 'location';

export const FloatingWhatsApp: React.FC = () => {
  const {
    storeConfig,
    setIsPrescriptionModalOpen,
    cartCount,
    setIsCartOpen,
    orders,
    clearOrders,
    loadSampleOrders,
    addToCart,
    showToast,
    theme,
    toggleTheme
  } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<QuickActionTab>('help');

  // Track Order manual input
  const [trackOrderId, setTrackOrderId] = useState('');

  // Order History state
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // FAQs list with prefilled WhatsApp question templates
  const faqTemplates = [
    {
      q: 'Are all cosmetics & medicines 100% original?',
      a: 'Yes, absolutely. Our motto is "With us its original". Sourced directly from verified pharma distributors and official brand importers.',
      waText: `Hello Jan Chemist! I'd like to verify authenticity and product batches for items in your store ("${storeConfig.tagline}").`
    },
    {
      q: 'What are your delivery hours and speed?',
      a: 'We operate 8:00 AM to 1:00 AM, 7 days a week. Average delivery is within 30-45 minutes in local areas.',
      waText: `Hello Jan Chemist! Can you deliver an order to my area right now? (Operating hours: 8:00 AM - 1:00 AM)`
    },
    {
      q: 'How does prescription order delivery work?',
      a: 'Simply upload or send a photo of your prescription on WhatsApp. Our certified pharmacist will verify the dosage and bill.',
      waText: `Hello Jan Chemist Pharmacist! I want to order prescription medicines via WhatsApp. How quickly can they be prepared?`
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept Cash on Delivery (COD), JazzCash, EasyPaisa, and Direct Bank Transfer.',
      waText: `Hello Jan Chemist! What are your JazzCash/EasyPaisa account details for paying my order?`
    }
  ];

  const handleTrackOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = trackOrderId.trim() || 'my recent order';
    const text = `Hello Jan Chemist! 🚚 I would like to track my order.\n• Order / Phone: *${query}*\n• Tagline: "${storeConfig.tagline}"\n\nPlease let me know the current status and rider estimated delivery time. Thanks!`;
    const storePhone = getStoreWhatsAppNumber(storeConfig);
    const url = `https://wa.me/${storePhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleSendCustomTemplate = (templateMessage: string) => {
    const storePhone = getStoreWhatsAppNumber(storeConfig);
    const url = `https://wa.me/${storePhone}?text=${encodeURIComponent(templateMessage)}`;
    window.open(url, '_blank');
  };

  const handleSendOrderTrackingRequest = (order: OrderLog) => {
    const d = new Date(order.createdAt);
    const dateFormatted = !isNaN(d.getTime())
      ? d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Recent';
    const timeFormatted = !isNaN(d.getTime())
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);

    let text = `🟢 *JAN CHEMIST - ORDER TRACKING REQUEST*\n`;
    text += `_"${storeConfig.tagline}"_\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `Hello Jan Chemist! 🚚 I would like to check the current delivery status of my order:\n\n`;
    text += `📋 *Order ID:* *${order.id}*\n`;
    text += `🕒 *Placed:* ${dateFormatted}${timeFormatted ? ` at ${timeFormatted}` : ''}\n`;
    text += `👤 *Customer:* *${order.customerName}* (${order.phone})\n`;
    text += `📍 *Delivery Address:* ${order.address}\n`;
    if (order.paymentMethod) {
      text += `💳 *Payment Method:* ${order.paymentMethod}\n`;
    }
    if (order.notes && order.notes.trim()) {
      text += `📝 *Notes:* "${order.notes.trim()}"\n`;
    }
    text += `\n📦 *Order Items (${totalQty} items):*\n`;
    order.items.forEach((item, idx) => {
      const barcodeValue = item.product.barcode || item.product.sku || 'N/A';
      const packingStr = item.product.unit || 'Standard';
      const hasCutPrice = item.product.originalPrice && item.product.originalPrice > item.product.price;
      const cutPriceText = hasCutPrice ? ` [Cut Market Price: ~Rs. ${item.product.originalPrice!.toLocaleString()}~]` : '';

      text += `${idx + 1}. *${item.product.name}*\n`;
      text += `   • Barcode: ${barcodeValue}\n`;
      text += `   • Packing: ${packingStr}\n`;
      text += `   • Price: Rs. ${item.product.price.toLocaleString()}${cutPriceText}\n`;
      text += `   • Qty: ${item.quantity} = Rs. ${(item.product.price * item.quantity).toLocaleString()}\n`;
    });
    text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 Subtotal: Rs. ${order.subtotal.toLocaleString()}\n`;
    text += `🚚 Delivery Fee: ${order.deliveryFee === 0 ? 'FREE' : 'Rs. ' + order.deliveryFee}\n`;
    text += `💵 *Total Bill: Rs. ${order.total.toLocaleString()}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `Please update me on current preparation or rider dispatch ETA. Thank you!`;

    const storePhone = getStoreWhatsAppNumber(storeConfig);
    const url = `https://wa.me/${storePhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    showToast(`WhatsApp tracking opened for ${order.id}!`, 'success');
  };

  const handleCopyOrderId = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      navigator.clipboard.writeText(id);
      setCopiedOrderId(id);
      setTimeout(() => setCopiedOrderId(null), 2000);
      showToast(`Copied Order ID "${id}" to clipboard!`, 'info');
    } catch {
      showToast(`Order ID: ${id}`, 'info');
    }
  };

  const handleReorderItems = (order: OrderLog, e?: React.MouseEvent) => {
    e?.stopPropagation();
    order.items.forEach(item => {
      addToCart(item.product, item.quantity);
    });
    showToast(`Re-added ${order.items.length} product(s) to your cart!`, 'success');
  };

  const formatOrderTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'Recently placed';
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);

      if (diffMins < 2) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24 && d.getDate() === now.getDate()) {
        return `Today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      return `${d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })} • ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Recently placed';
    }
  };

  const getStatusBadge = (status: OrderLog['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Approved by Pharmacist</span>
          </span>
        );
      case 'packed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            <span>Packed &amp; Dispatched</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950/70 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700 shrink-0">
            <CheckCircle2 className="w-2.5 h-2.5 text-green-600" />
            <span>Delivered</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0">
            <span>Cancelled</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>Confirmed</span>
          </span>
        );
      case 'placed_on_whatsapp':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Placed on WhatsApp</span>
          </span>
        );
    }
  };

  const filteredOrders = orders.filter(o => {
    if (!orderSearchQuery.trim()) return true;
    const q = orderSearchQuery.toLowerCase().trim();
    return (
      o.id.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.phone.includes(q) ||
      o.items.some(i => i.product.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 flex flex-col items-end gap-2">
      {/* Mobile backdrop when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Quick Action Popover when expanded */}
      {isOpen && (
        <div className="fixed bottom-18 sm:bottom-20 right-3 sm:right-5 left-3 sm:left-auto max-w-sm sm:max-w-none sm:w-[23.5rem] max-h-[72vh] sm:max-h-[80vh] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-3 sm:p-4 flex flex-col animate-in fade-in slide-in-from-bottom-3 duration-200 space-y-2.5 z-50">
          {/* Header with Brand, Theme Toggle & Close */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <div>
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block leading-none">
                  Jan Chemist WhatsApp
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                  Hotline: {storeConfig.displayPhone}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Theme Toggle (Light/Dark mode) */}
              <button
                type="button"
                onClick={toggleTheme}
                className="px-2 py-1 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border border-slate-200/70 dark:border-slate-700/80 flex items-center gap-1.5 text-[11px] font-semibold shadow-2xs"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle Light/Dark Theme"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-bold text-amber-300">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-[10px] font-bold text-slate-700">Dark</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick-Action Toggle Buttons Row: Help Center, Track Order, FAQs, Location */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('help')}
              className={`py-1 px-1 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer text-[10px] sm:text-xs ${
                activeTab === 'help'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LifeBuoy className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Help</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('track')}
              className={`py-1 px-1 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer text-[10px] sm:text-xs ${
                activeTab === 'track'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Truck className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Track</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('faqs')}
              className={`py-1 px-1 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer text-[10px] sm:text-xs ${
                activeTab === 'faqs'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HelpCircle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>FAQs</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('location')}
              className={`py-1 px-1 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer text-[10px] sm:text-xs ${
                activeTab === 'location'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapPin className="w-3 h-3 text-red-600 dark:text-red-400 shrink-0" />
              <span>Location</span>
            </button>
          </div>

          {/* Scrollable Tab Content Container */}
          <div className="overflow-y-auto max-h-[50vh] sm:max-h-[56vh] pr-0.5 space-y-2.5 no-scrollbar flex-1">

          {/* TAB 1: HELP CENTER TEMPLATES */}
          {activeTab === 'help' && (
            <div className="space-y-2.5 animate-in fade-in duration-150">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Select a quick WhatsApp inquiry template:
              </div>

              {/* Template: Talk to Certified Pharmacist */}
              <button
                type="button"
                onClick={() =>
                  handleSendCustomTemplate(
                    `Hello Jan Chemist! 🩺 I would like to consult with your on-duty pharmacist regarding dosage, availability, and authentic medicine verification ("${storeConfig.tagline}").`
                  )
                }
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-600 transition group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-emerald-900 dark:group-hover:text-emerald-300">
                    👨‍⚕️ Talk to Pharmacist
                  </span>
                  <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  Medicine dosage, alternatives &amp; availability
                </div>
              </button>

              {/* Template: Upload Prescription */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsPrescriptionModalOpen(true);
                }}
                className="w-full text-left p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100/80 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-800/60 transition group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-red-800 dark:text-red-300 flex items-center gap-1.5">
                    <FileUp className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    <span>Upload Prescription Portal</span>
                  </span>
                  <span className="text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.2 rounded-full">
                    Rx
                  </span>
                </div>
                <div className="text-[10px] text-red-600/80 dark:text-red-400/80 mt-0.5">
                  Snap photo &amp; send directly with priority
                </div>
              </button>

              {/* Template: General Superstore Order */}
              <button
                type="button"
                onClick={() =>
                  handleSendCustomTemplate(
                    `Hello Jan Chemist! 🛒 I'd like to place an order from your superstore departments (Cosmetics, Grocery, Drinks, Lingerie, Toiletries, Toys, Birthday Items, Crockery, or Electronics).`
                  )
                }
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-600 transition group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-emerald-900 dark:group-hover:text-emerald-300">
                    🛍️ Superstore Order Inquiry
                  </span>
                  <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Cosmetics, Grocery, Drinks &amp; Electronics
                </div>
              </button>

              {/* Cart checkout quick button if items exist */}
              {cartCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsCartOpen(true);
                  }}
                  className="w-full p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-between shadow-sm transition cursor-pointer"
                >
                  <span>Checkout Current Cart ({cartCount} items)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* TAB 2: TRACK ORDER TEMPLATES & LOCAL STORAGE ORDER HISTORY */}
          {activeTab === 'track' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Direct Search / Tracking Input Card */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Live WhatsApp Order Status</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    8 AM - 1 AM Daily
                  </span>
                </div>

                <form onSubmit={handleTrackOrderSubmit} className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. ORD-849201 or 0320XXXXXXX"
                      value={trackOrderId}
                      onChange={e => setTrackOrderId(e.target.value)}
                      className="w-full pl-8 pr-8 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-750 font-medium"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {trackOrderId && (
                      <button
                        type="button"
                        onClick={() => setTrackOrderId('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        title="Clear input"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Inquire Status on WhatsApp</span>
                  </button>
                </form>
              </div>

              {/* Order History Section */}
              <div className="space-y-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                {/* Section Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 leading-none">
                        <span>Order History</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {orders.length}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Saved in local storage on this device
                      </p>
                    </div>
                  </div>

                  {/* Actions: Clear History or Load Demo */}
                  <div className="flex items-center gap-1.5">
                    {orders.length > 0 ? (
                      showClearConfirm ? (
                        <div className="flex items-center gap-1 text-[10px] bg-rose-50 dark:bg-rose-950/60 p-1 rounded-lg border border-rose-200 dark:border-rose-900">
                          <span className="text-rose-600 dark:text-rose-400 font-bold">Clear all?</span>
                          <button
                            type="button"
                            onClick={() => {
                              clearOrders();
                              setShowClearConfirm(false);
                            }}
                            className="px-1.5 py-0.5 bg-rose-600 text-white rounded font-bold hover:bg-rose-700 transition cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowClearConfirm(false)}
                            className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-semibold cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowClearConfirm(true)}
                          className="text-[10px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer flex items-center gap-1 font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Clear saved order history"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Clear</span>
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={loadSampleOrders}
                        className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline cursor-pointer bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800"
                        title="Load realistic sample orders to test tracking"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Load Demo Orders</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Search Input (if 2 or more orders) */}
                {orders.length >= 2 && (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search history by ID, product, or name..."
                      value={orderSearchQuery}
                      onChange={e => setOrderSearchQuery(e.target.value)}
                      className="w-full pl-7 pr-7 py-1.5 text-[11px] bg-slate-100 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                    />
                    <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {orderSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setOrderSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Orders Content */}
                {orders.length === 0 ? (
                  /* Empty state */
                  <div className="text-center py-6 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        No Recent Orders Stored
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                        Orders placed through Jan Chemist WhatsApp checkout are automatically remembered on this device so you can re-send tracking requests anytime.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={loadSampleOrders}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Load Demo Orders</span>
                    </button>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  /* Filter with no matches */
                  <div className="text-center py-5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                    <p>No orders matching &ldquo;{orderSearchQuery}&rdquo;</p>
                    <button
                      type="button"
                      onClick={() => setOrderSearchQuery('')}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline mt-1 cursor-pointer"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  /* List of Recent Orders */
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-0.5">
                    {filteredOrders.map(order => {
                      const isExpanded = expandedOrderId === order.id;
                      const isCopied = copiedOrderId === order.id;
                      const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);

                      return (
                        <div
                          key={order.id}
                          className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 p-3 space-y-2 hover:border-emerald-400/80 dark:hover:border-emerald-600 transition shadow-2xs"
                        >
                          {/* Card Header: Order ID + Date & Status */}
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span
                                onClick={() => setTrackOrderId(order.id)}
                                className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer"
                                title="Click to fill in manual search above"
                              >
                                {order.id}
                              </span>

                              {/* Copy ID Button */}
                              <button
                                type="button"
                                onClick={e => handleCopyOrderId(order.id, e)}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                                title="Copy Order ID"
                              >
                                {isCopied ? (
                                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>

                            {/* Prominent Order Date next to Status Badge */}
                            <div className="flex items-center gap-1.5">
                              <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700/80 px-2 py-0.5 rounded-lg border border-slate-200/90 dark:border-slate-600 shadow-2xs">
                                <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>{formatOrderTime(order.createdAt)}</span>
                              </span>
                              {getStatusBadge(order.status)}
                            </div>
                          </div>

                          {/* Customer Name, Items Count & Amount Summary */}
                          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 pt-0.5">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[160px]">
                              {order.customerName ? `${order.customerName}` : 'Order details'}
                            </span>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-slate-500 text-[10px]">
                                {totalQty} item{totalQty !== 1 ? 's' : ''} •
                              </span>
                              <span className="font-black text-xs text-emerald-800 dark:text-emerald-300">
                                Rs. {order.total.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Delivery Address Preview */}
                          <div className="flex items-start gap-1 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                            <span className="truncate" title={order.address}>
                              {order.address}
                            </span>
                          </div>

                          {/* Payment Method & Customer Name Badge */}
                          <div className="flex flex-wrap items-center gap-1 pt-0.5 text-[10px]">
                            <span className="bg-slate-200/80 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-semibold">
                              👤 {order.customerName}
                            </span>
                            {order.prescriptionImage && (
                              <span className="bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 px-1.5 py-0.5 rounded font-bold">
                                🩺 Rx Prescription Attached
                              </span>
                            )}
                            {order.paymentMethod && (
                              <span className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-semibold">
                                💳 {order.paymentMethod}
                              </span>
                            )}
                          </div>

                          {/* Expandable Items Breakdown Toggle */}
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                              className="text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1 transition cursor-pointer"
                            >
                              <span>{isExpanded ? 'Hide Items & Breakdown' : `View Items (${order.items.length})`}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>

                            {/* Expanded Items Details Panel */}
                            {isExpanded && (
                              <div className="mt-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 space-y-2 animate-in fade-in duration-150">
                                <div className="space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 text-[11px]">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                                          {item.product.image ? (
                                            <img
                                              src={item.product.image}
                                              alt=""
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <Package className="w-3.5 h-3.5 text-slate-400" />
                                          )}
                                        </div>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                          {item.product.name}
                                        </span>
                                      </div>
                                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 shrink-0">
                                        {item.quantity}x • Rs. {(item.product.price * item.quantity).toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {/* Subtotal & Delivery Details */}
                                <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-700 text-[10px] space-y-0.5 text-slate-500 dark:text-slate-400">
                                  <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                      Rs. {order.subtotal.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Delivery Fee:</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                      {order.deliveryFee === 0 ? 'FREE' : `Rs. ${order.deliveryFee}`}
                                    </span>
                                  </div>
                                  <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                                    <span>Total Payable:</span>
                                    <span className="text-emerald-700 dark:text-emerald-400">
                                      Rs. {order.total.toLocaleString()}
                                    </span>
                                  </div>
                                </div>

                                {order.notes && (
                                  <div className="text-[10px] text-slate-600 dark:text-slate-300 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded-lg border border-amber-200 dark:border-amber-800/60 italic">
                                    Note: &ldquo;{order.notes}&rdquo;
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons: Primary Re-send Tracking Request + Secondary Re-order */}
                          <div className="pt-1 flex items-center gap-1.5">
                            {/* Primary: Re-send Tracking Request */}
                            <button
                              type="button"
                              onClick={() => handleSendOrderTrackingRequest(order)}
                              className="flex-1 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-2xs hover:shadow transition cursor-pointer"
                              title="Re-send live tracking request to Jan Chemist on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-white/20" />
                              <span>Re-send Tracking Request</span>
                              <Send className="w-3 h-3 shrink-0" />
                            </button>

                            {/* Secondary: Re-order items */}
                            <button
                              type="button"
                              onClick={e => handleReorderItems(order, e)}
                              className="py-1.5 px-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shrink-0"
                              title="Re-add all items to your cart"
                            >
                              <RotateCcw className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span className="hidden sm:inline">Re-order</span>
                            </button>

                            {/* Secondary: Quick Fill in Search */}
                            <button
                              type="button"
                              onClick={() => {
                                setTrackOrderId(order.id);
                                showToast(`Order ID filled in search above!`, 'info');
                              }}
                              className="py-1.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer shrink-0"
                              title="Fill Order ID in manual search box"
                            >
                              <Search className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FAQS WITH CUSTOM WHATSAPP TEMPLATES */}
          {activeTab === 'faqs' && (
            <div className="space-y-2 animate-in fade-in duration-150 max-h-64 overflow-y-auto pr-0.5">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Tap any question to ask Jan Chemist directly:
              </div>

              {faqTemplates.map((faq, index) => (
                <div
                  key={index}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50/60 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/80 transition space-y-1.5"
                >
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-start gap-1.5">
                    <span className="text-amber-600 dark:text-amber-400 font-black">Q:</span>
                    <span>{faq.q}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug pl-4">
                    {faq.a}
                  </div>
                  <div className="pl-4 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSendCustomTemplate(faq.waText)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 bg-white dark:bg-slate-700 px-2 py-0.8 rounded-md border border-emerald-200 dark:border-slate-600 shadow-2xs hover:bg-emerald-50 dark:hover:bg-slate-600 transition cursor-pointer"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Ask this on WhatsApp</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: LOCATION SECTION */}
          {activeTab === 'location' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* Map Placeholder Card */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-xs">
                {/* Visual Map Canvas / Graphic */}
                <div className="h-32 w-full relative bg-emerald-950 overflow-hidden flex items-center justify-center">
                  {/* Map grid streets simulation */}
                  <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="map-roads" width="36" height="36" patternUnits="userSpaceOnUse">
                        <path d="M 0 18 L 36 18 M 18 0 L 18 36" stroke="#10b981" strokeWidth="2" fill="none" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#map-roads)" />
                    <line x1="0" y1="15" x2="350" y2="115" stroke="#f59e0b" strokeWidth="4" strokeDasharray="6,4" />
                  </svg>

                  {/* Pulsing Pin Marker on Jan Chemist */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="relative">
                      <span className="absolute -inset-2 rounded-full bg-red-500/40 animate-ping" />
                      <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
                        <MapPin className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-1 bg-white/95 backdrop-blur-xs text-slate-900 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow border border-slate-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Jan Chemist</span>
                    </div>
                  </div>

                  {/* Coordinates Badge */}
                  <div className="absolute bottom-1.5 left-2 text-[9px] font-mono text-emerald-300/80 bg-slate-900/60 px-1.5 py-0.5 rounded">
                    GPS: 33.6844° N, 73.0479° E
                  </div>
                </div>

                {/* Address Details */}
                <div className="p-3 bg-white dark:bg-slate-800 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        Jan Chemist Superstore &amp; Pharmacy
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug mt-0.5">
                        Commercial Center, Main Boulevard, Delivery Hub
                      </p>
                    </div>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded shrink-0">
                      Open 8am-1am
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2 pt-0.5">
                    <span>• 7 Days a Week</span>
                    <span>• Hotline: {storeConfig.displayPhone}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-1.5">
                {/* Open in Google Maps in new tab */}
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Jan+Chemist"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:shadow transition"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Open Navigation in Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                {/* Request Live Pin on WhatsApp */}
                <button
                  type="button"
                  onClick={() =>
                    handleSendCustomTemplate(
                      `Hello Jan Chemist! 📍 Please share your live location pin on WhatsApp so I can navigate to your store or calculate delivery distance ("${storeConfig.tagline}").`
                    )
                  }
                  className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Ask for Live Pin on WhatsApp</span>
                </button>
              </div>
            </div>
          )}
          </div>

          {/* Footer note: Timings */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium shrink-0">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>8:00 AM - 1:00 AM Daily</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>With us its original</span>
            </span>
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <div className="relative">
        {/* Subtle glowing aura ring when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping pointer-events-none" />
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative group flex items-center gap-2 p-3.5 sm:px-4 sm:py-3.5 rounded-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-xl shadow-emerald-700/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer ${
            !isOpen ? 'animate-subtle-scale-pulse' : ''
          }`}
          aria-label="Order on WhatsApp"
        >
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
          <MessageCircle className="w-6 h-6 fill-white/20" />
          <span className="hidden sm:inline font-bold text-xs sm:text-sm tracking-wide">
            Order on WhatsApp: {storeConfig.displayPhone}
          </span>
        </button>
      </div>
    </div>
  );
};
