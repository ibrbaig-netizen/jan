import React, { useState } from 'react';
import {
  CheckCircle,
  Eye,
  MessageCircle,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star
} from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { generateSingleProductWhatsAppUrl } from '../utils/whatsapp';
import { cleanAndResolveImageUrl, getProxiedImageUrl, DEFAULT_DEPT_IMAGES } from '../utils/imageUrlResolver';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { addToCart, storeConfig } = useStore();
  const [imageLoaded, setImageLoaded] = useState(false);

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const resolvedImage = cleanAndResolveImageUrl(product.image);

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative text-slate-900 dark:text-slate-100">
      {/* Top Image Container */}
      <div className="relative aspect-4/3 bg-slate-100 overflow-hidden cursor-pointer" onClick={() => onQuickView(product)}>
        {/* Skeleton placeholder while loading */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-slate-200 animate-pulse" />
        )}
        <img
          src={resolvedImage}
          alt={product.name}
          referrerPolicy="no-referrer"
          onLoad={() => setImageLoaded(true)}
          onError={e => {
            const imgEl = e.target as HTMLImageElement;
            if (!imgEl.src.includes('/api/image-proxy') && !imgEl.src.startsWith('data:')) {
              imgEl.src = getProxiedImageUrl(product.image);
            } else {
              imgEl.src = DEFAULT_DEPT_IMAGES[product.department] || DEFAULT_DEPT_IMAGES.cosmetics;
            }
            setImageLoaded(true);
          }}
          className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
          {/* 100% Original Badge */}
          {product.isOriginalGuaranteed && (
            <span className="inline-flex items-center gap-1 bg-emerald-700/95 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
              <ShieldCheck className="w-3 h-3 text-emerald-300" />
              <span>100% Original</span>
            </span>
          )}

          {/* Special badge */}
          {product.badge && (
            <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-md shadow-xs">
              {product.badge}
            </span>
          )}
        </div>

        {/* Discount Badge */}
        {discountPercent && (
          <span className="absolute top-2.5 right-2.5 bg-red-600 text-white font-extrabold text-[11px] px-2 py-0.5 rounded-md shadow-sm">
            Save {discountPercent}%
          </span>
        )}

        {/* Hover Quick View Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          className="absolute bottom-2.5 right-2.5 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          title="Quick View"
        >
          <Eye className="w-4 h-4 text-emerald-700" />
        </button>
      </div>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Department & Unit Meta */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
            <span className="uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold">
              {product.department}
            </span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
              {product.unit}
            </span>
          </div>

          {/* Product Name */}
          <h3
            onClick={() => onQuickView(product)}
            className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug line-clamp-2 hover:text-emerald-700 dark:hover:text-emerald-400 transition cursor-pointer"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Ratings & Authenticity note */}
          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-slate-700 dark:text-slate-200 ml-1 text-xs">{product.rating || 4.8}</span>
            </div>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-[11px] text-slate-400 font-medium">({product.reviewsCount || 45} reviews)</span>
          </div>
        </div>

        {/* Price & Stock info */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg sm:text-xl font-extrabold text-slate-950 dark:text-white font-sans">
              Rs. {product.price.toLocaleString()}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-slate-400 line-through">
                Rs. {product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] mt-1">
            {product.inStock ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                In Stock
              </span>
            ) : (
              <span className="text-red-500 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                Out of Stock
              </span>
            )}
            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]" title={product.barcode ? `Barcode: ${product.barcode}` : `SKU: ${product.sku}`}>
              {product.barcode ? `Barcode: ${product.barcode}` : `SKU: ${product.sku.slice(0, 10)}`}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Add to Cart Button */}
          <button
            onClick={() => addToCart(product, 1)}
            disabled={!product.inStock}
            className={`w-full py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              product.inStock
                ? 'bg-emerald-50 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-600 dark:hover:bg-emerald-600 hover:text-white border border-emerald-300/80 dark:border-slate-700 hover:border-emerald-600 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add to Cart</span>
          </button>

          {/* Quick WhatsApp Order Button */}
          <a
            href={generateSingleProductWhatsAppUrl(product, 1, storeConfig)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all"
            title="Order directly on WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white/20" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
