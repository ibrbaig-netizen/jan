import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Home,
  MessageCircle,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  X
} from 'lucide-react';
import { DEPARTMENTS } from '../data/departments';
import { useStore } from '../context/StoreContext';
import { DepartmentId, Product } from '../types';
import { cleanAndResolveImageUrl, DEFAULT_DEPT_IMAGES, getProxiedImageUrl } from '../utils/imageUrlResolver';
import { generateSingleProductWhatsAppUrl } from '../utils/whatsapp';

interface StoreSearchOverlayProps {
  onSelectProduct?: (product: Product) => void;
}

export const StoreSearchOverlay: React.FC<StoreSearchOverlayProps> = ({ onSelectProduct }) => {
  const {
    isSearchOverlayOpen,
    setIsSearchOverlayOpen,
    products,
    addToCart,
    storeConfig,
    setSelectedDepartment,
    setSearchQuery,
    setIsCartOpen
  } = useStore();

  const [query, setQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<DepartmentId>('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [orderFeedback, setOrderFeedback] = useState<{
    product: Product;
    action: 'whatsapp' | 'cart';
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isSearchOverlayOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } else {
      setQuery('');
      setSelectedDept('all');
      setInStockOnly(false);
      setOrderFeedback(null);
    }
  }, [isSearchOverlayOpen]);

  if (!isSearchOverlayOpen) return null;

  const handleHomeNavigation = () => {
    setIsSearchOverlayOpen(false);
    setSelectedDepartment('all');
    setSearchQuery('');
    setOrderFeedback(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackNavigation = () => {
    if (orderFeedback) {
      setOrderFeedback(null);
      return;
    }
    if (query) {
      setQuery('');
      return;
    }
    setIsSearchOverlayOpen(false);
  };

  const handleWhatsAppOrder = (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const url = generateSingleProductWhatsAppUrl(product, 1, storeConfig);
    window.open(url, '_blank');
    setOrderFeedback({
      product,
      action: 'whatsapp'
    });
  };

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    addToCart(product, 1);
    setOrderFeedback({
      product,
      action: 'cart'
    });
  };

  // Filter matching products
  const cleanQ = query.trim().toLowerCase();
  const results = products.filter(p => {
    if (selectedDept !== 'all' && p.department !== selectedDept) return false;
    if (inStockOnly && !p.inStock) return false;
    if (!cleanQ) return true;

    return (
      p.name.toLowerCase().includes(cleanQ) ||
      p.department.toLowerCase().includes(cleanQ) ||
      p.category.toLowerCase().includes(cleanQ) ||
      p.sku.toLowerCase().includes(cleanQ) ||
      (p.barcode && p.barcode.toLowerCase().includes(cleanQ)) ||
      (p.formulation && p.formulation.toLowerCase().includes(cleanQ)) ||
      (p.description && p.description.toLowerCase().includes(cleanQ))
    );
  });

  const popularSearches = [
    'Panadol Extra',
    'CeraVe Cleanser',
    'Basmati Rice',
    'Red Bull',
    'Sensodyne',
    'Augmentin',
    'Lipton Tea',
    'Gillette'
  ];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-start justify-center p-1.5 sm:p-6 animate-in fade-in duration-200"
      onClick={() => setIsSearchOverlayOpen(false)}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-2 sm:my-8 transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="p-3 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850">
          {/* Quick Back & Home Navigation Row */}
          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleBackNavigation}
                className="px-2.5 py-1 rounded-lg sm:rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-2xs active:scale-95"
                title="Back to Previous View"
              >
                <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleHomeNavigation}
                className="px-2.5 py-1 rounded-lg sm:rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-2xs active:scale-95"
                title="Home (All Store Departments)"
              >
                <Home className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Home Storefront</span>
              </button>
            </div>

            <div className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>With Us It&apos;s Original</span>
            </div>
          </div>

          <div className="relative flex items-center">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400 absolute left-3 sm:left-4 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search across all 10 departments, medicines, cosmetics, grocery..."
              className="w-full pl-9 sm:pl-12 pr-16 sm:pr-24 py-2 sm:py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-emerald-600 rounded-xl sm:rounded-2xl text-xs sm:text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-emerald-500/15 shadow-xs"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-10 sm:right-12 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsSearchOverlayOpen(false)}
              className="absolute right-2 sm:right-3 p-1 sm:p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg sm:rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Close search (Esc)"
            >
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-600 mr-1.5">
                ESC
              </kbd>
              <X className="w-4 h-4 inline sm:hidden" />
            </button>
          </div>

          {/* Department Filter Pills */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pt-2 sm:pt-3 pb-0.5 no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setSelectedDept('all')}
              className={`px-2.5 py-1 rounded-lg sm:rounded-xl font-bold whitespace-nowrap transition cursor-pointer text-[11px] sm:text-xs ${
                selectedDept === 'all'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              All Departments ({products.length})
            </button>

            {DEPARTMENTS.map(dept => {
              const isSel = selectedDept === dept.id;
              const count = products.filter(p => p.department === dept.id).length;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setSelectedDept(dept.id)}
                  className={`px-2.5 py-1 rounded-lg sm:rounded-xl font-bold whitespace-nowrap transition cursor-pointer text-[11px] sm:text-xs ${
                    isSel
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {dept.shortName} ({count})
                </button>
              );
            })}

            <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700 mx-0.5 shrink-0"></div>

            {/* In stock toggle */}
            <button
              type="button"
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`px-2.5 py-1 rounded-lg sm:rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1 cursor-pointer text-[11px] sm:text-xs ${
                inStockOnly
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${inStockOnly ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
              <span>In Stock</span>
            </button>
          </div>
        </div>

        {/* ORDER FEEDBACK NOTIFICATION BAR WITH BACK & HOME BUTTONS */}
        {orderFeedback && (
          <div className="bg-emerald-800 text-white px-3 py-2 sm:px-4 sm:py-3 border-b border-emerald-700 shadow-inner animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  {orderFeedback.action === 'whatsapp' ? (
                    <MessageCircle className="w-4 h-4 text-emerald-200 fill-emerald-300/30" />
                  ) : (
                    <ShoppingBag className="w-4 h-4 text-emerald-200" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                    <span>{orderFeedback.action === 'whatsapp' ? 'WhatsApp Order Opened' : 'Product Added to Cart'}</span>
                  </div>
                  <div className="text-xs sm:text-sm font-extrabold truncate text-white">
                    {orderFeedback.product.name} • Rs. {orderFeedback.product.price.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Back to Results & Return Home */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleBackNavigation}
                  className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-[10px] sm:text-xs flex items-center gap-1 transition cursor-pointer border border-white/20"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span className="hidden sm:inline">Back to Results</span>
                  <span className="sm:hidden">Results</span>
                </button>

                <button
                  type="button"
                  onClick={handleHomeNavigation}
                  className="px-2.5 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-[10px] sm:text-xs flex items-center gap-1 transition cursor-pointer shadow-xs"
                >
                  <Home className="w-3 h-3" />
                  <span>Home</span>
                </button>

                {orderFeedback.action === 'cart' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOverlayOpen(false);
                      setIsCartOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white text-emerald-950 font-bold text-[10px] sm:text-xs flex items-center gap-1 transition cursor-pointer shadow-xs"
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>Cart</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Popular searches suggestions if no query */}
        {!query && (
          <div className="px-5 py-3 bg-emerald-50/50 dark:bg-slate-850/50 border-b border-emerald-100/60 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Popular Searches:</span>
            </span>
            {popularSearches.map(term => (
              <button
                key={term}
                type="button"
                onClick={() => setQuery(term)}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 font-medium transition cursor-pointer"
              >
                {term}
              </button>
            ))}
          </div>
        )}

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 mb-1">
            <span>
              Showing <strong className="text-slate-900 dark:text-white font-bold">{results.length}</strong> matching {results.length === 1 ? 'product' : 'products'}
            </span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              100% Genuine Guaranteed • Jan Chemist
            </span>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Package className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                No matching products found
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                We couldn&apos;t find anything matching &ldquo;{query}&rdquo;. Need a specific medicine or cosmetic? Contact us on WhatsApp for instant dispensary check.
              </p>
              <div className="pt-2">
                <a
                  href={`https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(
                    `Hello Jan Chemist! I searched for "${query}" on your store and would like to ask if it is available in your dispensary or superstore.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Ask Jan Chemist on WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            results.map(product => {
              const resolvedImage = cleanAndResolveImageUrl(product.image);

              return (
                <div
                  key={product.id}
                  className="group p-2.5 sm:p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl transition flex items-center justify-between gap-2 sm:gap-3 shadow-2xs hover:shadow-md"
                >
                  <div
                    className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      if (onSelectProduct) onSelectProduct(product);
                      setIsSearchOverlayOpen(false);
                    }}
                  >
                    {/* Display Pic */}
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-600">
                      <img
                        src={resolvedImage}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        onError={e => {
                          const imgEl = e.target as HTMLImageElement;
                          if (!imgEl.src.includes('/api/image-proxy') && !imgEl.src.startsWith('data:')) {
                            imgEl.src = getProxiedImageUrl(product.image);
                          } else {
                            imgEl.src = DEFAULT_DEPT_IMAGES[product.department] || DEFAULT_DEPT_IMAGES.cosmetics;
                          }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {product.department}
                        </span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1 py-0.2 rounded">
                          {product.unit}
                        </span>
                        {!product.inStock && (
                          <span className="text-[9px] font-semibold text-red-500">
                            Out of Stock
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm line-clamp-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">
                        {product.name}
                      </h4>

                      {/* Formulation or snippet */}
                      {product.formulation ? (
                        <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          <strong className="text-slate-700 dark:text-slate-300">Composition:</strong> {product.formulation}
                        </p>
                      ) : product.description ? (
                        <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {product.description}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0 pl-1">
                    <div className="text-right">
                      <div className="font-black text-xs sm:text-base text-slate-950 dark:text-white font-sans">
                        Rs. {product.price.toLocaleString()}
                      </div>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="text-[9px] sm:text-[10px] text-slate-400 line-through">
                          Rs. {product.originalPrice.toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Add to Cart */}
                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={!product.inStock}
                        className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition cursor-pointer active:scale-95 ${
                          product.inStock
                            ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                        }`}
                        title="Add to Cart"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Add</span>
                      </button>

                      {/* WhatsApp Order */}
                      <button
                        type="button"
                        onClick={(e) => handleWhatsAppOrder(product, e)}
                        className="p-1.5 sm:px-2.5 sm:py-1 bg-emerald-50 dark:bg-slate-700 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-slate-600 transition flex items-center gap-1 text-xs font-semibold cursor-pointer active:scale-95"
                        title="Order instantly on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500/20" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-5">
          <div className="flex items-center gap-3">
            <span>Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 font-mono text-[10px]">ESC</kbd> to exit</span>
            <span className="hidden sm:inline">Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 font-mono text-[10px]">⌘K</kbd> anywhere to search</span>
          </div>
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            Jan Chemist • Superstore &amp; Pharmacy
          </span>
        </div>
      </div>
    </div>
  );
};
