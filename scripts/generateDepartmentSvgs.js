import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public/departments');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Function to create a clean department card SVG matching the user's uploaded images:
// - Pure white background (#ffffff)
// - Drop shadow and realistic packaging cutouts
// - Clean, bold blue typography at bottom: #0052b4 (Jan Chemist retail style)
function createCardSvg(title, itemsSvg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0f172a" flood-opacity="0.15" />
    </filter>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.12" />
    </filter>
    <linearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0055b3" />
      <stop offset="100%" stop-color="#0066cc" />
    </linearGradient>
  </defs>

  <!-- Clean Pure White Background -->
  <rect width="500" height="500" fill="#ffffff" rx="24" />

  <!-- Subtle Inner Border Frame -->
  <rect x="12" y="12" width="476" height="476" rx="20" fill="none" stroke="#f1f5f9" stroke-width="1.5" />

  <!-- Product Cutouts Container -->
  <g transform="translate(0, 10)">
    ${itemsSvg}
  </g>

  <!-- Grounding Shadow below products -->
  <ellipse cx="250" cy="385" rx="190" ry="14" fill="#000000" opacity="0.06" filter="blur(8px)" />

  <!-- Bold Blue Department Title at Bottom (Exact Match to Uploaded Pictures) -->
  <text 
    x="250" 
    y="445" 
    text-anchor="middle" 
    font-family="'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
    font-weight="800" 
    font-size="34" 
    letter-spacing="0.5" 
    fill="#0052b4"
  >${title}</text>
</svg>`;
}

const cards = {
  'beverages': {
    title: 'BEVERAGES',
    svg: `
      <!-- Tapal Tea Jar -->
      <g filter="url(#shadow)" transform="translate(110, 85)">
        <rect x="0" y="60" width="130" height="230" rx="16" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
        <rect x="5" y="65" width="120" height="220" rx="12" fill="#eab308"/>
        <!-- Jar Lid -->
        <rect x="15" y="40" width="100" height="25" rx="8" fill="#ca8a04" stroke="#a16207" stroke-width="2"/>
        <!-- Tapal Label -->
        <rect x="15" y="105" width="100" height="95" rx="8" fill="#b91c1c"/>
        <text x="65" y="135" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="14" fill="#ffffff">TAPAL</text>
        <text x="65" y="155" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="16" fill="#fef08a">Family</text>
        <text x="65" y="175" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="13" fill="#ffffff">MIXTURE</text>
        <!-- Tea Cup Graphic -->
        <circle cx="65" cy="235" r="28" fill="#ffffff"/>
        <circle cx="65" cy="235" r="22" fill="#92400e"/>
        <ellipse cx="65" cy="230" rx="18" ry="12" fill="#b45309"/>
      </g>
      <!-- Nesfruta Juice Box -->
      <g filter="url(#shadow)" transform="translate(250, 115)">
        <rect x="0" y="30" width="115" height="230" rx="10" fill="#dc2626"/>
        <!-- Top Straw hole -->
        <polygon points="0,30 25,0 140,0 115,30" fill="#b91c1c"/>
        <polygon points="115,30 140,0 140,200 115,230" fill="#991b1b"/>
        <!-- Nestle text -->
        <text x="58" y="60" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="14" fill="#ffffff">Nestle</text>
        <!-- Nesfruta -->
        <rect x="10" y="75" width="95" height="35" rx="6" fill="#0284c7"/>
        <text x="58" y="98" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="17" fill="#ffffff">Nesfruta</text>
        <!-- Apple & Splash -->
        <circle cx="58" cy="165" r="32" fill="#ef4444"/>
        <ellipse cx="68" cy="155" rx="10" ry="18" fill="#fecaca" opacity="0.6"/>
        <path d="M58,135 Q65,120 70,125" stroke="#15803d" stroke-width="4" fill="none"/>
        <text x="58" y="225" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="12" fill="#fef08a">APPLE JUICE</text>
      </g>
    `
  },
  'personal-care': {
    title: 'PERSONAL CARE',
    svg: `
      <!-- Colgate Toothbrushes Pack -->
      <g filter="url(#shadow)" transform="translate(95, 60)">
        <rect x="0" y="0" width="85" height="310" rx="14" fill="#0284c7"/>
        <rect x="8" y="8" width="69" height="40" rx="8" fill="#dc2626"/>
        <text x="42" y="32" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff">Colgate</text>
        <!-- Brushes blister -->
        <rect x="8" y="55" width="69" height="180" rx="8" fill="#ffffff" opacity="0.95"/>
        <path d="M30,65 L30,225" stroke="#ef4444" stroke-width="12" stroke-linecap="round"/>
        <path d="M54,65 L54,225" stroke="#22c55e" stroke-width="12" stroke-linecap="round"/>
        <!-- Bottom red Colgate badge -->
        <rect x="5" y="240" width="75" height="60" rx="6" fill="#dc2626"/>
        <text x="42" y="270" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="12" fill="#ffffff">EXTRA</text>
        <text x="42" y="288" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="11" fill="#fef08a">CLEAN</text>
      </g>
      <!-- Veet Hair Removal Box -->
      <g filter="url(#shadow)" transform="translate(195, 80)">
        <rect x="0" y="0" width="105" height="280" rx="10" fill="#fbcfe8" stroke="#f472b6" stroke-width="2"/>
        <circle cx="52" cy="65" r="32" fill="#ffffff"/>
        <text x="52" y="73" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="24" fill="#db2777">Veet</text>
        <rect x="10" y="115" width="85" height="26" rx="6" fill="#ec4899"/>
        <text x="52" y="132" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="10" fill="#ffffff">SILKY FRESH</text>
        <!-- Lotus graphic -->
        <path d="M30,190 Q52,160 74,190 Q52,220 30,190 Z" fill="#f43f5e" opacity="0.8"/>
        <rect x="25" y="235" width="55" height="22" rx="4" fill="#e11d48"/>
        <text x="52" y="250" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="11" fill="#ffffff">50gm</text>
      </g>
      <!-- Vaseline Lip Therapy Tub -->
      <g filter="url(#shadow)" transform="translate(290, 210)">
        <rect x="0" y="35" width="115" height="120" rx="30" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
        <rect x="5" y="10" width="105" height="40" rx="16" fill="#1e3a8a"/>
        <text x="57" y="35" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="13" fill="#ffffff">Vaseline</text>
        <rect x="15" y="65" width="85" height="50" rx="8" fill="#78350f"/>
        <text x="57" y="85" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="10" fill="#fef3c7">LIP THERAPY</text>
        <text x="57" y="102" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="9" fill="#fde68a">Cocoa Butter</text>
      </g>
    `
  },
  'skin-care': {
    title: 'SKIN CARE',
    svg: `
      <!-- L'Oreal Revitalift Cleanser Tube -->
      <g filter="url(#shadow)" transform="translate(85, 95)">
        <path d="M20,0 L70,0 L85,240 L5,240 Z" fill="#e9d5ff" stroke="#c084fc" stroke-width="2"/>
        <rect x="15" y="240" width="60" height="35" rx="6" fill="#7e22ce"/>
        <text x="45" y="45" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="14" fill="#581c87">L'OREAL</text>
        <rect x="10" y="70" width="70" height="40" fill="#c026d3"/>
        <text x="45" y="88" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="9" fill="#ffffff">REVITALIFT</text>
        <text x="45" y="102" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="8" fill="#fdf4ff">HYALURONIC</text>
        <circle cx="45" cy="165" r="22" fill="#ffffff" opacity="0.6"/>
      </g>
      <!-- Nivea Body Lotion Blue Pump Bottle -->
      <g filter="url(#shadow)" transform="translate(180, 50)">
        <!-- Pump Head -->
        <rect x="42" y="0" width="16" height="30" fill="#1e3a8a"/>
        <path d="M20,10 L50,10 L50,22 L15,18 Z" fill="#1e40af"/>
        <!-- Bottle Body -->
        <rect x="10" y="30" width="80" height="290" rx="28" fill="#1e3a8a"/>
        <!-- Nivea round logo -->
        <circle cx="50" cy="100" r="28" fill="#1e40af" stroke="#ffffff" stroke-width="2"/>
        <text x="50" y="106" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff">NIVEA</text>
        <!-- 48h badge -->
        <rect x="25" y="145" width="50" height="24" rx="4" fill="#3b82f6"/>
        <text x="50" y="161" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="11" fill="#ffffff">48h</text>
        <text x="50" y="195" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="10" fill="#93c5fd">NOURISHING</text>
        <text x="50" y="210" text-anchor="middle" font-family="sans-serif" font-weight="500" font-size="8" fill="#ffffff">Deep Moisture</text>
      </g>
      <!-- Neutrogena Hydro Boost Jar -->
      <g filter="url(#shadow)" transform="translate(275, 195)">
        <rect x="0" y="35" width="135" height="110" rx="14" fill="#0284c7"/>
        <rect x="5" y="5" width="125" height="35" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
        <text x="67" y="70" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff">Neutrogena</text>
        <text x="67" y="90" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="11" fill="#e0f2fe">Hydro Boost</text>
        <rect x="30" y="105" width="75" height="22" rx="4" fill="#0369a1"/>
        <text x="67" y="120" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="10" fill="#ffffff">Water Gel 50ml</text>
      </g>
    `
  },
  'makeup': {
    title: 'MAKEUP',
    svg: `
      <!-- Dior 5 Couleurs Eyeshadow Compact -->
      <g filter="url(#shadow)" transform="translate(145, 120)">
        <rect x="0" y="0" width="180" height="160" rx="14" fill="#0f172a" stroke="#334155" stroke-width="3"/>
        <rect x="15" y="15" width="65" height="55" rx="4" fill="#f43f5e"/>
        <rect x="95" y="15" width="70" height="55" rx="4" fill="#fbcfe8"/>
        <rect x="15" y="80" width="65" height="60" rx="4" fill="#3b82f6"/>
        <rect x="95" y="80" width="70" height="60" rx="4" fill="#8b5cf6"/>
        <!-- Logo -->
        <circle cx="90" cy="75" r="16" fill="#0f172a"/>
        <text x="90" y="80" text-anchor="middle" font-family="serif" font-weight="900" font-size="11" fill="#e2e8f0">CD</text>
      </g>
      <!-- Maybelline SuperStay Teddy Tint with Bear -->
      <g filter="url(#shadow)" transform="translate(60, 110)">
        <!-- Red fuzzy bear shape -->
        <circle cx="50" cy="50" r="30" fill="#dc2626"/>
        <circle cx="30" cy="28" r="12" fill="#b91c1c"/>
        <circle cx="70" cy="28" r="12" fill="#b91c1c"/>
        <ellipse cx="50" cy="110" rx="35" ry="50" fill="#dc2626"/>
        <!-- Lipstick tube held -->
        <rect x="25" y="90" width="80" height="30" rx="4" fill="#991b1b" transform="rotate(-15, 25, 90)"/>
        <text x="50" y="105" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="8" fill="#ffffff">MAYBELLINE</text>
      </g>
      <!-- Bourjois Healthy Mix Serum & Pencil -->
      <g filter="url(#shadow)" transform="translate(330, 80)">
        <rect x="0" y="20" width="55" height="240" rx="10" fill="#dc2626"/>
        <rect x="8" y="0" width="39" height="25" rx="4" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
        <text x="27" y="60" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="8" fill="#ffffff">BOURJOIS</text>
        <text x="27" y="80" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="7" fill="#fef08a">HEALTHY MIX</text>
        <!-- Eyeliner Pen -->
        <rect x="65" y="70" width="10" height="190" rx="4" fill="#0d9488"/>
        <polygon points="65,70 70,50 75,70" fill="#042f2e"/>
      </g>
    `
  },
  'vitamins-supplements': {
    title: 'VITAMINS & SUPPLEMENTS',
    svg: `
      <!-- Nutrifactor Vitamax Women Bottle -->
      <g filter="url(#shadow)" transform="translate(160, 60)">
        <!-- Bottle Cap -->
        <rect x="40" y="0" width="100" height="35" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
        <!-- Bottle Body -->
        <rect x="15" y="35" width="150" height="280" rx="24" fill="#0f172a"/>
        <!-- White Label -->
        <rect x="18" y="70" width="144" height="200" fill="#ffffff"/>
        <!-- Brand Nutrifactor -->
        <rect x="35" y="75" width="110" height="22" rx="11" fill="#15803d"/>
        <text x="90" y="90" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="11" fill="#ffffff">Nutrifactor</text>
        <!-- Title VITAMAX -->
        <text x="90" y="118" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="18" fill="#1e3a8a">VITAMAX</text>
        <text x="90" y="136" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="16" fill="#dc2626">WOMEN</text>
        <text x="90" y="152" text-anchor="middle" font-family="sans-serif" font-weight="600" font-size="9" fill="#64748b">One A Day Multi</text>
        <!-- Runner Circle Graphic -->
        <circle cx="90" cy="185" r="24" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
        <path d="M85,175 L95,185 L90,198" stroke="#dc2626" stroke-width="3" fill="none"/>
        <!-- Bottom Pills Count -->
        <rect x="25" y="240" width="130" height="22" fill="#be123c"/>
        <text x="90" y="255" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="10" fill="#ffffff">30 TABLETS</text>
      </g>
    `
  },
  'bread-bakery': {
    title: 'BREAD & BAKERY',
    svg: `
      <!-- Dawn Bread Bag -->
      <g filter="url(#shadow)" transform="translate(130, 60)">
        <polygon points="55,0 85,0 70,30" fill="#dc2626"/>
        <rect x="10" y="30" width="140" height="270" rx="20" fill="#ea580c"/>
        <!-- Sunburst graphic -->
        <circle cx="80" cy="110" r="45" fill="#fef08a"/>
        <!-- Dawn text -->
        <rect x="25" y="90" width="110" height="40" rx="8" fill="#1d4ed8"/>
        <text x="80" y="118" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="22" fill="#ffffff">DAWN</text>
        <text x="80" y="148" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="15" fill="#1d4ed8">BREAD</text>
        <!-- Slices window -->
        <rect x="20" y="170" width="120" height="90" rx="8" fill="#fed7aa"/>
        <line x1="40" y1="170" x2="40" y2="260" stroke="#f97316" stroke-width="3"/>
        <line x1="70" y1="170" x2="70" y2="260" stroke="#f97316" stroke-width="3"/>
        <line x1="100" y1="170" x2="100" y2="260" stroke="#f97316" stroke-width="3"/>
        <line x1="120" y1="170" x2="120" y2="260" stroke="#f97316" stroke-width="3"/>
      </g>
      <!-- Chocolate Cupcake with Choco chips -->
      <g filter="url(#shadow)" transform="translate(260, 190)">
        <!-- Liner -->
        <polygon points="20,130 95,130 110,60 5,60" fill="#451a03"/>
        <!-- Cake Top -->
        <ellipse cx="57" cy="55" rx="55" ry="30" fill="#78350f"/>
        <!-- Cream Frosting -->
        <path d="M20,50 Q57,10 95,50 Z" fill="#fdf4ff"/>
        <!-- Chocolate chips -->
        <circle cx="45" cy="35" r="4" fill="#292524"/>
        <circle cx="65" cy="30" r="4" fill="#292524"/>
        <circle cx="55" cy="45" r="4" fill="#292524"/>
        <circle cx="75" cy="42" r="3" fill="#292524"/>
        <circle cx="35" cy="45" r="3" fill="#292524"/>
      </g>
    `
  },
  'toys': {
    title: 'TOYS',
    svg: `
      <!-- Building Blocks Castle -->
      <g filter="url(#shadow)" transform="translate(180, 80)">
        <rect x="30" y="70" width="140" height="40" fill="#2563eb"/>
        <rect x="40" y="30" width="50" height="40" fill="#dc2626"/>
        <rect x="110" y="30" width="50" height="40" fill="#16a34a"/>
        <polygon points="40,30 65,0 90,30" fill="#eab308"/>
        <polygon points="110,30 135,0 160,30" fill="#0284c7"/>
        <rect x="0" y="110" width="200" height="50" fill="#ca8a04"/>
        <rect x="20" y="160" width="60" height="50" fill="#16a34a"/>
        <rect x="120" y="160" width="60" height="50" fill="#ea580c"/>
      </g>
      <!-- Red Toy Truck -->
      <g filter="url(#shadow)" transform="translate(160, 220)">
        <rect x="0" y="40" width="90" height="70" rx="14" fill="#dc2626"/>
        <rect x="15" y="48" width="40" height="30" rx="4" fill="#bae6fd"/>
        <!-- Wheels -->
        <circle cx="25" cy="115" r="18" fill="#1e293b"/>
        <circle cx="25" cy="115" r="8" fill="#e2e8f0"/>
        <circle cx="75" cy="115" r="18" fill="#1e293b"/>
        <circle cx="75" cy="115" r="8" fill="#e2e8f0"/>
      </g>
      <!-- Rainbow Stacking Rings -->
      <g filter="url(#shadow)" transform="translate(265, 175)">
        <ellipse cx="50" cy="140" rx="50" ry="12" fill="#2563eb"/>
        <ellipse cx="50" cy="120" rx="44" ry="11" fill="#16a34a"/>
        <ellipse cx="50" cy="100" rx="38" ry="10" fill="#eab308"/>
        <ellipse cx="50" cy="80" rx="32" ry="9" fill="#ea580c"/>
        <ellipse cx="50" cy="62" rx="25" ry="8" fill="#dc2626"/>
        <circle cx="50" cy="35" r="18" fill="#dc2626"/>
      </g>
    `
  },
  'diabetic-products': {
    title: 'DIABETIC PRODUCTS',
    svg: `
      <!-- CareTouch Blood Glucose Kit Box -->
      <g filter="url(#shadow)" transform="translate(170, 75)">
        <rect x="0" y="0" width="170" height="230" rx="14" fill="#0284c7"/>
        <rect x="15" y="15" width="140" height="40" rx="6" fill="#0369a1"/>
        <text x="85" y="38" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="14" fill="#ffffff">CareTouch</text>
        <text x="85" y="75" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="12" fill="#f0f9ff">BLOOD GLUCOSE</text>
        <text x="85" y="92" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="10" fill="#bae6fd">MONITORING SYSTEM</text>
      </g>
      <!-- Digital Meter in front -->
      <g filter="url(#shadow)" transform="translate(210, 160)">
        <rect x="0" y="0" width="95" height="145" rx="32" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
        <!-- LCD screen -->
        <rect x="15" y="25" width="65" height="55" rx="6" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5"/>
        <text x="47" y="62" text-anchor="middle" font-family="monospace" font-weight="900" font-size="28" fill="#0f172a">104</text>
        <text x="47" y="74" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="8" fill="#64748b">mg/dL</text>
        <!-- Buttons -->
        <circle cx="35" cy="105" r="10" fill="#e2e8f0"/>
        <circle cx="60" cy="105" r="10" fill="#e2e8f0"/>
      </g>
      <!-- Test Strips Vials -->
      <g filter="url(#shadow)" transform="translate(320, 200)">
        <rect x="0" y="10" width="45" height="95" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
        <rect x="5" y="0" width="35" height="15" rx="4" fill="#0284c7"/>
        <rect x="5" y="35" width="35" height="40" fill="#0369a1"/>
      </g>
    `
  },
  'food-staples': {
    title: 'FOOD STAPLES',
    svg: `
      <!-- Turk Farms Olives Jar -->
      <g filter="url(#shadow)" transform="translate(95, 75)">
        <rect x="0" y="30" width="120" height="235" rx="16" fill="#fef08a" opacity="0.9" stroke="#cbd5e1" stroke-width="2"/>
        <!-- Black Lid -->
        <rect x="10" y="10" width="100" height="25" rx="6" fill="#0f172a"/>
        <!-- Stuffed Olives floating -->
        <circle cx="40" cy="80" r="16" fill="#65a30d"/>
        <circle cx="40" cy="80" r="5" fill="#dc2626"/>
        <circle cx="80" cy="95" r="16" fill="#65a30d"/>
        <circle cx="80" cy="95" r="5" fill="#dc2626"/>
        <circle cx="50" cy="200" r="16" fill="#65a30d"/>
        <circle cx="50" cy="200" r="5" fill="#dc2626"/>
        <circle cx="85" cy="220" r="16" fill="#65a30d"/>
        <circle cx="85" cy="220" r="5" fill="#dc2626"/>
        <!-- Label -->
        <rect x="5" y="115" width="110" height="70" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="60" y="138" text-anchor="middle" font-family="serif" font-weight="900" font-size="14" fill="#78350f">TURK FARMS</text>
        <text x="60" y="155" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="10" fill="#15803d">Green Olives</text>
        <text x="60" y="168" text-anchor="middle" font-family="sans-serif" font-weight="600" font-size="8" fill="#dc2626">Stuffed with Red Pepper</text>
      </g>
      <!-- Samyang Buldak 2x Spicy Ramen Pack -->
      <g filter="url(#shadow)" transform="translate(205, 125)">
        <rect x="0" y="0" width="195" height="175" rx="12" fill="#dc2626"/>
        <!-- Flame accent -->
        <polygon points="10,0 30,0 20,20" fill="#facc15"/>
        <polygon points="50,0 70,0 60,25" fill="#facc15"/>
        <polygon points="90,0 110,0 100,20" fill="#facc15"/>
        <text x="97" y="45" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="20" fill="#ffffff">SAMYANG</text>
        <rect x="25" y="55" width="145" height="32" rx="6" fill="#000000"/>
        <text x="97" y="78" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="16" fill="#facc15">2x SPICY BULDAK</text>
        <!-- Fiery chicken graphic placeholder -->
        <circle cx="50" cy="125" r="22" fill="#ffffff"/>
        <circle cx="50" cy="125" r="16" fill="#f97316"/>
        <!-- Bowl -->
        <ellipse cx="120" cy="130" rx="45" ry="22" fill="#0f172a"/>
        <ellipse cx="120" cy="125" rx="40" ry="18" fill="#ea580c"/>
      </g>
    `
  },
  'dairy': {
    title: 'DAIRY',
    svg: `
      <!-- Nestle MilkPak Carton -->
      <g filter="url(#shadow)" transform="translate(110, 65)">
        <rect x="0" y="30" width="135" height="260" rx="12" fill="#16a34a"/>
        <!-- Green lid cap -->
        <rect x="45" y="10" width="45" height="25" rx="6" fill="#15803d"/>
        <!-- House roof shape -->
        <polygon points="67,50 120,95 15,95" fill="#ffffff"/>
        <rect x="20" y="95" width="95" height="80" fill="#ffffff"/>
        <text x="67" y="80" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="12" fill="#15803d">Nestle</text>
        <text x="67" y="125" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="22" fill="#15803d">Milk</text>
        <text x="67" y="150" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="22" fill="#15803d">Pak</text>
        <!-- Meadow & Cow -->
        <rect x="5" y="195" width="125" height="85" rx="6" fill="#4ade80"/>
        <circle cx="35" cy="225" r="12" fill="#78350f"/>
      </g>
      <!-- Glass of fresh splashing milk -->
      <g filter="url(#shadow)" transform="translate(235, 150)">
        <polygon points="20,180 95,180 110,50 5,50" fill="#ffffff" opacity="0.95" stroke="#93c5fd" stroke-width="2"/>
        <ellipse cx="57" cy="50" rx="52" ry="14" fill="#ffffff"/>
        <!-- Splash crown -->
        <path d="M15,50 Q30,10 40,40 Q57,-5 65,40 Q80,10 95,50 Z" fill="#ffffff"/>
        <circle cx="57" cy="5" r="5" fill="#ffffff"/>
      </g>
    `
  },
  'men-care': {
    title: 'MEN & CARE',
    svg: `
      <!-- Philips Rotary Shaver -->
      <g filter="url(#shadow)" transform="translate(85, 75)">
        <rect x="15" y="60" width="75" height="220" rx="35" fill="#0f172a"/>
        <!-- 3-head shaver top -->
        <ellipse cx="52" cy="55" rx="42" ry="25" fill="#334155"/>
        <circle cx="35" cy="48" r="14" fill="#94a3b8" stroke="#cbd5e1" stroke-width="2"/>
        <circle cx="68" cy="48" r="14" fill="#94a3b8" stroke="#cbd5e1" stroke-width="2"/>
        <circle cx="52" cy="65" r="14" fill="#94a3b8" stroke="#cbd5e1" stroke-width="2"/>
        <!-- Power button -->
        <circle cx="52" cy="140" r="12" fill="#0284c7"/>
        <text x="52" y="240" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="10" fill="#ffffff">PHILIPS</text>
      </g>
      <!-- Nivea Men Shave Gel Spray Can -->
      <g filter="url(#shadow)" transform="translate(180, 70)">
        <rect x="10" y="30" width="75" height="250" rx="14" fill="#1e293b"/>
        <rect x="25" y="5" width="45" height="30" rx="6" fill="#334155"/>
        <!-- Nivea Men circle -->
        <circle cx="47" cy="85" r="24" fill="#1e3a8a"/>
        <text x="47" y="86" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="9" fill="#ffffff">NIVEA</text>
        <text x="47" y="96" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="8" fill="#93c5fd">MEN</text>
        <rect x="18" y="125" width="60" height="24" rx="4" fill="#0284c7"/>
        <text x="48" y="141" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="11" fill="#ffffff">DEEP</text>
        <text x="48" y="175" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="8" fill="#ffffff">CLEAN SHAVE</text>
      </g>
      <!-- Gillette Mach3 Blades Pack -->
      <g filter="url(#shadow)" transform="translate(265, 140)">
        <rect x="0" y="0" width="135" height="150" rx="12" fill="#0284c7"/>
        <text x="67" y="45" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="18" fill="#ffffff">Gillette</text>
        <text x="67" y="70" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="16" fill="#facc15">MACH 3</text>
        <rect x="15" y="85" width="105" height="40" rx="6" fill="#0f172a"/>
        <line x1="30" y1="97" x2="105" y2="97" stroke="#cbd5e1" stroke-width="2"/>
        <line x1="30" y1="105" x2="105" y2="105" stroke="#cbd5e1" stroke-width="2"/>
        <line x1="30" y1="113" x2="105" y2="113" stroke="#cbd5e1" stroke-width="2"/>
      </g>
    `
  },
  'feminine-care': {
    title: 'FEMININE CARE',
    svg: `
      <!-- Sincere Sanitary Napkins 8-pack -->
      <g filter="url(#shadow)" transform="translate(85, 100)">
        <rect x="0" y="0" width="170" height="210" rx="16" fill="#1e3a8a"/>
        <text x="85" y="55" text-anchor="middle" font-family="'Brush Script MT', cursive, sans-serif" font-weight="900" font-size="34" fill="#ffffff">Sincere</text>
        <rect x="15" y="140" width="70" height="45" rx="8" fill="#0284c7"/>
        <text x="50" y="160" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="16" fill="#ffffff">8</text>
        <text x="50" y="175" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="9" fill="#e0f2fe">MAXI THICK</text>
      </g>
      <!-- Embrace Maxi Sensitives Yellow Pack -->
      <g filter="url(#shadow)" transform="translate(230, 80)">
        <rect x="0" y="0" width="125" height="235" rx="14" fill="#facc15"/>
        <text x="62" y="45" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="20" fill="#78350f">embrace</text>
        <rect x="15" y="70" width="95" height="30" rx="6" fill="#7e22ce"/>
        <text x="62" y="90" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="11" fill="#ffffff">MAXI SENSITIVES</text>
        <!-- Blue Discount Badge -->
        <circle cx="62" cy="140" r="32" fill="#0284c7"/>
        <text x="62" y="135" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="11" fill="#ffffff">RS.</text>
        <text x="62" y="152" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="16" fill="#ffffff">50 OFF</text>
      </g>
      <!-- Pink Electric Trimmer -->
      <g filter="url(#shadow)" transform="translate(245, 175)">
        <rect x="0" y="30" width="65" height="120" rx="30" fill="#f472b6" stroke="#f43f5e" stroke-width="2"/>
        <rect x="10" y="10" width="45" height="25" rx="8" fill="#e2e8f0"/>
      </g>
    `
  },
  'herbal': {
    title: 'HERBAL',
    svg: `
      <!-- Qarshi Demaghi 98-S Bottle -->
      <g filter="url(#shadow)" transform="translate(160, 65)">
        <!-- White Ribbed Cap -->
        <rect x="35" y="0" width="110" height="40" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
        <line x1="50" y1="0" x2="50" y2="40" stroke="#cbd5e1" stroke-width="2"/>
        <line x1="70" y1="0" x2="70" y2="40" stroke="#cbd5e1" stroke-width="2"/>
        <line x1="90" y1="0" x2="90" y2="40" stroke="#cbd5e1" stroke-width="2"/>
        <line x1="110" y1="0" x2="110" y2="40" stroke="#cbd5e1" stroke-width="2"/>
        <line x1="130" y1="0" x2="130" y2="40" stroke="#cbd5e1" stroke-width="2"/>
        <!-- Bottle Body -->
        <rect x="15" y="40" width="150" height="260" rx="28" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
        <!-- Orange Qarshi Banner -->
        <rect x="18" y="100" width="144" height="105" fill="#ea580c"/>
        <!-- Qarshi Red Logo -->
        <rect x="58" y="85" width="65" height="28" rx="6" fill="#dc2626"/>
        <text x="90" y="103" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="12" fill="#ffffff">QARSHI</text>
        <!-- Demaghi Text -->
        <text x="90" y="145" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="20" fill="#ffffff">DEMAGHI</text>
        <text x="90" y="170" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="10" fill="#fef08a">Brain &amp; Nerve Tonic</text>
        <!-- 98-S Badge -->
        <rect x="55" y="225" width="70" height="24" rx="4" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5"/>
        <text x="90" y="242" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="13" fill="#0f172a">98-S</text>
      </g>
    `
  },
  'baby-care': {
    title: 'BABY CARE',
    svg: `
      <!-- Nexton Baby Cologne Bottle -->
      <g filter="url(#shadow)" transform="translate(130, 80)">
        <rect x="40" y="0" width="25" height="40" rx="4" fill="#facc15"/>
        <ellipse cx="52" cy="150" rx="55" ry="90" fill="#fef08a" opacity="0.95" stroke="#eab308" stroke-width="2"/>
        <text x="52" y="130" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="17" fill="#78350f">Nexton</text>
        <text x="52" y="150" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="10" fill="#dc2626">Baby Cologne</text>
      </g>
      <!-- Grooming Kit Dome with scissors & clippers -->
      <g filter="url(#shadow)" transform="translate(245, 100)">
        <!-- Clear dome top -->
        <path d="M10,120 Q50,0 90,120 Z" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2" opacity="0.9"/>
        <!-- Scissors handles inside -->
        <circle cx="35" cy="85" r="16" fill="#c084fc"/>
        <circle cx="65" cy="85" r="16" fill="#c084fc"/>
        <!-- Base container -->
        <rect x="5" y="120" width="90" height="90" rx="14" fill="#a855f7"/>
      </g>
    `
  },
  'baby-foods': {
    title: 'BABY FOODS',
    svg: `
      <!-- Cerelac Nature's Selection Box -->
      <g filter="url(#shadow)" transform="translate(125, 65)">
        <rect x="0" y="0" width="180" height="255" rx="12" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
        <rect x="45" y="15" width="90" height="35" rx="8" fill="#dc2626"/>
        <text x="90" y="38" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="16" fill="#ffffff">Cerelac</text>
        <!-- Nature's selection tag -->
        <rect x="25" y="65" width="130" height="60" rx="8" fill="#15803d"/>
        <text x="90" y="90" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff">NATURE'S</text>
        <text x="90" y="110" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="12" fill="#fef08a">SELECTION</text>
        <!-- Blue bear cartoon -->
        <circle cx="60" cy="180" r="22" fill="#3b82f6"/>
        <circle cx="48" cy="165" r="8" fill="#2563eb"/>
        <circle cx="72" cy="165" r="8" fill="#2563eb"/>
        <!-- Cereal bowl -->
        <ellipse cx="130" cy="190" rx="30" ry="16" fill="#ea580c"/>
      </g>
    `
  },
  'diapering-napping': {
    title: 'DIAPERING & NAPPING',
    svg: `
      <!-- Canbebe Pants Jumbo Pack Size 3 -->
      <g filter="url(#shadow)" transform="translate(135, 65)">
        <rect x="0" y="0" width="190" height="260" rx="18" fill="#6b21a8"/>
        <!-- White puffy cloud heart -->
        <path d="M40,110 C20,70 65,40 95,75 C125,40 170,70 150,110 C125,160 95,180 95,180 C95,180 65,160 40,110 Z" fill="#ffffff"/>
        <text x="95" y="115" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="20" fill="#581c87">canbebe</text>
        <rect x="65" y="125" width="60" height="20" rx="6" fill="#dc2626"/>
        <text x="95" y="139" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="11" fill="#ffffff">Pants</text>
        <!-- Size 3 badge -->
        <circle cx="150" cy="195" r="18" fill="#dc2626"/>
        <text x="150" y="202" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="16" fill="#ffffff">3</text>
        <!-- Diaper count -->
        <rect x="130" y="220" width="40" height="22" rx="4" fill="#0284c7"/>
        <text x="150" y="235" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="11" fill="#ffffff">62</text>
      </g>
    `
  },
  'laundry-household': {
    title: 'LAUNDRY & HOUSEHOLD',
    svg: `
      <!-- Surf Excel Bag -->
      <g filter="url(#shadow)" transform="translate(110, 75)">
        <rect x="0" y="0" width="130" height="240" rx="14" fill="#ea580c"/>
        <!-- Sunburst splash -->
        <circle cx="65" cy="110" r="45" fill="#facc15"/>
        <text x="65" y="95" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="22" fill="#1e3a8a">Surf</text>
        <text x="65" y="125" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="18" fill="#ffffff">excel</text>
      </g>
      <!-- Harpic 10x Max Clean Bottle -->
      <g filter="url(#shadow)" transform="translate(225, 105)">
        <path d="M25,0 L50,0 L65,50 L65,220 L0,220 L0,50 Z" fill="#1e40af"/>
        <!-- Red angled nozzle cap -->
        <polygon points="25,0 45,-25 60,-20 40,0" fill="#dc2626"/>
        <rect x="8" y="70" width="50" height="60" fill="#ffffff"/>
        <text x="33" y="100" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="13" fill="#dc2626">HARPIC</text>
        <text x="33" y="115" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="9" fill="#1e3a8a">10x MAX</text>
      </g>
      <!-- Sponge wipe wipes -->
      <g filter="url(#softShadow)" transform="translate(70, 220)">
        <polygon points="0,50 80,0 120,40 40,90" fill="#fde047"/>
        <polygon points="10,60 90,10 130,50 50,100" fill="#38bdf8" opacity="0.8"/>
      </g>
    `
  },
  'chocolates-snacks': {
    title: 'CHOCOLATES & SNACKS',
    svg: `
      <!-- Elit Truffle Pyramid Box with Blue Bow Ribbon -->
      <g filter="url(#shadow)" transform="translate(95, 80)">
        <polygon points="30,80 160,80 180,220 10,220" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
        <polygon points="95,0 160,80 30,80" fill="#f1f5f9"/>
        <!-- Blue Ribbon wrap -->
        <rect x="80" y="0" width="30" height="220" fill="#1d4ed8"/>
        <!-- Ribbon Bow at top -->
        <ellipse cx="75" cy="20" rx="20" ry="12" fill="#2563eb"/>
        <ellipse cx="115" cy="20" rx="20" ry="12" fill="#2563eb"/>
        <circle cx="95" cy="20" r="10" fill="#1e40af"/>
        <text x="95" y="145" text-anchor="middle" font-family="serif" font-weight="900" font-size="24" fill="#1e293b">truffle</text>
      </g>
      <!-- Reload Granola Bar -->
      <g filter="url(#shadow)" transform="translate(265, 120)">
        <rect x="0" y="0" width="70" height="190" rx="8" fill="#78350f"/>
        <rect x="8" y="25" width="54" height="35" fill="#dc2626"/>
        <text x="35" y="48" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="12" fill="#ffffff">Reload</text>
        <!-- Granola pieces -->
        <circle cx="25" cy="90" r="5" fill="#facc15"/>
        <circle cx="45" cy="95" r="6" fill="#fde047"/>
        <circle cx="35" cy="120" r="5" fill="#ca8a04"/>
        <circle cx="50" cy="140" r="5" fill="#881337"/>
      </g>
    `
  },
  'candies-bubble-gum': {
    title: 'CANDIES & BUBBLE GUM',
    svg: `
      <!-- Blue Polka Dot Bucket with Lollipops -->
      <g filter="url(#shadow)" transform="translate(160, 110)">
        <!-- Bucket -->
        <polygon points="15,190 125,190 140,80 0,80" fill="#0284c7"/>
        <circle cx="25" cy="110" r="7" fill="#ffffff"/>
        <circle cx="65" cy="105" r="7" fill="#ffffff"/>
        <circle cx="105" cy="115" r="7" fill="#ffffff"/>
        <circle cx="45" cy="145" r="7" fill="#ffffff"/>
        <circle cx="85" cy="145" r="7" fill="#ffffff"/>
        <!-- Lollipops sticks & heads -->
        <line x1="20" y1="90" x2="0" y2="10" stroke="#ffffff" stroke-width="5"/>
        <circle cx="0" cy="10" r="18" fill="#22c55e"/>
        <line x1="45" y1="90" x2="35" y2="0" stroke="#ffffff" stroke-width="5"/>
        <circle cx="35" cy="0" r="18" fill="#ea580c"/>
        <line x1="70" y1="90" x2="70" y2="-10" stroke="#ffffff" stroke-width="5"/>
        <circle cx="70" cy="-10" r="18" fill="#78350f"/>
        <line x1="95" y1="90" x2="105" y2="0" stroke="#ffffff" stroke-width="5"/>
        <circle cx="105" cy="0" r="18" fill="#fef08a"/>
        <line x1="120" y1="90" x2="140" y2="15" stroke="#ffffff" stroke-width="5"/>
        <circle cx="140" cy="15" r="18" fill="#dc2626"/>
      </g>
      <!-- Pink Bubble Gum Slabs in front -->
      <g filter="url(#shadow)" transform="translate(195, 230)">
        <rect x="0" y="25" width="80" height="40" rx="8" fill="#f43f5e"/>
        <rect x="25" y="0" width="80" height="40" rx="8" fill="#fb7185"/>
      </g>
    `
  },
  'breakfast': {
    title: 'BREAKFAST',
    svg: `
      <!-- Mango Jam Jar -->
      <g filter="url(#shadow)" transform="translate(100, 80)">
        <rect x="10" y="30" width="105" height="210" rx="14" fill="#ea580c" opacity="0.95" stroke="#cbd5e1" stroke-width="2"/>
        <rect x="20" y="10" width="85" height="25" rx="6" fill="#ca8a04"/>
        <!-- Label -->
        <rect x="15" y="75" width="95" height="85" rx="6" fill="#fef08a"/>
        <text x="62" y="100" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="12" fill="#78350f">FRUIT TREE</text>
        <text x="62" y="125" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="16" fill="#ea580c">MANGO</text>
        <text x="62" y="145" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="14" fill="#ca8a04">JAM</text>
      </g>
      <!-- Honey Jar -->
      <g filter="url(#shadow)" transform="translate(225, 95)">
        <polygon points="15,40 105,40 120,200 0,200" fill="#b45309" stroke="#cbd5e1" stroke-width="2"/>
        <rect x="25" y="20" width="70" height="25" rx="6" fill="#1e293b"/>
        <!-- Black gold label -->
        <rect x="20" y="80" width="80" height="80" rx="6" fill="#0f172a"/>
        <text x="60" y="105" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="10" fill="#facc15">NARAN</text>
        <text x="60" y="130" text-anchor="middle" font-family="serif" font-weight="900" font-size="18" fill="#ffffff">HONEY</text>
        <text x="60" y="148" text-anchor="middle" font-family="sans-serif" font-weight="600" font-size="8" fill="#fde047">Pure Pakistan</text>
      </g>
      <!-- Farm fresh eggs -->
      <g filter="url(#softShadow)" transform="translate(170, 230)">
        <ellipse cx="25" cy="30" rx="18" ry="24" fill="#fed7aa" transform="rotate(-15, 25, 30)"/>
        <ellipse cx="55" cy="25" rx="18" ry="24" fill="#fcd34d"/>
        <ellipse cx="85" cy="32" rx="18" ry="24" fill="#fed7aa" transform="rotate(15, 85, 32)"/>
      </g>
    `
  },
  'equipment-supplies': {
    title: 'EQUIPMENT & SUPPLIES',
    svg: `
      <!-- Citizen Digital BP Monitor -->
      <g filter="url(#shadow)" transform="translate(85, 120)">
        <rect x="0" y="0" width="165" height="150" rx="18" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/>
        <!-- Screen -->
        <rect x="15" y="20" width="95" height="75" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
        <text x="62" y="55" text-anchor="middle" font-family="monospace" font-weight="900" font-size="28" fill="#0f172a">120</text>
        <text x="62" y="85" text-anchor="middle" font-family="monospace" font-weight="900" font-size="24" fill="#0f172a">80</text>
        <!-- Start/Stop Button -->
        <rect x="118" y="30" width="35" height="55" rx="6" fill="#0284c7"/>
        <text x="135" y="62" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="9" fill="#ffffff">START</text>
      </g>
      <!-- Oppo Neoprene Wrist/Thumb Support Box -->
      <g filter="url(#shadow)" transform="translate(245, 85)">
        <rect x="0" y="0" width="150" height="230" rx="12" fill="#0d9488"/>
        <!-- Hand support photo placeholder -->
        <rect x="12" y="15" width="126" height="135" rx="8" fill="#ffffff"/>
        <!-- Beige support illustration -->
        <path d="M50,130 C40,90 45,50 75,40 C95,50 100,90 90,130 Z" fill="#fed7aa"/>
        <!-- Oppo Logo -->
        <rect x="25" y="170" width="100" height="35" rx="6" fill="#115e59"/>
        <text x="75" y="193" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="16" fill="#ffffff">OPPO</text>
      </g>
    `
  },
  'pet-care': {
    title: 'PET CARE',
    svg: `
      <!-- Golden retriever puppy & ginger cat with green bowl -->
      <g filter="url(#shadow)" transform="translate(100, 80)">
        <!-- Puppy silhouette/illustration -->
        <ellipse cx="80" cy="170" rx="55" ry="65" fill="#fef08a"/>
        <circle cx="80" cy="90" r="42" fill="#fde047"/>
        <!-- Puppy floppy ears -->
        <ellipse cx="45" cy="90" rx="12" ry="28" fill="#eab308"/>
        <ellipse cx="115" cy="90" rx="12" ry="28" fill="#eab308"/>
        <!-- Eyes & Nose -->
        <circle cx="70" cy="85" r="5" fill="#0f172a"/>
        <circle cx="90" cy="85" r="5" fill="#0f172a"/>
        <polygon points="75,98 85,98 80,105" fill="#0f172a"/>
      </g>
      <g filter="url(#shadow)" transform="translate(240, 100)">
        <!-- Ginger cat -->
        <ellipse cx="65" cy="150" rx="42" ry="50" fill="#f97316"/>
        <circle cx="65" cy="85" r="32" fill="#ea580c"/>
        <polygon points="45,65 52,40 60,65" fill="#c2410c"/>
        <polygon points="70,65 78,40 85,65" fill="#c2410c"/>
      </g>
      <!-- Green Food Bowl in front -->
      <g filter="url(#shadow)" transform="translate(190, 250)">
        <polygon points="15,45 105,45 115,10 5,10" fill="#22c55e"/>
        <ellipse cx="60" cy="10" rx="55" ry="12" fill="#16a34a"/>
        <ellipse cx="60" cy="10" rx="45" ry="9" fill="#78350f"/>
      </g>
    `
  },
  'all-departments': {
    title: 'ALL DEPARTMENTS',
    svg: `
      <!-- Montage of authentic Jan Chemist department icons and products -->
      <g filter="url(#shadow)" transform="translate(75, 75)">
        <rect x="0" y="0" width="160" height="110" rx="16" fill="#ecfdf5" stroke="#10b981" stroke-width="2"/>
        <text x="80" y="45" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="14" fill="#065f46">PHARMACY</text>
        <text x="80" y="70" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="11" fill="#047857">&amp; COSMETICS</text>
      </g>
      <g filter="url(#shadow)" transform="translate(265, 75)">
        <rect x="0" y="0" width="160" height="110" rx="16" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="80" y="45" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="14" fill="#1e40af">GROCERY</text>
        <text x="80" y="70" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="11" fill="#2563eb">&amp; BEVERAGES</text>
      </g>
      <g filter="url(#shadow)" transform="translate(75, 205)">
        <rect x="0" y="0" width="160" height="110" rx="16" fill="#fdf4ff" stroke="#d946ef" stroke-width="2"/>
        <text x="80" y="45" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="14" fill="#86198f">BABY &amp; TOYS</text>
        <text x="80" y="70" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="11" fill="#a21caf">HYGIENE &amp; CARE</text>
      </g>
      <g filter="url(#shadow)" transform="translate(265, 205)">
        <rect x="0" y="0" width="160" height="110" rx="16" fill="#fffbeb" stroke="#f59e0b" stroke-width="2"/>
        <text x="80" y="45" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="14" fill="#92400e">HOUSEHOLD</text>
        <text x="80" y="70" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="11" fill="#b45309">&amp; APPLIANCES</text>
      </g>
      <!-- Center Gold Authenticity Seal -->
      <g filter="url(#shadow)" transform="translate(200, 140)">
        <circle cx="50" cy="50" r="45" fill="#f59e0b" stroke="#ffffff" stroke-width="4"/>
        <circle cx="50" cy="50" r="38" fill="#15803d"/>
        <text x="50" y="46" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="11" fill="#ffffff">100%</text>
        <text x="50" y="60" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="9" fill="#fde68a">ORIGINAL</text>
      </g>
    `
  }
};

// Aliases for 10 core departments in departments.ts
cards['cosmetics'] = { title: 'COSMETICS', svg: cards['skin-care'].svg };
cards['pharmacy'] = { title: 'PHARMACY', svg: cards['vitamins-supplements'].svg };
cards['grocery'] = { title: 'GROCERY & STAPLES', svg: cards['food-staples'].svg };
cards['drinks'] = { title: 'BEVERAGES', svg: cards['beverages'].svg };
cards['toiletries'] = { title: 'PERSONAL CARE', svg: cards['personal-care'].svg };
cards['lingerie'] = { title: 'FEMININE CARE', svg: cards['feminine-care'].svg };
cards['toys'] = { title: 'TOYS & KIDS', svg: cards['toys'].svg };
cards['birthday-items'] = { title: 'CHOCOLATES & SNACKS', svg: cards['chocolates-snacks'].svg };
cards['crockery'] = { title: 'LAUNDRY & HOUSEHOLD', svg: cards['laundry-household'].svg };
cards['electronics'] = { title: 'EQUIPMENT & SUPPLIES', svg: cards['equipment-supplies'].svg };

for (const [key, val] of Object.entries(cards)) {
  const filePath = path.join(outDir, `${key}.svg`);
  const content = createCardSvg(val.title, val.svg);
  fs.writeFileSync(filePath, content, 'utf8');
}

console.log(`Successfully generated ${Object.keys(cards).length} department banner SVGs in ${outDir}`);
