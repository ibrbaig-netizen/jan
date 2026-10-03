import React, { useState } from 'react';
import {
  ArrowRight,
  Bath,
  Check,
  ChevronRight,
  Coffee,
  Filter,
  Gamepad2,
  Gift,
  HeartHandshake,
  LayoutGrid,
  ListFilter,
  Pill,
  ShoppingBag,
  Sparkles,
  Store,
  UtensilsCrossed,
  Zap
} from 'lucide-react';
import { DEPARTMENTS } from '../data/departments';
import { useStore } from '../context/StoreContext';
import { DepartmentId } from '../types';
import { DEFAULT_DEPT_IMAGES } from '../utils/imageUrlResolver';

export const DepartmentBar: React.FC = () => {
  const { selectedDepartment, setSelectedDepartment, products, departments } = useStore();
  const [viewMode, setViewMode] = useState<'tiles' | 'compact'>('tiles');

  const activeDepartments = departments.filter(d => d.isActive !== false);

  const getIcon = (iconName: string, className = "w-4 h-4") => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'ShoppingBag':
        return <ShoppingBag className={className} />;
      case 'Coffee':
        return <Coffee className={className} />;
      case 'HeartHandshake':
        return <HeartHandshake className={className} />;
      case 'Bath':
        return <Bath className={className} />;
      case 'Gamepad2':
        return <Gamepad2 className={className} />;
      case 'Gift':
        return <Gift className={className} />;
      case 'UtensilsCrossed':
        return <UtensilsCrossed className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Pill':
        return <Pill className={className} />;
      default:
        return <LayoutGrid className={className} />;
    }
  };

  const getProductCount = (deptId: DepartmentId) => {
    if (deptId === 'all') return products.length;
    return products.filter(p => p.department === deptId).length;
  };

  const handleSelectDepartment = (deptId: DepartmentId) => {
    setSelectedDepartment(deptId);
    // Smoothly scroll to product catalog
    const productSection = document.getElementById('store-product-catalog');
    if (productSection) {
      productSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const allDeptsImage = 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=700&q=80';

  return (
    <section className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header with Title & View Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Shop by Department
              </h2>
              {selectedDepartment !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedDepartment('all')}
                  className="ml-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Reset to All</span>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 rounded-full">✕</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Explore 10 authentic departments with 100% genuine guaranteed items
            </p>
          </div>

          {/* View Mode Toggle: Tiles vs Compact */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('tiles')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'tiles'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="View departments as photo tiles"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tiles View</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('compact')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'compact'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="View departments as compact scrollable bar"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Compact Bar</span>
            </button>
          </div>
        </div>

        {/* 1. TILES VIEW WITH DISPLAY PICS */}
        {viewMode === 'tiles' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
            {/* Master Tile: All Departments */}
            <div
              onClick={() => handleSelectDepartment('all')}
              className={`group relative rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 text-left border shadow-2xs hover:shadow-lg ${
                selectedDepartment === 'all'
                  ? 'ring-2.5 ring-emerald-600 border-emerald-600 shadow-md scale-[1.02]'
                  : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
              }`}
            >
              {/* Tile Display Pic Container */}
              <div className="relative aspect-4/3 sm:aspect-square w-full overflow-hidden bg-slate-900">
                <img
                  src={allDeptsImage}
                  alt="All Departments"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-90"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                {selectedDepartment === 'all' && (
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                {/* Bottom Tile Info - Clean & Reduced Details */}
                <div className="absolute bottom-2 left-2.5 right-2.5">
                  <div className="flex items-center gap-1.5 text-white font-extrabold text-xs sm:text-sm">
                    <Store className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">All Departments</span>
                  </div>
                  <div className="text-[10px] text-emerald-300/90 font-medium">
                    {products.length} products
                  </div>
                </div>
              </div>
            </div>

            {/* Department Tiles - Crisp, icon-focused, reduced details */}
            {activeDepartments.map(dept => {
              const isSelected = selectedDepartment === dept.id;
              const count = getProductCount(dept.id);
              const displayPic = dept.image || DEFAULT_DEPT_IMAGES[dept.id] || DEFAULT_DEPT_IMAGES.cosmetics;

              return (
                <div
                  key={dept.id}
                  onClick={() => handleSelectDepartment(dept.id)}
                  className={`group relative rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 text-left border shadow-2xs hover:shadow-lg ${
                    isSelected
                      ? 'ring-2.5 ring-emerald-600 border-emerald-600 shadow-md scale-[1.02]'
                      : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
                  }`}
                >
                  {/* Tile Display Pic Container */}
                  <div className="relative aspect-4/3 sm:aspect-square w-full overflow-hidden bg-slate-900">
                    <img
                      src={displayPic}
                      alt={dept.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-90"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded-full shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}

                    {/* Bottom Info - Crisp Icon & Department Name Only */}
                    <div className="absolute bottom-2 left-2.5 right-2.5">
                      <div className="flex items-center gap-1.5 text-white font-extrabold text-xs sm:text-sm group-hover:text-emerald-300 transition-colors">
                        <span className="text-emerald-400 shrink-0">
                          {getIcon(dept.iconName, "w-3.5 h-3.5")}
                        </span>
                        <span className="truncate">{dept.shortName}</span>
                      </div>
                      <div className="text-[10px] text-slate-300 font-medium">
                        {count} items
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. COMPACT BAR VIEW (Alternative / Mobile Quick Swipe) */}
        {viewMode === 'compact' && (
          <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar scroll-smooth">
            {/* "All Departments" Button */}
            <button
              onClick={() => handleSelectDepartment('all')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedDepartment === 'all'
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/25 ring-2 ring-emerald-600'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>All Departments</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  selectedDepartment === 'all'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {products.length}
              </span>
            </button>

            {/* Individual Departments with Mini Thumbnail */}
            {activeDepartments.map(dept => {
              const isSelected = selectedDepartment === dept.id;
              const count = getProductCount(dept.id);
              const displayPic = dept.image || DEFAULT_DEPT_IMAGES[dept.id] || DEFAULT_DEPT_IMAGES.cosmetics;

              return (
                <button
                  key={dept.id}
                  onClick={() => handleSelectDepartment(dept.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/25 ring-2 ring-emerald-600'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <img
                    src={displayPic}
                    alt=""
                    className="w-5 h-5 rounded-md object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span>{dept.shortName}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-emerald-800 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
