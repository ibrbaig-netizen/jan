import React, { useState } from 'react';
import {
  ExternalLink,
  Globe,
  Image as ImageIcon,
  PackagePlus,
  Plus,
  Search,
  Sparkles,
  X
} from 'lucide-react';
import { DepartmentId, Product } from '../types';
import {
  getGoogleImagesSearchUrl,
  getGoogleWebSearchUrl,
  GoogleSearchResult
} from '../utils/googleSearchService';
import { GoogleSearchEnricher } from './GoogleSearchEnricher';

interface InventoryGoogleSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onAddProduct: (product: Omit<Product, 'id'>) => Product | Promise<Product> | void | Promise<void>;
  onOpenAddModalWithDetails: (details: Partial<Product>) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const InventoryGoogleSearchModal: React.FC<InventoryGoogleSearchModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  onAddProduct,
  onOpenAddModalWithDetails,
  showToast
}) => {
  const [selectedResult, setSelectedResult] = useState<GoogleSearchResult | null>(null);

  if (!isOpen) return null;

  const handleApplyResult = (res: GoogleSearchResult) => {
    setSelectedResult(res);
  };

  const handleDirectAdd = () => {
    if (!selectedResult) return;

    onAddProduct({
      name: selectedResult.name,
      department: selectedResult.department,
      category: selectedResult.category,
      price: selectedResult.price,
      originalPrice: selectedResult.originalPrice,
      stock: 25,
      unit: selectedResult.unit,
      sku: selectedResult.sku || `JAN-${selectedResult.department.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      barcode: selectedResult.barcode || undefined,
      description: selectedResult.description,
      image: selectedResult.image,
      inStock: true,
      isOriginalGuaranteed: true,
      badge: '100% Genuine'
    });

    showToast(`Added "${selectedResult.name}" to inventory from Google Search!`, 'success');
    onClose();
  };

  const handleCustomizeBeforeAdding = () => {
    if (!selectedResult) return;
    onOpenAddModalWithDetails({
      name: selectedResult.name,
      department: selectedResult.department,
      category: selectedResult.category,
      price: selectedResult.price,
      originalPrice: selectedResult.originalPrice,
      stock: 25,
      unit: selectedResult.unit,
      sku: selectedResult.sku,
      barcode: selectedResult.barcode,
      description: selectedResult.description,
      image: selectedResult.image
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-1.5">
                <span>Google Inventory Search &amp; Auto-Import</span>
              </h3>
              <p className="text-[11px] text-blue-200">
                Search Google for any product to auto-discover pricing, unit, and photos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 text-xs">
          <GoogleSearchEnricher
            initialQuery={initialQuery}
            currentImageUrl={selectedResult?.image}
            onApplyResult={handleApplyResult}
            onSelectImage={url => {
              if (selectedResult) {
                setSelectedResult({ ...selectedResult, image: url });
              }
            }}
          />

          {selectedResult && (
            <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500">
                Ready to import into Jan Chemist catalog.
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCustomizeBeforeAdding}
                  className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
                >
                  Review &amp; Edit Details
                </button>

                <button
                  type="button"
                  onClick={handleDirectAdd}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <PackagePlus className="w-4 h-4" />
                  <span>Import into Inventory Now</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
