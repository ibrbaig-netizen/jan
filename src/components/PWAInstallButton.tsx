import React, { useState } from 'react';
import { Check, Download, Info, Smartphone, Sparkles, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showGenericGuide, setShowGenericGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('pwa_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  // If already installed as app or in standalone mode, hide
  if (isInstalled || isDismissed) {
    return null;
  }

  const handleDismiss = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsDismissed(true);
    try {
      sessionStorage.setItem('pwa_banner_dismissed', 'true');
    } catch {}
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        setIsDismissed(true);
      }
      return;
    }

    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    // Generic browser guide
    setShowGenericGuide(true);
  };

  return (
    <>
      {/* Flashy App Download Banner under Search Bar */}
      <div
        className={`mt-2 w-full p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 border border-emerald-500/40 shadow-md text-white flex items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200 ${className}`}
      >
        <div
          className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
          onClick={handleInstallClick}
        >
          {/* Flashy Animated Icon */}
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 font-black shadow-md shrink-0 ring-2 ring-amber-300/40 animate-pulse">
            <Smartphone className="w-4 h-4 text-slate-950" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-mono shadow-2xs">
                Free App
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                Download Jan Chemist App
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-emerald-100 truncate mt-0.5">
              1-Tap WhatsApp orders, instant Rx upload &amp; offline inventory
            </p>
          </div>
        </div>

        {/* Action Button & Dismiss */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 active:scale-95 text-slate-950 font-extrabold text-xs flex items-center gap-1 shadow-sm transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Install</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 text-emerald-200/70 hover:text-white rounded-lg transition cursor-pointer"
            title="Dismiss app banner"
            aria-label="Dismiss app banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Install on iPhone or iPad</span>
              </h4>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <span>Tap the <strong>Share</strong> button (box with upward arrow) at the bottom of Safari.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <span>Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <span>Tap <strong>Add</strong> in the top corner to use Jan Chemist like a native app!</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Generic Browser Guide Modal */}
      {showGenericGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Install Jan Chemist App</span>
              </h4>
              <button
                onClick={() => setShowGenericGuide(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <p>
                To install Jan Chemist on your device for fast 1-tap WhatsApp ordering:
              </p>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-1.5 border border-slate-200 dark:border-slate-700 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <Info className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Chrome / Android / Edge:</span>
                </div>
                <p>
                  Click the <strong>Install App icon (⊕ or 📲)</strong> in your browser&apos;s address bar, or tap the browser menu (⋮) and select <strong>&quot;Install app&quot;</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowGenericGuide(false)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
