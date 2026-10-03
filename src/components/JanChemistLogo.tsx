import React from 'react';
import { useStore } from '../context/StoreContext';
import { DEFAULT_STORE_CONFIG } from '../utils/whatsapp';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'green-badge' | 'green-card' | 'transparent-light' | 'transparent-dark';
  showTagline?: boolean;
  overrideLogoUrl?: string;
}

export const JanChemistLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  variant = 'green-badge',
  showTagline = true,
  overrideLogoUrl
}) => {
  // Read store config if available inside provider
  let config = DEFAULT_STORE_CONFIG;
  try {
    const store = useStore();
    if (store && store.storeConfig) {
      config = store.storeConfig;
    }
  } catch {}

  const storeName = config.storeName || 'JAN CHEMIST';
  const tagline = config.tagline || 'With us its original';
  const logoType = config.logoType || 'custom-image';

  // Check if an uploaded logo picture is saved in browser storage
  const savedUploadedLogo =
    typeof window !== 'undefined' ? localStorage.getItem('jan_chemist_uploaded_logo') : null;

  const customLogoUrl =
    overrideLogoUrl ||
    (config.customLogoUrl && config.customLogoUrl !== '/logo.svg'
      ? config.customLogoUrl
      : savedUploadedLogo || config.customLogoUrl || '/logo.svg');

  const badgeColor = config.logoBadgeColor || '#248243';

  // Proportional sizing configurations
  const sizeConfig = {
    sm: {
      width: 170,
      height: 44,
      imageHeight: 'h-7 max-w-[140px]',
      fontSize: 18,
      pulseWidth: 2.8,
      taglineSize: 'text-[9px]',
      padding: 'px-2.5 py-1',
      rounded: 'rounded-xl'
    },
    md: {
      width: 220,
      height: 56,
      imageHeight: 'h-10 max-w-[190px]',
      fontSize: 23,
      pulseWidth: 3.2,
      taglineSize: 'text-[11px]',
      padding: 'px-3 py-1.5',
      rounded: 'rounded-2xl'
    },
    lg: {
      width: 310,
      height: 78,
      imageHeight: 'h-14 max-w-[260px]',
      fontSize: 32,
      pulseWidth: 4.2,
      taglineSize: 'text-xs',
      padding: 'px-5 py-3',
      rounded: 'rounded-2xl'
    },
    xl: {
      width: 380,
      height: 96,
      imageHeight: 'h-18 max-w-[320px]',
      fontSize: 39,
      pulseWidth: 5,
      taglineSize: 'text-sm',
      padding: 'px-6 py-4',
      rounded: 'rounded-3xl'
    }
  };

  const c = sizeConfig[size];
  const isGreenBg = variant === 'green-badge' || variant === 'green-card';
  const textColor = isGreenBg || variant === 'transparent-light' ? '#FFFFFF' : '#0f172a';

  // Words split for ECG waveform centering
  const parts = storeName.trim().split(' ');
  const firstWord = parts[0] || 'JAN';
  const secondWord = parts.slice(1).join(' ') || 'CHEMIST';

  // 1. PICTURE OF LOGO (Default or Uploaded by Store Owner)
  if (logoType === 'custom-image' && customLogoUrl) {
    return (
      <div
        style={isGreenBg ? { backgroundColor: badgeColor } : {}}
        className={`inline-flex flex-col items-center justify-center select-none ${
          isGreenBg
            ? `text-white shadow-md border border-emerald-500/40 transition-colors ${c.rounded} ${c.padding}`
            : ''
        } ${className}`}
      >
        <img
          src={customLogoUrl}
          alt={storeName}
          onError={e => {
            const imgEl = e.target as HTMLImageElement;
            if (imgEl.src !== '/logo.svg' && !imgEl.src.endsWith('/logo.svg')) {
              imgEl.src = '/logo.svg';
            }
          }}
          className={`${c.imageHeight} object-contain`}
        />
        {showTagline && !customLogoUrl.includes('logo-badge.svg') && (
          <div
            className={`font-semibold tracking-wider italic flex items-center gap-1.5 mt-1 ${
              isGreenBg || variant === 'transparent-light'
                ? 'text-emerald-100'
                : 'text-emerald-700'
            } ${c.taglineSize}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            <span>&ldquo;{tagline}&rdquo;</span>
          </div>
        )}
      </div>
    );
  }

  // 2. TEXT-ONLY LOGO
  if (logoType === 'text-only') {
    return (
      <div
        style={isGreenBg ? { backgroundColor: badgeColor } : {}}
        className={`inline-flex flex-col items-center justify-center select-none ${
          isGreenBg
            ? `text-white shadow-md border border-emerald-500/40 transition-colors ${c.rounded} ${c.padding}`
            : ''
        } ${className}`}
      >
        <span
          className={`font-black tracking-wider uppercase font-sans ${
            isGreenBg || variant === 'transparent-light' ? 'text-white' : 'text-slate-900'
          }`}
          style={{ fontSize: `${c.fontSize}px`, letterSpacing: '0.08em' }}
        >
          {storeName}
        </span>
        {showTagline && (
          <div
            className={`font-semibold tracking-wider italic flex items-center gap-1.5 mt-0.5 ${
              isGreenBg || variant === 'transparent-light'
                ? 'text-emerald-100'
                : 'text-emerald-700'
            } ${c.taglineSize}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            <span>&ldquo;{tagline}&rdquo;</span>
          </div>
        )}
      </div>
    );
  }

  // 3. OFFICIAL VECTOR ECG LOGO (Default matching FB_IMG_1790795897298.jpg)
  return (
    <div
      style={isGreenBg ? { backgroundColor: badgeColor } : {}}
      className={`inline-flex flex-col items-center justify-center select-none ${
        isGreenBg
          ? `text-white shadow-md border border-emerald-500/40 transition-colors ${c.rounded} ${c.padding}`
          : ''
      } ${className}`}
    >
      <svg
        viewBox="0 0 320 80"
        width={c.width}
        height={c.height}
        className="overflow-visible max-w-full h-auto drop-shadow-xs"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Subtle watermark background when on card */}
        {variant === 'green-card' && (
          <g opacity="0.07" fill="#FFFFFF">
            <rect x="10" y="8" width="55" height="15" rx="2" />
            <rect x="75" y="8" width="50" height="15" rx="2" />
            <rect x="190" y="8" width="55" height="15" rx="2" />
            <rect x="255" y="8" width="55" height="15" rx="2" />
            <rect x="10" y="58" width="60" height="15" rx="2" />
            <rect x="250" y="58" width="60" height="15" rx="2" />
          </g>
        )}

        {/* First Word (JAN) */}
        <text
          x="20"
          y="53"
          fill={textColor}
          fontSize="31"
          fontWeight="900"
          fontFamily="'Plus Jakarta Sans', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          letterSpacing="2.5"
          className="uppercase select-none"
        >
          {firstWord}
        </text>

        {/* Second Word (CHEMIST) */}
        <text
          x="142"
          y="53"
          fill={textColor}
          fontSize="31"
          fontWeight="900"
          fontFamily="'Plus Jakarta Sans', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          letterSpacing="2.5"
          className="uppercase select-none"
        >
          {secondWord}
        </text>

        {/* Soft Red Pulse Glow */}
        <path
          d="M 12 43 L 86 43 L 96 38 L 104 46 L 119 8 L 132 75 L 142 32 L 151 46 L 158 43 L 308 43"
          fill="none"
          stroke="#EF233C"
          strokeWidth={c.pulseWidth + 2.5}
          strokeLinecap="round"
          strokeLinejoin="miter"
          strokeMiterlimit="8"
          opacity="0.25"
        />

        {/* Sharp Red ECG Pulse cutting across */}
        <path
          d="M 12 43 L 86 43 L 96 38 L 104 46 L 119 8 L 132 75 L 142 32 L 151 46 L 158 43 L 308 43"
          fill="none"
          stroke="#EF233C"
          strokeWidth={c.pulseWidth}
          strokeLinecap="round"
          strokeLinejoin="miter"
          strokeMiterlimit="8"
        />
      </svg>

      {/* Tagline */}
      {showTagline && (
        <div
          className={`font-semibold tracking-wider italic flex items-center gap-1.5 -mt-0.5 ${
            isGreenBg || variant === 'transparent-light'
              ? 'text-emerald-100'
              : 'text-emerald-700'
          } ${c.taglineSize}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
          <span>&ldquo;{tagline}&rdquo;</span>
        </div>
      )}
    </div>
  );
};
