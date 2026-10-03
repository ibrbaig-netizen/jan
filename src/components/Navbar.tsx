import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  FileText,
  Home,
  MessageCircle,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  X
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { isStoreCurrentlyOpen } from '../utils/whatsapp';
import { JanChemistLogo } from './JanChemistLogo';
import { PWAInstallButton } from './PWAInstallButton';

export const Navbar: React.FC = () => {
  const {
    cartCount,
    cartTotal,
    setIsCartOpen,
    setIsPrescriptionModalOpen,
    isSearchOverlayOpen,
    setIsSearchOverlayOpen,
    searchQuery,
    setSearchQuery,
    selectedDepartment,
    setSelectedDepartment,
    storeConfig
  } = useStore();

  const [storeStatus, setStoreStatus] = useState(
    isStoreCurrentlyOpen(storeConfig.openingTime, storeConfig.closingTime)
  );

  // Update store status every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setStoreStatus(isStoreCurrentlyOpen(storeConfig.openingTime, storeConfig.closingTime));
    }, 60000);
    return () => clearInterval(timer);
  }, [storeConfig.openingTime, storeConfig.closingTime]);

  const isHomePage = selectedDepartment === 'all' && (!searchQuery || searchQuery.trim() === '');

  const handleHome = () => {
    setSelectedDepartment('all');
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (searchQuery) {
      setSearchQuery('');
      return;
    }
    if (selectedDepartment !== 'all') {
      setSelectedDepartment('all');
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm border-b border-emerald-100/80 dark:border-slate-800 transition-all text-slate-900 dark:text-white">
      {/* Top Banner Ticker */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left: Tagline & Guarantee */}
          <div className="flex items-center gap-2 font-medium">
            <span className="inline-flex items-center gap-1 bg-red-600/90 text-white px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
              Original
            </span>
            <span className="hidden sm:inline text-emerald-100">
              {storeConfig.announcementTicker || `“${storeConfig.tagline}” — 100% Genuine Pharmacy & Superstore`}
            </span>
          </div>

          {/* Middle: Store Timings */}
          <div className="flex items-center gap-2 font-semibold">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                storeStatus.isOpen
                  ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                  : 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  storeStatus.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              ></span>
              {storeStatus.statusText}
            </span>
            <span className="hidden md:inline text-emerald-200/80 text-[11px]">
              (8:00 AM - 1:00 AM, 7 Days)
            </span>
          </div>

          {/* Right: WhatsApp direct hotline */}
          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/${storeConfig.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-100 hover:text-white transition font-medium hover:underline text-xs"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-300 fill-emerald-400/30" />
              <span>WhatsApp: <strong className="text-white">{storeConfig.displayPhone}</strong></span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-1.5 sm:gap-3 lg:gap-5">
          {/* Brand Logo (Far Left) */}
          <button
            onClick={handleHome}
            className="flex items-center gap-2 group text-left cursor-pointer shrink-0"
            title="Jan Chemist Home"
          >
            <div className="p-0.5 group-hover:scale-[1.02] transition-transform">
              <span className="hidden sm:block">
                <JanChemistLogo size="md" variant="green-badge" showTagline={true} />
              </span>
              <span className="block sm:hidden">
                <JanChemistLogo size="sm" variant="green-badge" showTagline={false} />
              </span>
            </div>
          </button>

          {/* Small Icon-Only Navigation: Home & Back */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Small Home Icon Button */}
            <button
              type="button"
              onClick={handleHome}
              className={`w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 flex items-center justify-center rounded-xl transition cursor-pointer active:scale-95 shadow-2xs ${
                isHomePage
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800 hover:bg-emerald-100'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
              title="Home (All Store Departments)"
              aria-label="Home"
            >
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700 dark:text-emerald-400" />
            </button>

            {/* Small Back Icon Button */}
            {!isHomePage && (
              <button
                type="button"
                onClick={handleBack}
                className="w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-2xs active:scale-95 animate-in fade-in zoom-in-95 duration-150"
                title="Back to Previous Page / Home"
                aria-label="Back"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700 dark:text-emerald-400" />
              </button>
            )}
          </div>

          {/* Action CTAs (Search Bar + Prescription + WhatsApp + Cart + PWA) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-1 justify-end min-w-0">
            {/* Desktop Store-wide Product Search Bar */}
            <button
              type="button"
              onClick={() => setIsSearchOverlayOpen(true)}
              className="relative group hidden md:flex items-center justify-between flex-1 max-w-xl px-3.5 py-2 rounded-2xl bg-slate-100/90 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-2xs hover:shadow-xs transition-all cursor-pointer min-w-0 text-left"
              title="Search entire store catalog (Shortcut: ⌘K or /)"
              aria-label="Store-wide product search"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                <span className="truncate text-xs sm:text-sm font-normal text-slate-500 dark:text-slate-400">
                  Search across Cosmetics, Grocery, Drinks, Lingerie, Toys, Medicines...
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">
                  Quick Search
                </span>
                <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-slate-900 text-slate-400 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">
                  ⌘K
                </kbd>
              </div>
            </button>

            {/* Upload Prescription Button (CSS selector 1) */}
            <button
              onClick={() => setIsPrescriptionModalOpen(true)}
              className="relative group inline-flex items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg shadow-red-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shrink-0 h-8 sm:h-auto"
              title="Upload Doctor's Prescription"
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">Upload Prescription</span>
              <span className="sm:hidden font-bold text-[11px] leading-none">Rx Order</span>
              <span className="hidden sm:inline-flex absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-full uppercase tracking-wider shadow">
                Rx
              </span>
            </button>

            {/* Direct WhatsApp Call/Chat (Desktop) */}
            <a
              href={`https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(
                `Hello Jan Chemist! I'm browsing your store ("${storeConfig.tagline}") and would like assistance with an order.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-slate-800 hover:bg-emerald-100/80 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-300 font-semibold text-sm border border-emerald-200/80 dark:border-slate-700 transition-all cursor-pointer shrink-0"
              title="Chat directly on WhatsApp (03205868464)"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-500/20" />
              <span>WhatsApp Order</span>
            </a>

            {/* Cart Drawer Trigger (CSS selector 2) */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg shadow-emerald-700/25 transition-all cursor-pointer shrink-0 h-8 sm:h-auto"
              title="View Shopping Cart"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline font-bold">Cart</span>
              {cartCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] sm:text-[11px] font-bold px-1.5 py-0.2 rounded-full min-w-4.5 text-center leading-tight">
                  {cartCount}
                </span>
              )}
              {cartTotal > 0 && (
                <span className="hidden xl:inline text-emerald-200 text-xs font-normal border-l border-emerald-600 pl-2">
                  Rs. {cartTotal.toLocaleString()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Main Search Bar Button (Replacing raw input component with SVG search trigger) */}
        <div className="mt-2 md:hidden">
          <button
            type="button"
            onClick={() => setIsSearchOverlayOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 text-xs shadow-2xs transition cursor-pointer text-left group"
            title="Search entire store catalog"
            aria-label="Open search dialog"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="truncate text-xs font-normal text-slate-500 dark:text-slate-400">
                {searchQuery ? `Filtering: "${searchQuery}"` : 'Search Cosmetics, Grocery, Drinks, Toys, Medicines...'}
              </span>
            </div>
            {searchQuery ? (
              <span
                onClick={e => {
                  e.stopPropagation();
                  setSearchQuery('');
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0 cursor-pointer"
                title="Clear filter"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0">
                Search
              </span>
            )}
          </button>
        </div>

        {/* Flashy App Download Button Prominently Located Under Search Bar */}
        <PWAInstallButton />
      </div>
    </header>
  );
};
