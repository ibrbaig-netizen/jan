import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Tag
} from 'lucide-react';
import { DepartmentId } from '../types';
import {
  getGoogleImagesSearchUrl,
  getGoogleWebSearchUrl,
  GoogleSearchResult,
  searchGoogleForProduct
} from '../utils/googleSearchService';
import {
  cleanAndResolveImageUrl,
  getProxiedImageUrl,
  DEFAULT_DEPT_IMAGES
} from '../utils/imageUrlResolver';

interface GoogleSearchEnricherProps {
  initialQuery?: string;
  preferredDept?: DepartmentId;
  currentImageUrl?: string;
  onApplyResult: (result: GoogleSearchResult) => void;
  onSelectImage?: (imageUrl: string) => void;
}

export const GoogleSearchEnricher: React.FC<GoogleSearchEnricherProps> = ({
  initialQuery = '',
  preferredDept,
  currentImageUrl,
  onApplyResult,
  onSelectImage
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<GoogleSearchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);

  // Sync if initialQuery changes
  React.useEffect(() => {
    if (initialQuery && !searchQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setErrorMsg('Please enter a product title, brand, or barcode to search.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setHasApplied(false);

    try {
      const result = await searchGoogleForProduct(query, preferredDept);
      setSearchResult(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to retrieve search results. You can use direct Google links below.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!searchResult) return;
    onApplyResult(searchResult);
    setHasApplied(true);
  };

  const currentWebSearchUrl = getGoogleWebSearchUrl(searchQuery);
  const currentImagesSearchUrl = getGoogleImagesSearchUrl(searchQuery);

  return (
    <div className="bg-gradient-to-r from-blue-900/10 via-emerald-900/10 to-teal-900/10 border border-blue-200/80 rounded-2xl p-4 space-y-3.5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
              <span>Google Product Search &amp; Auto-Enrich</span>
              <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                Auto-Lookup
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Auto-fetch verified packaging, Pakistani retail price, unit, and photos from Google
            </p>
          </div>
        </div>

        {/* External direct Google search buttons */}
        <div className="flex items-center gap-2">
          <a
            href={currentWebSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg transition"
            title="Search Google for Pakistani price and specifications"
          >
            <span>Google Web</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <a
            href={currentImagesSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg transition"
            title="Search Google Images for high resolution original packaging photos"
          >
            <ImageIcon className="w-3 h-3" />
            <span>Google Images</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Type product name, brand, or barcode (e.g. Panadol Extra, CeraVe Cleanser, Nestle Nido)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50 shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Searching Google...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Auto-Fetch from Google</span>
            </>
          )}
        </button>
      </form>

      {/* Error message if any */}
      {errorMsg && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search Result Card if found */}
      {searchResult && (
        <div className="bg-white border border-blue-200 rounded-xl p-3.5 shadow-xs space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <img
                src={cleanAndResolveImageUrl(searchResult.image)}
                alt={searchResult.name}
                referrerPolicy="no-referrer"
                onError={e => {
                  const imgEl = e.target as HTMLImageElement;
                  if (!imgEl.src.includes('/api/image-proxy') && !imgEl.src.startsWith('data:')) {
                    imgEl.src = getProxiedImageUrl(searchResult.image);
                  } else {
                    imgEl.src = DEFAULT_DEPT_IMAGES[searchResult.department] || DEFAULT_DEPT_IMAGES.cosmetics;
                  }
                }}
                className="w-14 h-14 object-cover rounded-lg border border-slate-200 bg-slate-50 shrink-0"
              />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Found via Google Search</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600 uppercase font-semibold">{searchResult.department}</span>
                </div>
                <div className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">
                  {searchResult.name}
                </div>
                <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="font-bold text-emerald-700">Rs. {searchResult.price.toLocaleString()}</span>
                  <span>•</span>
                  <span>Unit: <strong>{searchResult.unit}</strong></span>
                  {searchResult.category && (
                    <>
                      <span>•</span>
                      <span>Cat: {searchResult.category}</span>
                    </>
                  )}
                  {searchResult.barcode && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-[10px] text-slate-500">Barcode: {searchResult.barcode}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <button
              type="button"
              onClick={handleApply}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0 ${
                hasApplied
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {hasApplied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Details Applied!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Auto-Fill All Fields</span>
                </>
              )}
            </button>
          </div>

          {/* Description Snippet */}
          <div className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
            &ldquo;{searchResult.description}&rdquo;
          </div>

          {/* Suggested Images Row */}
          {searchResult.suggestedImages && searchResult.suggestedImages.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                <span>Google Image Matches (Click to select image):</span>
                <span className="text-[10px] text-slate-400 font-normal">Click any photo to use for product</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {searchResult.suggestedImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectImage?.(imgUrl)}
                    className={`relative rounded-lg overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                      currentImageUrl === imgUrl
                        ? 'border-emerald-600 ring-2 ring-emerald-400/40'
                        : 'border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    <img
                      src={cleanAndResolveImageUrl(imgUrl)}
                      alt={`Match ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      onError={e => {
                        const imgEl = e.target as HTMLImageElement;
                        if (!imgEl.src.includes('/api/image-proxy') && !imgEl.src.startsWith('data:')) {
                          imgEl.src = getProxiedImageUrl(imgUrl);
                        } else {
                          imgEl.src = DEFAULT_DEPT_IMAGES[searchResult.department] || DEFAULT_DEPT_IMAGES.cosmetics;
                        }
                      }}
                      className="w-14 h-14 object-cover bg-slate-50"
                    />
                    {currentImageUrl === imgUrl && (
                      <div className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
