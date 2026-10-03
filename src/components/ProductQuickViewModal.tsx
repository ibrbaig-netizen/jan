import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FlaskConical,
  Home,
  MessageCircle,
  Minus,
  Pill,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  X
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { generateSingleProductWhatsAppUrl } from '../utils/whatsapp';
import { cleanAndResolveImageUrl, getProxiedImageUrl, DEFAULT_DEPT_IMAGES } from '../utils/imageUrlResolver';

interface QuickViewProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductQuickViewModal: React.FC<QuickViewProps> = ({ product, onClose }) => {
  const { addToCart, storeConfig, setSelectedDepartment, setSearchQuery, setIsCartOpen } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>(product?.image || '');
  const [orderActionDone, setOrderActionDone] = useState<'whatsapp' | 'cart' | null>(null);

  React.useEffect(() => {
    if (product?.image) {
      setActiveImage(product.image);
    }
    setOrderActionDone(null);
  }, [product]);

  if (!product) return null;

  const allImages = Array.from(new Set([product.image, ...(product.additionalImages || [])])).filter(Boolean);

  const handleAdd = () => {
    addToCart(product, quantity);
    setOrderActionDone('cart');
  };

  const handleWhatsAppClick = () => {
    const url = generateSingleProductWhatsAppUrl(product, quantity, storeConfig);
    window.open(url, '_blank');
    setOrderActionDone('whatsapp');
  };

  const handleHomeNavigation = () => {
    onClose();
    setSelectedDepartment('all');
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Left Navigation Buttons (Back & Home) */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5">
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-700 hover:text-slate-950 text-xs font-bold shadow-md border border-slate-200/80 flex items-center gap-1 transition cursor-pointer active:scale-95"
            title="Back to Products"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-600" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={handleHomeNavigation}
            className="px-2.5 py-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-700 hover:text-slate-950 text-xs font-bold shadow-md border border-slate-200/80 flex items-center gap-1 transition cursor-pointer active:scale-95"
            title="Return to Store Home"
          >
            <Home className="w-3.5 h-3.5 text-emerald-600" />
            <span>Home</span>
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-white/90 hover:bg-white text-slate-500 hover:text-slate-900 p-2 rounded-full shadow-md transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image & Guarantee Column */}
          <div className="relative bg-slate-100 p-6 flex flex-col justify-center items-center">
            <img
              src={cleanAndResolveImageUrl(activeImage || product.image)}
              alt={product.name}
              referrerPolicy="no-referrer"
              onError={e => {
                const imgEl = e.target as HTMLImageElement;
                if (!imgEl.src.includes('/api/image-proxy') && !imgEl.src.startsWith('data:')) {
                  imgEl.src = getProxiedImageUrl(activeImage || product.image);
                } else {
                  imgEl.src = DEFAULT_DEPT_IMAGES[product.department] || DEFAULT_DEPT_IMAGES.cosmetics;
                }
              }}
              className="max-h-72 w-auto object-contain rounded-2xl shadow-sm transition-all"
            />

            {/* Additional Pictures Thumbnails Selector */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2 mt-3 overflow-x-auto max-w-full pb-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                      activeImage === img
                        ? 'border-emerald-600 ring-2 ring-emerald-400/40'
                        : 'border-slate-300 hover:border-slate-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {/* Authenticity Badge */}
            <div className="mt-4 w-full bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-emerald-900">Jan Chemist Original Guarantee</div>
                <div className="text-emerald-700 font-medium">&ldquo;{storeConfig.tagline}&rdquo; — 100% Genuine</div>
              </div>
            </div>
          </div>

          {/* Details Column */}
          <div className="p-6 md:p-8 flex flex-col justify-between space-y-4">
            <div>
              {/* Dept & Category Tag */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-md">
                  {product.department}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {product.category}
                </span>
                {product.badge && (
                  <span className="text-[11px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md">
                    {product.badge}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                {product.name}
              </h2>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-800 ml-1 text-sm">{product.rating || 4.9}</span>
                </div>
                <span className="text-slate-400">•</span>
                <span className="text-xs text-slate-500">{product.reviewsCount || 85} verified reviews</span>
              </div>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-950">
                  Rs. {product.price.toLocaleString()}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-sm text-slate-400 line-through">
                      Rs. {product.originalPrice.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded">
                      Save {discountPercent}%
                    </span>
                  </>
                )}
              </div>

              {/* Specifications pills */}
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Packaging Unit</span>
                  <span className="font-bold text-slate-800">{product.unit}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Inventory Status</span>
                  <span className={`font-bold flex items-center gap-1 ${product.inStock ? 'text-emerald-700' : 'text-red-600'}`}>
                    <span className={`w-2 h-2 rounded-full ${product.inStock ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Product SKU</span>
                  <span className="font-mono text-slate-700 font-semibold">{product.sku}</span>
                </div>
                {product.barcode && (
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Barcode</span>
                    <span className="font-mono text-slate-700 font-semibold">{product.barcode}</span>
                  </div>
                )}
              </div>

              {/* Formulation, Dose & Usage Cards if present */}
              {(product.formulation || product.dose || product.usage) && (
                <div className="mt-3 space-y-2 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                  {product.formulation && (
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-purple-800 flex items-center gap-1">
                        <FlaskConical className="w-3 h-3 text-purple-600" />
                        <span>Formulation &amp; Composition</span>
                      </span>
                      <p className="text-slate-700 text-[11px] leading-relaxed mt-0.5 font-medium">
                        {product.formulation}
                      </p>
                    </div>
                  )}

                  {product.dose && (
                    <div className="pt-1.5 border-t border-slate-200/60">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-blue-800 flex items-center gap-1">
                        <Pill className="w-3 h-3 text-blue-600" />
                        <span>Dose &amp; Guidelines</span>
                      </span>
                      <p className="text-slate-700 text-[11px] leading-relaxed mt-0.5 font-medium">
                        {product.dose}
                      </p>
                    </div>
                  )}

                  {product.usage && (
                    <div className="pt-1.5 border-t border-slate-200/60">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-800 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>Usage &amp; Storage</span>
                      </span>
                      <p className="text-slate-700 text-[11px] leading-relaxed mt-0.5 font-medium">
                        {product.usage}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-white p-3 rounded-xl border border-slate-100 max-h-48 overflow-y-auto">
                {product.description}
              </div>

              {/* Timings pill */}
              <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100 mt-3">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Orders delivered between <strong>8:00 AM - 1:00 AM</strong> daily via WhatsApp.</span>
              </div>
            </div>

            {/* Actions: Quantity & CTA */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Select Quantity:</span>
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-slate-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(99, quantity + 1))}
                    className="p-2 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {orderActionDone ? (
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-center space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{orderActionDone === 'whatsapp' ? 'WhatsApp Order Opened!' : 'Added to Cart!'}</span>
                  </div>

                  <p className="text-xs text-slate-600">
                    What would you like to do next?
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Store</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleHomeNavigation}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>Store Home</span>
                    </button>
                  </div>

                  {orderActionDone === 'cart' && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        setIsCartOpen(true);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Open Shopping Cart</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleAdd}
                    disabled={!product.inStock}
                    className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart (Rs. {(product.price * quantity).toLocaleString()})</span>
                  </button>

                  <button
                    onClick={handleWhatsAppClick}
                    className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-white/20" />
                    <span>Order on WhatsApp</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
