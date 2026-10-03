import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const PUBLIC_DIR = path.resolve('public');
const SCREENSHOTS_DIR = path.join(PUBLIC_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const iconSvgPath = path.join(PUBLIC_DIR, 'icon.svg');
const iconSvgBuffer = fs.readFileSync(iconSvgPath);

async function generateAssets() {
  console.log('Generating PWA icons and screenshot assets...');

  // 1. Standard PNG Icons (purpose: any)
  await sharp(iconSvgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'pwa-192x192.png'));
  console.log('✓ Created pwa-192x192.png');

  await sharp(iconSvgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'pwa-512x512.png'));
  console.log('✓ Created pwa-512x512.png');

  // 2. Apple Touch Icon (180x180)
  await sharp(iconSvgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
  console.log('✓ Created apple-touch-icon.png');

  // 3. Favicon PNG (64x64 & 32x32)
  await sharp(iconSvgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(PUBLIC_DIR, 'favicon.png'));
  console.log('✓ Created favicon.png');

  // 4. Maskable Icons (purpose: maskable)
  // Android crops maskable icons to arbitrary shapes (circles, squircles).
  // Safe zone rule: keep icon elements inside central 80% circle (10-15% padding).
  // Full-bleed green background #248243 with centered padded icon.

  // Maskable 192x192: 154x154 icon on 192x192 background
  const inner192 = await sharp(iconSvgBuffer).resize(150, 150).png().toBuffer();
  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 36, g: 130, b: 67, alpha: 1 } // #248243
    }
  })
    .composite([{ input: inner192, gravity: 'center' }])
    .png()
    .toFile(path.join(PUBLIC_DIR, 'pwa-maskable-192x192.png'));
  console.log('✓ Created pwa-maskable-192x192.png');

  // Maskable 512x512: 410x410 icon on 512x512 background
  const inner512 = await sharp(iconSvgBuffer).resize(410, 410).png().toBuffer();
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 36, g: 130, b: 67, alpha: 1 } // #248243
    }
  })
    .composite([{ input: inner512, gravity: 'center' }])
    .png()
    .toFile(path.join(PUBLIC_DIR, 'pwa-maskable-512x512.png'));
  console.log('✓ Created pwa-maskable-512x512.png');

  // 5. Screenshots for Richer Install UI ("App Ready")
  // Rich Install UI in Chromium requires screenshots with form_factor: wide & narrow

  // Desktop Wide Screenshot (1280x720)
  const desktopSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <defs>
      <linearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#166534" />
        <stop offset="50%" stop-color="#248243" />
        <stop offset="100%" stop-color="#0f766e" />
      </linearGradient>
      <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#047857" />
        <stop offset="100%" stop-color="#064e3b" />
      </linearGradient>
    </defs>
    <!-- Background -->
    <rect width="1280" height="720" fill="#f8fafc"/>
    <!-- Top Announcement Bar -->
    <rect width="1280" height="34" fill="url(#headerGrad)"/>
    <text x="40" y="22" fill="#ffffff" font-size="13" font-family="'Plus Jakarta Sans', sans-serif" font-weight="600">
      “With us its original” — 100% Genuine Pharmacy &amp; Superstore • Open 8:00 AM - 1:00 AM 7 Days a Week
    </text>
    <text x="1100" y="22" fill="#ffffff" font-size="13" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700">
      WhatsApp: 03205868464
    </text>

    <!-- Navbar -->
    <rect y="34" width="1280" height="74" fill="#ffffff"/>
    <line x1="0" y1="108" x2="1280" y2="108" stroke="#e2e8f0" stroke-width="1"/>
    <!-- Logo -->
    <rect x="40" y="48" width="46" height="46" rx="10" fill="#248243"/>
    <text x="50" y="77" fill="#ffffff" font-size="20" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900">JC</text>
    <text x="96" y="70" fill="#0f172a" font-size="20" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900">JAN CHEMIST</text>
    <text x="96" y="86" fill="#166534" font-size="11" font-family="'Plus Jakarta Sans', sans-serif" font-style="italic" font-weight="700">With us its original</text>
    <!-- Search Bar Mock -->
    <rect x="360" y="50" width="500" height="42" rx="21" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
    <text x="390" y="76" fill="#64748b" font-size="13" font-family="'Plus Jakarta Sans', sans-serif">Search 10 departments: Cosmetics, Grocery, Drinks, Medicines...</text>
    <!-- Buttons -->
    <rect x="880" y="52" width="170" height="38" rx="10" fill="#dc2626"/>
    <text x="900" y="76" fill="#ffffff" font-size="13" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700">Upload Prescription</text>
    <rect x="1065" y="52" width="110" height="38" rx="10" fill="#248243"/>
    <text x="1090" y="76" fill="#ffffff" font-size="13" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700">🛒 Cart</text>

    <!-- Hero Card -->
    <g transform="translate(40, 126)">
      <rect width="1200" height="240" rx="20" fill="url(#heroGrad)"/>
      <text x="50" y="75" fill="#facc15" font-size="13" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" letter-spacing="2">100% ORIGINAL GUARANTEED</text>
      <text x="50" y="125" fill="#ffffff" font-size="34" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900">Your Complete Superstore &amp; Trusted Pharmacy</text>
      <text x="50" y="165" fill="#d1fae5" font-size="15" font-family="'Plus Jakarta Sans', sans-serif">
        Order cosmetics, grocery, drinks, baby care &amp; prescription medicines via WhatsApp hotline 03205868464.
      </text>
      <rect x="50" y="185" width="220" height="38" rx="10" fill="#facc15"/>
      <text x="75" y="209" fill="#0f172a" font-size="14" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800">Shop 10 Departments</text>
    </g>

    <!-- Departments row -->
    <g transform="translate(40, 390)">
      <text x="0" y="25" fill="#0f172a" font-size="20" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800">Featured Departments</text>
      <!-- Department Pills -->
      <rect x="0" y="45" width="110" height="40" rx="10" fill="#248243"/>
      <text x="25" y="70" fill="#ffffff" font-size="13" font-weight="700" font-family="'Plus Jakarta Sans', sans-serif">All Items</text>
      <rect x="120" y="45" width="120" height="40" rx="10" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="145" y="70" fill="#334155" font-size="13" font-weight="600" font-family="'Plus Jakarta Sans', sans-serif">Cosmetics</text>
      <rect x="250" y="45" width="110" height="40" rx="10" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="278" y="70" fill="#334155" font-size="13" font-weight="600" font-family="'Plus Jakarta Sans', sans-serif">Grocery</text>
      <rect x="370" y="45" width="110" height="40" rx="10" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="400" y="70" fill="#334155" font-size="13" font-weight="600" font-family="'Plus Jakarta Sans', sans-serif">Drinks</text>
      <rect x="490" y="45" width="130" height="40" rx="10" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="515" y="70" fill="#334155" font-size="13" font-weight="600" font-family="'Plus Jakarta Sans', sans-serif">Pharmacy (Rx)</text>
      <rect x="630" y="45" width="110" height="40" rx="10" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="655" y="70" fill="#334155" font-size="13" font-weight="600" font-family="'Plus Jakarta Sans', sans-serif">Toiletries</text>
      <rect x="750" y="45" width="100" height="40" rx="10" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="780" y="70" fill="#334155" font-size="13" font-weight="600" font-family="'Plus Jakarta Sans', sans-serif">Toys</text>
      <rect x="860" y="45" width="130" height="40" rx="10" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="880" y="70" fill="#334155" font-size="13" font-weight="600" font-family="'Plus Jakarta Sans', sans-serif">Birthday Items</text>
      <rect x="1000" y="45" width="110" height="40" rx="10" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="1025" y="70" fill="#334155" font-size="13" font-weight="600" font-family="'Plus Jakarta Sans', sans-serif">Crockery</text>
    </g>

    <!-- Product Grid Mock -->
    <g transform="translate(40, 500)">
      <!-- Card 1 -->
      <rect x="0" y="0" width="280" height="190" rx="14" fill="#ffffff" stroke="#e2e8f0"/>
      <rect x="15" y="15" width="70" height="22" rx="4" fill="#dcfce7"/>
      <text x="25" y="30" fill="#166534" font-size="10" font-weight="800" font-family="'Plus Jakarta Sans', sans-serif">ORIGINAL</text>
      <text x="15" y="75" fill="#0f172a" font-size="15" font-weight="800" font-family="'Plus Jakarta Sans', sans-serif">Panadol Extra 500mg/65mg</text>
      <text x="15" y="98" fill="#64748b" font-size="12" font-family="'Plus Jakarta Sans', sans-serif">GSK • 100 Tablets Box</text>
      <text x="15" y="145" fill="#166534" font-size="17" font-weight="800" font-family="'Plus Jakarta Sans', sans-serif">Rs. 450</text>
      <rect x="150" y="125" width="115" height="34" rx="8" fill="#248243"/>
      <text x="175" y="147" fill="#ffffff" font-size="12" font-weight="700" font-family="'Plus Jakarta Sans', sans-serif">Add to Cart</text>

      <!-- Card 2 -->
      <rect x="306" y="0" width="280" height="190" rx="14" fill="#ffffff" stroke="#e2e8f0"/>
      <rect x="321" y="15" width="70" height="22" rx="4" fill="#dcfce7"/>
      <text x="331" y="30" fill="#166534" font-size="10" font-weight="800" font-family="'Plus Jakarta Sans', sans-serif">ORIGINAL</text>
      <text x="321" y="75" fill="#0f172a" font-size="15" font-weight="800" font-family="'Plus Jakarta Sans', sans-serif">L'Oreal Paris Hyaluronic Serum</text>
      <text x="321" y="98" fill="#64748b" font-size="12" font-family="'Plus Jakarta Sans', sans-serif">Cosmetics • 30ml Dropper</text>
      <text x="321" y="145" fill="#166534" font-size="17" font-weight="800" font-family="'Plus Jakarta Sans', sans-serif">Rs. 3,850</text>
      <rect x="456" y="125" width="115" height="34" rx="8" fill="#248243"/>
      <text x="481" y="147" fill="#ffffff" font-size="12" font-weight="700" font-family="'Plus Jakarta Sans', sans-serif">Add to Cart</text>

      <!-- Card 3 -->
      <rect x="612" y="0" width="280" height="190" rx="14" fill="#ffffff" stroke="#e2e8f0"/>
      <rect x="627" y="15" width="70" height="22" rx="4" fill="#dcfce7"/>
      <text x="637" y="30" fill="#166534" font-size="10" font-weight="800" font-family="'Plus Jakarta Sans', sans-serif">ORIGINAL</text>
      <text x="627" y="75" fill="#0f172a" font-size="15" font-weight="800" font-family="'Plus Jakarta Sans', sans-serif">Nestle Everyday Milk Powder</text>
      <text x="627" y="98" fill="#64748b" font-size="12" font-family="'Plus Jakarta Sans', sans-serif">Grocery • 900g Pouch</text>
      <text x="627" y="145" fill="#166534" font-size="17" font-weight="800" font-family="'Plus Jakarta Sans', sans-serif">Rs. 1,650</text>
      <rect x="762" y="125" width="115" height="34" rx="8" fill="#248243"/>
      <text x="787" y="147" fill="#ffffff" font-size="12" font-weight="700" font-family="'Plus Jakarta Sans', sans-serif">Add to Cart</text>

      <!-- Card 4 -->
      <rect x="918" y="0" width="280" height="190" rx="14" fill="#ffffff" stroke="#e2e8f0"/>
      <rect x="933" y="15" width="70" height="22" rx="4" fill="#dcfce7"/>
      <text x="943" y="30" fill="#166534" font-size="10" font-weight="800" font-family="'Plus Jakarta Sans', sans-serif">ORIGINAL</text>
      <text x="933" y="75" fill="#0f172a" font-size="15" font-weight="800" font-family="'Plus Jakarta Sans', sans-serif">Red Bull Energy Drink</text>
      <text x="933" y="98" fill="#64748b" font-size="12" font-family="'Plus Jakarta Sans', sans-serif">Drinks • 250ml Can</text>
      <text x="933" y="145" fill="#166534" font-size="17" font-weight="800" font-family="'Plus Jakarta Sans', sans-serif">Rs. 420</text>
      <rect x="1068" y="125" width="115" height="34" rx="8" fill="#248243"/>
      <text x="1093" y="147" fill="#ffffff" font-size="12" font-weight="700" font-family="'Plus Jakarta Sans', sans-serif">Add to Cart</text>
    </g>
  </svg>
  `;

  await sharp(Buffer.from(desktopSvg))
    .resize(1280, 720)
    .png()
    .toFile(path.join(SCREENSHOTS_DIR, 'desktop-preview.png'));
  console.log('✓ Created screenshots/desktop-preview.png');

  // Mobile Narrow Screenshot (750x1334)
  const mobileSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="750" height="1334" viewBox="0 0 750 1334">
    <defs>
      <linearGradient id="mHead" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#166534" />
        <stop offset="100%" stop-color="#047857" />
      </linearGradient>
      <linearGradient id="mHero" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#047857" />
        <stop offset="100%" stop-color="#064e3b" />
      </linearGradient>
    </defs>
    <!-- Background -->
    <rect width="750" height="1334" fill="#f8fafc"/>
    <!-- Top Bar -->
    <rect width="750" height="50" fill="url(#mHead)"/>
    <text x="30" y="32" fill="#ffffff" font-size="20" font-family="'Plus Jakarta Sans', sans-serif" font-weight="700">
      “With us its original” • 03205868464
    </text>

    <!-- Header -->
    <rect y="50" width="750" height="110" fill="#ffffff"/>
    <line x1="0" y1="160" x2="750" y2="160" stroke="#e2e8f0" stroke-width="1"/>
    <!-- Logo Badge -->
    <rect x="30" y="68" width="60" height="60" rx="14" fill="#248243"/>
    <text x="44" y="108" fill="#ffffff" font-size="28" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900">JC</text>
    <text x="105" y="95" fill="#0f172a" font-size="28" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900">JAN CHEMIST</text>
    <text x="105" y="118" fill="#166534" font-size="15" font-family="'Plus Jakarta Sans', sans-serif" font-style="italic" font-weight="700">With us its original</text>
    <rect x="580" y="70" width="135" height="55" rx="14" fill="#248243"/>
    <text x="615" y="105" fill="#ffffff" font-size="20" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800">🛒 Cart</text>

    <!-- Search input -->
    <rect x="30" y="180" width="690" height="70" rx="20" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="70" y="223" fill="#64748b" font-size="22" font-family="'Plus Jakarta Sans', sans-serif">Search 10 departments: Cosmetics, Grocery, Medicines...</text>

    <!-- Install App Banner -->
    <rect x="30" y="270" width="690" height="85" rx="20" fill="#166534"/>
    <text x="60" y="315" fill="#ffffff" font-size="24" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800">📲 Download Jan Chemist App</text>
    <text x="60" y="340" fill="#bbf7d0" font-size="16" font-family="'Plus Jakarta Sans', sans-serif">1-Tap WhatsApp orders &amp; offline inventory</text>
    <rect x="560" y="285" width="135" height="55" rx="14" fill="#facc15"/>
    <text x="590" y="320" fill="#0f172a" font-size="20" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900">Install</text>

    <!-- Hero Card -->
    <rect x="30" y="380" width="690" height="260" rx="24" fill="url(#mHero)"/>
    <text x="60" y="435" fill="#facc15" font-size="18" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" letter-spacing="2">100% ORIGINAL GUARANTEED</text>
    <text x="60" y="490" fill="#ffffff" font-size="34" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900">Your Complete Superstore</text>
    <text x="60" y="530" fill="#ffffff" font-size="34" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900">&amp; Trusted Pharmacy</text>
    <text x="60" y="575" fill="#d1fae5" font-size="20" font-family="'Plus Jakarta Sans', sans-serif">WhatsApp: 03205868464 • 8 AM to 1 AM</text>
    <rect x="60" y="595" width="310" height="60" rx="14" fill="#dc2626"/>
    <text x="90" y="633" fill="#ffffff" font-size="22" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800">Upload Prescription</text>

    <!-- Department Carousel -->
    <text x="30" y="690" fill="#0f172a" font-size="26" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800">Explore Departments</text>
    <g transform="translate(30, 715)">
      <rect x="0" y="0" width="140" height="55" rx="14" fill="#248243"/>
      <text x="35" y="35" fill="#ffffff" font-size="18" font-weight="700" font-family="'Plus Jakarta Sans', sans-serif">All Items</text>
      <rect x="155" y="0" width="150" height="55" rx="14" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="180" y="35" fill="#334155" font-size="18" font-weight="600" font-family="'Plus Jakarta Sans', sans-serif">Cosmetics</text>
      <rect x="320" y="0" width="135" height="55" rx="14" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="345" y="35" fill="#334155" font-size="18" font-weight="600" font-family="'Plus Jakarta Sans', sans-serif">Grocery</text>
      <rect x="470" y="0" width="135" height="55" rx="14" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="500" y="35" fill="#334155" font-size="18" font-weight="600" font-family="'Plus Jakarta Sans', sans-serif">Drinks</text>
      <rect x="620" y="0" width="135" height="55" rx="14" fill="#ffffff" stroke="#cbd5e1"/>
      <text x="645" y="35" fill="#334155" font-size="18" font-weight="600" font-family="'Plus Jakarta Sans', sans-serif">Pharmacy</text>
    </g>

    <!-- Product list -->
    <g transform="translate(30, 810)">
      <!-- Item 1 -->
      <rect x="0" y="0" width="690" height="150" rx="20" fill="#ffffff" stroke="#e2e8f0"/>
      <text x="25" y="45" fill="#166534" font-size="14" font-weight="800" font-family="'Plus Jakarta Sans', sans-serif">100% ORIGINAL</text>
      <text x="25" y="78" fill="#0f172a" font-size="22" font-weight="800" font-family="'Plus Jakarta Sans', sans-serif">Panadol Extra (GSK 100 Tabs)</text>
      <text x="25" y="112" fill="#64748b" font-size="18" font-family="'Plus Jakarta Sans', sans-serif">Pharmacy • Paracetamol 500mg + Caffeine 65mg</text>
      <text x="25" y="140" fill="#166534" font-size="24" font-weight="900" font-family="'Plus Jakarta Sans', sans-serif">Rs. 450</text>
      <rect x="490" y="80" width="175" height="52" rx="12" fill="#248243"/>
      <text x="525" y="113" fill="#ffffff" font-size="18" font-weight="800" font-family="'Plus Jakarta Sans', sans-serif">Add to Cart</text>

      <!-- Item 2 -->
      <g transform="translate(0, 175)">
        <rect x="0" y="0" width="690" height="150" rx="20" fill="#ffffff" stroke="#e2e8f0"/>
        <text x="25" y="45" fill="#166534" font-size="14" font-weight="800" font-family="'Plus Jakarta Sans', sans-serif">100% ORIGINAL</text>
        <text x="25" y="78" fill="#0f172a" font-size="22" font-weight="800" font-family="'Plus Jakarta Sans', sans-serif">L'Oreal Paris Revitalift Serum</text>
        <text x="25" y="112" fill="#64748b" font-size="18" font-family="'Plus Jakarta Sans', sans-serif">Cosmetics • 1.5% Pure Hyaluronic Acid 30ml</text>
        <text x="25" y="140" fill="#166534" font-size="24" font-weight="900" font-family="'Plus Jakarta Sans', sans-serif">Rs. 3,850</text>
        <rect x="490" y="80" width="175" height="52" rx="12" fill="#248243"/>
        <text x="525" y="113" fill="#ffffff" font-size="18" font-weight="800" font-family="'Plus Jakarta Sans', sans-serif">Add to Cart</text>
      </g>

      <!-- Item 3 -->
      <g transform="translate(0, 350)">
        <rect x="0" y="0" width="690" height="150" rx="20" fill="#ffffff" stroke="#e2e8f0"/>
        <text x="25" y="45" fill="#166534" font-size="14" font-weight="800" font-family="'Plus Jakarta Sans', sans-serif">100% ORIGINAL</text>
        <text x="25" y="78" fill="#0f172a" font-size="22" font-weight="800" font-family="'Plus Jakarta Sans', sans-serif">Nestle Everyday Milk Powder</text>
        <text x="25" y="112" fill="#64748b" font-size="18" font-family="'Plus Jakarta Sans', sans-serif">Grocery • 900g Sealed Pouch</text>
        <text x="25" y="140" fill="#166534" font-size="24" font-weight="900" font-family="'Plus Jakarta Sans', sans-serif">Rs. 1,650</text>
        <rect x="490" y="80" width="175" height="52" rx="12" fill="#248243"/>
        <text x="525" y="113" fill="#ffffff" font-size="18" font-weight="800" font-family="'Plus Jakarta Sans', sans-serif">Add to Cart</text>
      </g>
    </g>
  </svg>
  `;

  await sharp(Buffer.from(mobileSvg))
    .resize(750, 1334)
    .png()
    .toFile(path.join(SCREENSHOTS_DIR, 'mobile-preview.png'));
  console.log('✓ Created screenshots/mobile-preview.png');

  console.log('All PWA assets successfully created!');
}

generateAssets().catch(err => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
