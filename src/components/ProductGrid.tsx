import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowUpDown,
  Filter,
  Home,
  PackageOpen,
  Search,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { DEPARTMENTS } from '../data/departments';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { ProductQuickViewModal } from './ProductQuickViewModal';

export const ProductGrid: React.FC = () => {
  const {
    filteredProducts,
    selectedDepartment,
    setSelectedDepartment,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    storeConfig
  } = useStore();

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const currentDeptInfo = DEPARTMENTS.find(d => d.id === selectedDepartment);

  const handleGoHome = () => {
    setSelectedDepartment('all');
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    if (searchQuery) {
      setSearchQuery('');
    } else if (selectedDepartment !== 'all') {
      setSelectedDepartment('all');
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isHomePage = selectedDepartment === 'all' && (!searchQuery || searchQuery.trim() === '');

  return (
    <section id="store-product-catalog" className="max-w-7xl mx-auto px-4 py-8">
      {/* Front-end Breadcrumb Navigation Bar: Back & Home */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {/* Back Button (Only displayed when on another page / department / search) */}
          {!isHomePage && (
            <button
              type="button"
              onClick={handleGoBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs transition cursor-pointer active:scale-95 animate-in fade-in"
              title="Go back to Home / Previous View"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Back</span>
            </button>
          )}

          {/* Home Button */}
          <button
            type="button"
            onClick={handleGoHome}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 shadow-2xs transition cursor-pointer active:scale-95"
            title="Return to Store Home"
          >
            <Home className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Home</span>
          </button>

          {/* Breadcrumb Path Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 pl-1.5">
            <span>/</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {currentDeptInfo ? currentDeptInfo.name : 'All Store Departments'}
            </span>
            {searchQuery && (
              <>
                <span>/</span>
                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                  Search &ldquo;{searchQuery}&rdquo;
                </span>
              </>
            )}
          </div>
        </div>

        {(selectedDepartment !== 'all' || searchQuery) && (
          <button
            type="button"
            onClick={handleGoHome}
            className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Reset to All Departments &rarr;</span>
          </button>
        )}
      </div>

      {/* Department Header Card / Active Filter Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-4 sm:p-5 mb-5 sm:mb-8 shadow-sm border border-emerald-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-white/5 pointer-events-none transform -skew-x-12" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>&ldquo;{storeConfig.tagline}&rdquo;</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white">
              {currentDeptInfo ? currentDeptInfo.name : 'All Store Departments'}
            </h2>
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-0.5 max-w-xl line-clamp-2">
              {currentDeptInfo
                ? currentDeptInfo.description
                : 'Browse our catalog of 100% original cosmetics, groceries, beverages, intimate wear, baby & toys, crockery and certified medicines.'}
            </p>
          </div>

          {/* Quick Stats / Filter Indicator */}
          <div className="flex items-center gap-3">
            <div className="bg-emerald-950/60 backdrop-blur-xs px-3.5 py-1.5 sm:py-2 rounded-xl border border-emerald-600/40 text-center">
              <div className="text-base sm:text-xl font-black text-white">{filteredProducts.length}</div>
              <div className="text-[10px] sm:text-[11px] text-emerald-200">Products</div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Sorting & Search Active Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-white">
            Showing {filteredProducts.length} items
          </span>
          {searchQuery && (
            <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
              Keyword: &quot;{searchQuery}&quot;
            </span>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Sort By:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 font-medium text-slate-700 dark:text-slate-200 hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
          >
            <option value="featured">Featured &amp; Bestsellers</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Customer Rated</option>
            <option value="stock">Stock Availability</option>
          </select>
        </div>
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={prod => setQuickViewProduct(prod)}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm my-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
            <PackageOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No Products Found</h3>
          <p className="text-slate-500 text-sm">
            We couldn&apos;t find any products matching your search or filters. You can clear the search or request this item directly via WhatsApp.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDepartment('all');
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Reset All Filters
            </button>
            <a
              href={`https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(
                `Hello Jan Chemist! I am looking for an item ("${searchQuery}") that I couldn't find online. Do you have it in stock?`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
            >
              Ask on WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      <ProductQuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </section>
  );
};
