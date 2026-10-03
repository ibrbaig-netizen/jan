import React from 'react';
import {
  CheckCircle2,
  Clock,
  FileUp,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Truck
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { JanChemistLogo } from './JanChemistLogo';

export const HeroBanner: React.FC = () => {
  const { storeConfig, setIsPrescriptionModalOpen, setSelectedDepartment } = useStore();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white py-10 lg:py-14 px-4 border-b border-emerald-800">
      {/* Background Subtle Medical / Grid Texture */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      {/* Ambient Glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Headlines & CTAs */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            {/* Pill Guarantee */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-600/60 shadow-inner backdrop-blur-sm text-xs font-semibold text-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Authentic Guarantee</span>
              <span className="text-emerald-400">•</span>
              <span className="text-amber-300 font-bold">&ldquo;{storeConfig.tagline}&rdquo;</span>
            </div>

            {/* Main Title with brand styling */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <JanChemistLogo size="lg" variant="green-card" showTagline={true} className="shadow-2xl border border-emerald-400/30" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {storeConfig.heroTitle || 'Your Complete Superstore & Trusted Pharmacy'}
              </h1>
            </div>

            {/* Description */}
            <p className="text-emerald-100/90 text-sm sm:text-base max-w-2xl leading-relaxed">
              {storeConfig.heroSubtitle || (
                <>
                  Shop 8+ departments: <strong>Cosmetics</strong>, <strong>Grocery</strong>, <strong>Drinks</strong>, <strong>Lingerie</strong>, <strong>Toiletries</strong>, <strong>Toys</strong>, <strong>Birthday Items</strong>, <strong>Crockery</strong>, <strong>Electronics</strong>, and certified <strong>Prescription Medicines</strong>.
                </>
              )}
            </p>

            {/* Timing Banner */}
            <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-4 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-white">Daily Timings:</span>
                <span className="text-emerald-200 font-medium">8:00 AM to 1:00 AM (7 Days a Week)</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-emerald-600/60" />
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-300" />
                <span className="text-emerald-200">Fast 30-45 Mins Express Delivery</span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              {/* WhatsApp Checkout CTA */}
              <a
                href={`https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(
                  `Hello Jan Chemist! I want to order original items ("${storeConfig.tagline}"). Please send your catalog or take my order.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-emerald-950/40 hover:-translate-y-0.5 transition-all"
              >
                <MessageCircle className="w-5 h-5 fill-white/20" />
                <span>Order via WhatsApp ({storeConfig.displayPhone})</span>
              </a>

              {/* Upload Prescription CTA */}
              <button
                onClick={() => setIsPrescriptionModalOpen(true)}
                className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-red-950/30 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <FileUp className="w-5 h-5" />
                <span>Upload Prescription</span>
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Quick Upload & Service Highlights Box */}
          <div className="lg:col-span-5">
            <div className="bg-gradient-to-b from-slate-900/90 to-emerald-950/90 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-800/80">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                  <h3 className="font-bold text-white text-base tracking-wide">
                    Jan Chemist Express Service
                  </h3>
                </div>
                <span className="text-[11px] font-semibold bg-emerald-800 text-emerald-200 px-2.5 py-0.5 rounded-full">
                  7 Days Open
                </span>
              </div>

              {/* Prescription Quick Upload Box */}
              <div
                onClick={() => setIsPrescriptionModalOpen(true)}
                className="group relative cursor-pointer border-2 border-dashed border-emerald-500/50 hover:border-emerald-400 rounded-2xl p-4 bg-emerald-900/20 hover:bg-emerald-900/40 transition-all text-center space-y-2"
              >
                <div className="w-12 h-12 rounded-xl bg-red-600/20 text-red-400 group-hover:bg-red-600 group-hover:text-white transition-all mx-auto flex items-center justify-center">
                  <FileUp className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm group-hover:text-emerald-300 transition">
                    Need Medicines? Snap &amp; Upload Prescription
                  </h4>
                  <p className="text-emerald-200/70 text-xs mt-0.5">
                    Click here to attach photo or document. Our certified pharmacist will verify &amp; dispatch to your doorstep.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 group-hover:text-white underline pt-1">
                  <span>Open Prescription Portal</span>
                  <span>→</span>
                </div>
              </div>

              {/* 3 Value Pillars */}
              <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <div className="font-bold text-[11px] text-white">100% Original</div>
                  <div className="text-[10px] text-emerald-200/70">No fakes, no copy</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <div className="font-bold text-[11px] text-white">8 AM - 1 AM</div>
                  <div className="text-[10px] text-emerald-200/70">Late night delivery</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <MessageCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
                  <div className="font-bold text-[11px] text-white">WhatsApp</div>
                  <div className="text-[10px] text-emerald-200/70">03205868464</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
