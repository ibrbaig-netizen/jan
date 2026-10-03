import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// High body size limit to support photo uploads of prescriptions
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Persistent directory for data storage
const DATA_DIR = path.resolve('data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

const PRESCRIPTIONS_FILE = path.join(DATA_DIR, 'prescriptions.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

interface StoredPrescription {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  notes?: string;
  urgency: 'standard' | 'urgent';
  prescriptionImage: string;
  fileName?: string;
  fileSize?: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'packed' | 'delivered' | 'cancelled';
  quoteAmount?: number;
  pharmacistNotes?: string;
}

interface StoredOrder {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  notes?: string;
  paymentMethod?: string;
  prescriptionImage?: string;
  prescriptionFileName?: string;
  prescriptionNotes?: string;
  whatsappMessage?: string;
  items: any[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  status: string;
}

// Initial sample prescriptions if file does not exist
const INITIAL_PRESCRIPTIONS: StoredPrescription[] = [
  {
    id: 'rx-101',
    customerName: 'Muhammad Tariq',
    phone: '03205868464',
    address: 'House # 42, Street 7, F-8/2, Islamabad',
    prescriptionImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600',
    fileName: 'prescription-dr-naveed.jpg',
    fileSize: '412 KB',
    notes: 'Prescription for blood pressure and cholesterol: Lipitor 20mg (1x daily at night) and Concor 5mg. Please check expiry dates.',
    urgency: 'urgent',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'pending',
    quoteAmount: 2450
  },
  {
    id: 'rx-102',
    customerName: 'Ayesha Siddiqui',
    phone: '03219876543',
    address: 'Flat 304, Green Heights, Gulberg III, Lahore',
    prescriptionImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600',
    fileName: 'rx_augmentin_syrup.jpg',
    fileSize: '680 KB',
    notes: 'Doctor prescribed Augmentin 625mg for 5 days + Panadol drops for infant baby. Needs original GlaxoSmithKline pack.',
    urgency: 'standard',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: 'reviewed',
    quoteAmount: 1890
  }
];

function loadPrescriptions(): StoredPrescription[] {
  try {
    if (fs.existsSync(PRESCRIPTIONS_FILE)) {
      const data = fs.readFileSync(PRESCRIPTIONS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading prescriptions file:', err);
  }
  return INITIAL_PRESCRIPTIONS;
}

function savePrescriptions(prescriptions: StoredPrescription[]) {
  try {
    fs.writeFileSync(PRESCRIPTIONS_FILE, JSON.stringify(prescriptions, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing prescriptions file:', err);
  }
}

function loadOrders(): StoredOrder[] {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading orders file:', err);
  }
  return [];
}

function saveOrders(orders: StoredOrder[]) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing orders file:', err);
  }
}

// In-memory cache
let inMemoryPrescriptions = loadPrescriptions();
let inMemoryOrders = loadOrders();

// -------------------------------------------------------------
// PRESCRIPTION MODULE APIS
// -------------------------------------------------------------

// GET all prescriptions (for Pharmacist Admin Portal)
app.get('/api/prescriptions', (_req, res) => {
  res.json(inMemoryPrescriptions);
});

// POST new prescription upload from customer
app.post('/api/prescriptions', (req, res) => {
  try {
    const {
      customerName,
      phone,
      address,
      notes,
      urgency = 'standard',
      prescriptionImage,
      fileName,
      fileSize
    } = req.body;

    if (!customerName || !phone) {
      return res.status(400).json({ error: 'Customer name and phone number are required' });
    }

    const id = `rx-${Date.now().toString().slice(-6)}`;
    const newRx: StoredPrescription = {
      id,
      customerName: String(customerName).trim(),
      phone: String(phone).trim(),
      address: String(address || '').trim(),
      notes: notes ? String(notes).trim() : '',
      urgency: urgency === 'urgent' ? 'urgent' : 'standard',
      prescriptionImage: prescriptionImage || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600',
      fileName: fileName || `prescription-${id}.jpg`,
      fileSize: fileSize || 'Uploaded',
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    inMemoryPrescriptions.unshift(newRx);
    savePrescriptions(inMemoryPrescriptions);

    const host = req.get('host') || 'localhost:3000';
    const proto = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const viewUrl = `${proto}://${host}/api/prescriptions/view/${id}`;
    const imageUrl = `${proto}://${host}/api/prescriptions/${id}/image`;

    return res.status(201).json({
      success: true,
      id,
      viewUrl,
      imageUrl,
      prescription: newRx
    });
  } catch (error: any) {
    console.error('Error saving prescription:', error);
    return res.status(500).json({ error: error.message || 'Failed to save prescription' });
  }
});

// GET specific prescription
app.get('/api/prescriptions/:id', (req, res) => {
  const rx = inMemoryPrescriptions.find(p => p.id === req.params.id);
  if (!rx) {
    return res.status(404).json({ error: 'Prescription not found' });
  }
  return res.json(rx);
});

// GET direct prescription image binary stream (for WhatsApp preview / direct image rendering)
app.get('/api/prescriptions/:id/image', (req, res) => {
  const rx = inMemoryPrescriptions.find(p => p.id === req.params.id);
  if (!rx || !rx.prescriptionImage) {
    return res.redirect('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600');
  }

  const imgData = rx.prescriptionImage;

  // Handle data URL (data:image/jpeg;base64,...)
  if (imgData.startsWith('data:')) {
    const matches = imgData.match(/^data:([^;]+);base64,(.+)$/);
    if (matches && matches[2]) {
      const mime = matches[1] || 'image/jpeg';
      const buffer = Buffer.from(matches[2], 'base64');
      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Disposition', `inline; filename="${rx.fileName || 'prescription.jpg'}"`);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(buffer);
    }
  }

  // Handle remote URL
  return res.redirect(imgData);
});

// GET standalone web view page for prescription (for pharmacist/customer 1-click review)
app.get('/api/prescriptions/view/:id', (req, res) => {
  const rx = inMemoryPrescriptions.find(p => p.id === req.params.id);
  if (!rx) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Prescription Not Found | Jan Chemist</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:50px;">
          <h2>Prescription Not Found</h2>
          <p>The requested prescription may have expired or been removed.</p>
        </body>
      </html>
    `);
  }

  const host = req.get('host') || 'localhost:3000';
  const proto = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const directImgUrl = `${proto}://${host}/api/prescriptions/${rx.id}/image`;
  
  // Normalize patient phone to international format without leading 0
  let normalizedPatientPhone = String(rx.phone || '').replace(/[^0-9]/g, '');
  if (normalizedPatientPhone.startsWith('0')) {
    normalizedPatientPhone = '92' + normalizedPatientPhone.slice(1);
  } else if (!normalizedPatientPhone.startsWith('92') && (normalizedPatientPhone.length === 10 || normalizedPatientPhone.startsWith('3'))) {
    normalizedPatientPhone = '92' + normalizedPatientPhone;
  }
  const cleanPhone = normalizedPatientPhone;
  const storePhone = '923205868464';

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jan Chemist - Prescription ${rx.id} | With Us It's Original</title>
  <meta name="description" content="Prescription verification for ${rx.customerName}. Jan Chemist Superstore & Pharmacy.">
  <meta property="og:title" content="Prescription ${rx.id} - Jan Chemist Pharmacy">
  <meta property="og:description" content="Patient: ${rx.customerName} • Phone: ${rx.phone} • Jan Chemist: With us its original">
  <meta property="og:image" content="${directImgUrl}">
  <meta property="og:type" content="article">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      margin: 0;
      padding: 16px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-sizing: border-box;
    }
    .card {
      max-width: 640px;
      width: 100%;
      background: #1e293b;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    }
    .header {
      background: linear-gradient(135deg, #166534 0%, #047857 100%);
      padding: 24px;
      text-align: center;
      position: relative;
    }
    .badge {
      display: inline-block;
      background: #ef4444;
      color: white;
      font-weight: 800;
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 9999px;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .header p {
      margin: 4px 0 0;
      font-size: 13px;
      color: #bbf7d0;
    }
    .content {
      padding: 24px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }
    .info-box {
      background: #334155;
      padding: 12px 14px;
      border-radius: 14px;
    }
    .info-label {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 700;
      text-transform: uppercase;
    }
    .info-value {
      font-size: 14px;
      font-weight: 700;
      color: #f1f5f9;
      margin-top: 2px;
      word-break: break-word;
    }
    .full-width {
      grid-column: span 2;
    }
    .image-container {
      background: #090d16;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.1);
      text-align: center;
      margin-bottom: 20px;
      position: relative;
    }
    .image-container img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 0 auto;
      object-fit: contain;
      max-height: 550px;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 20px;
      border-radius: 16px;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      border: none;
    }
    .btn-whatsapp {
      background: #25d366;
      color: #064e3b;
    }
    .btn-whatsapp:hover {
      background: #22c55e;
      transform: translateY(-1px);
    }
    .btn-staff {
      background: #0284c7;
      color: #ffffff;
    }
    .btn-staff:hover {
      background: #0369a1;
      transform: translateY(-1px);
    }
    .btn-download {
      background: #334155;
      color: #f8fafc;
    }
    .btn-download:hover {
      background: #475569;
    }
    .guarantee {
      margin-top: 18px;
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
      padding: 10px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="badge">${rx.urgency === 'urgent' ? '🚨 URGENT PRESCRIPTION' : '🩺 VERIFIED DISPENSARY'}</div>
      <h1>JAN CHEMIST PHARMACY</h1>
      <p>"With us its original" • Certified Pharmacist Portal</p>
    </div>
    <div class="content">
      <div class="info-grid">
        <div class="info-box">
          <div class="info-label">Patient Name</div>
          <div class="info-value">${rx.customerName}</div>
        </div>
        <div class="info-box">
          <div class="info-label">WhatsApp Contact</div>
          <div class="info-value">${rx.phone}</div>
        </div>
        <div class="info-box full-width">
          <div class="info-label">Delivery Address</div>
          <div class="info-value">${rx.address || 'Address provided via WhatsApp'}</div>
        </div>
        ${rx.notes ? `
        <div class="info-box full-width">
          <div class="info-label">Instructions / Medicines</div>
          <div class="info-value">${rx.notes}</div>
        </div>` : ''}
      </div>

      <div class="image-container">
        <img src="${directImgUrl}" alt="Prescription Document ${rx.id}">
      </div>

      <div class="actions">
        <!-- Reply to Pharmacist in attachment directs to Jan Chemist Admin/Staff WhatsApp -->
        <a href="https://wa.me/${storePhone}?text=${encodeURIComponent(`Hello Jan Chemist Pharmacist! 🩺 I am inquiring about prescription attachment #${rx.id} for patient ${rx.customerName}. Please confirm medicine availability, total bill and delivery schedule.`)}" class="btn btn-whatsapp" target="_blank">
          💬 Reply / Chat with Pharmacist on WhatsApp (03205868464)
        </a>
        <a href="${directImgUrl}" download="${rx.fileName || 'prescription.jpg'}" class="btn btn-download" target="_blank">
          📥 Download Full Resolution Photo
        </a>

        ${cleanPhone ? `
        <div style="margin-top: 14px; padding: 14px; background: rgba(15, 23, 42, 0.85); border-radius: 16px; border: 1px dashed rgba(56, 189, 248, 0.5); text-align: left;">
          <div style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">👨‍⚕️ Admin / Staff Pharmacist Action</div>
          <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 10px;">If you are Jan Chemist dispensary staff reviewing this attachment, message the patient directly:</div>
          <a href="https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${rx.customerName}! Jan Chemist Pharmacist here regarding your prescription (${rx.id}). We have verified it and can prepare your original medicines now.`)}" class="btn btn-staff" target="_blank" style="font-size: 13px; padding: 10px 16px;">
            💬 Staff: Message Patient on WhatsApp (${rx.phone})
          </a>
        </div>
        ` : ''}
      </div>

      <div class="guarantee">
        🛡️ <strong>Jan Chemist Authenticity Guarantee:</strong> All dispensed medicines are 100% original, unexpired, and handled in climate-controlled dispensary storage.
      </div>
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
});

// PATCH prescription status and notes (for Pharmacist Admin Portal)
app.patch('/api/prescriptions/:id', (req, res) => {
  const { status, quoteAmount, pharmacistNotes } = req.body;
  const idx = inMemoryPrescriptions.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Prescription not found' });
  }

  if (status) inMemoryPrescriptions[idx].status = status;
  if (quoteAmount !== undefined) inMemoryPrescriptions[idx].quoteAmount = Number(quoteAmount);
  if (pharmacistNotes !== undefined) inMemoryPrescriptions[idx].pharmacistNotes = String(pharmacistNotes);

  savePrescriptions(inMemoryPrescriptions);
  return res.json({ success: true, prescription: inMemoryPrescriptions[idx] });
});

// DELETE prescription
app.delete('/api/prescriptions/:id', (req, res) => {
  const initialLen = inMemoryPrescriptions.length;
  inMemoryPrescriptions = inMemoryPrescriptions.filter(p => p.id !== req.params.id);
  if (inMemoryPrescriptions.length !== initialLen) {
    savePrescriptions(inMemoryPrescriptions);
    return res.json({ success: true, message: 'Prescription deleted' });
  }
  return res.status(404).json({ error: 'Prescription not found' });
});

// -------------------------------------------------------------
// ORDERS APIS (Syncs customer cart & WhatsApp checkout to backend)
// -------------------------------------------------------------

app.get('/api/orders', (_req, res) => {
  res.json(inMemoryOrders);
});

app.post('/api/orders', (req, res) => {
  try {
    const orderData = req.body;
    const newOrder: StoredOrder = {
      ...orderData,
      id: orderData.id || `ORD-${Date.now().toString().slice(-6)}`,
      createdAt: orderData.createdAt || new Date().toISOString(),
      status: orderData.status || 'placed_on_whatsapp'
    };

    inMemoryOrders.unshift(newOrder);
    saveOrders(inMemoryOrders);
    return res.status(201).json({ success: true, order: newOrder });
  } catch (error: any) {
    console.error('Error saving order:', error);
    return res.status(500).json({ error: error.message || 'Failed to save order' });
  }
});

app.patch('/api/orders/:id', (req, res) => {
  const { status } = req.body;
  const idx = inMemoryOrders.findIndex(o => o.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (status) inMemoryOrders[idx].status = status;
  saveOrders(inMemoryOrders);
  return res.json({ success: true, order: inMemoryOrders[idx] });
});

app.delete('/api/orders/:id', (req, res) => {
  inMemoryOrders = inMemoryOrders.filter(o => o.id !== req.params.id);
  saveOrders(inMemoryOrders);
  return res.json({ success: true });
});

// -------------------------------------------------------------
// HEALTH & SERVER DIAGNOSTICS APIS (For Custom Domain & Uptime Checks)
// -------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  return res.json({
    status: 'ok',
    app: 'Jan Chemist Superstore & Pharmacy',
    tagline: 'With us its original',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/server-info', (req, res) => {
  const host = req.get('host') || 'unknown';
  const proto = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  return res.json({
    status: 'online',
    store: 'JAN CHEMIST',
    domain: host,
    currentUrl: `${proto}://${host}`,
    nodeVersion: process.version,
    platform: process.platform,
    memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    uptimeMinutes: Math.floor(process.uptime() / 60),
    dataDirExists: fs.existsSync(DATA_DIR),
    ordersCount: inMemoryOrders.length,
    prescriptionsCount: inMemoryPrescriptions.length
  });
});

// -------------------------------------------------------------
// STORE CONFIG & LOGO PERSISTENCE APIS
// -------------------------------------------------------------
const CONFIG_FILE = path.join(DATA_DIR, 'store_config.json');

app.get('/api/store-config', (_req, res) => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return res.json(JSON.parse(data));
    }
  } catch (err) {
    console.error('Error reading store config:', err);
  }
  return res.json(null);
});

app.post('/api/store-config', (req, res) => {
  try {
    const configData = req.body;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configData, null, 2), 'utf-8');
    return res.json({ success: true, config: configData });
  } catch (err: any) {
    console.error('Error writing store config:', err);
    return res.status(500).json({ error: err.message || 'Failed to save store config' });
  }
});


// API: Google Search Product via Gemini 3.8 Flash with Google Search Grounding
app.post('/api/google-product-search', async (req, res) => {
  try {
    const { query, department } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query string is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'GEMINI_API_KEY is not configured in environment' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a clinical pharmacist and retail inventory specialist for Jan Chemist, a premier superstore & certified pharmacy in Pakistan with motto "With us its original".
Search Google and Google Images for this exact product: "${query}" ${department ? `in department: ${department}` : ''}.
Retrieve the authentic brand, retail price in Pakistan (PKR), packaging unit, category, barcode/EAN, and authoritative details.

CRITICAL REQUIREMENT FOR PRODUCT DESCRIPTION:
Retrieve detailed product information from Google and rewrite into structured sections:
1. Formulation & Active Composition: Key active chemical/herbal ingredients, strength, excipients, or materials.
2. Product Details & Benefits: Indications, primary benefits, target conditions, and authentic manufacturing source.
3. Dose & Dosage Guidelines: Recommended dose for adults/children, administration frequency, duration, or cosmetic application volume.
4. Usage & Storage Directions: Step-by-step usage/intake instructions, warnings/precautions, and temperature storage conditions (e.g. below 30°C).

FOR IMAGES:
Fetch direct packaging, bottle, strip, and box pictures from Google Image search results.

Return ONLY a strictly valid JSON object without markdown fences or extra text:
{
  "name": "Official product name with brand, variant, and strength/size",
  "department": "One of: cosmetics, grocery, drinks, lingerie, toiletries, toys, birthday-items, crockery, electronics, pharmacy",
  "category": "Specific category e.g. Pain Relief, Shampoos, Lipsticks, Soft Drinks, Kitchenware",
  "price": estimated retail price in PKR as a number,
  "originalPrice": optional original/MRP price in PKR as a number,
  "unit": "Packaging or dosage unit e.g. 'Pack of 20 Tablets', '400ml Bottle', '100g'",
  "brand": "Manufacturer or brand name",
  "sku": "Suggested SKU code e.g. JAN-MED-PANA-500",
  "barcode": "Authentic barcode or EAN/UPC if found",
  "formulation": "Concise formulation/composition with active ingredients and strengths (e.g., 'Each tablet contains Paracetamol 500mg, Caffeine 65mg with Optizorb disintegrant')",
  "productDetails": "Detailed product specifications, key therapeutic/cosmetic benefits, and authorized origin",
  "dose": "Precise dosage instructions, frequency, and maximum recommended intake",
  "usage": "Usage guidelines, administration route, storage conditions, and safety precautions",
  "description": "Complete structured rewrite combining Formulation, Product Details, Dose, Usage Directions, and Jan Chemist authenticity guarantee formatted with clear section headers",
  "image": "Direct product packaging image URL from Google Image search results",
  "suggestedImages": ["Array of up to 4 alternative Google Image packaging/box/bottle pictures"],
  "sources": ["Array of source titles or URLs found via Google search"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    let rawText = response.text || '';
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    // Find JSON boundaries
    const startIdx = rawText.indexOf('{');
    const endIdx = rawText.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      rawText = rawText.substring(startIdx, endIdx + 1);
    }

    const parsed = JSON.parse(rawText);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/google-product-search:', error);
    return res.status(500).json({ error: error.message || 'Google search failed' });
  }
});

// API: Image Proxy to safely load Google Images and external product packaging images without CORS/hotlink blocking
app.get('/api/image-proxy', async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).send('Missing url query parameter');
  }

  const fallbackUrl = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80';

  try {
    let cleanUrl = decodeURIComponent(targetUrl).trim();

    // Remove quotes
    if ((cleanUrl.startsWith('"') && cleanUrl.endsWith('"')) || (cleanUrl.startsWith("'") && cleanUrl.endsWith("'"))) {
      cleanUrl = cleanUrl.substring(1, cleanUrl.length - 1).trim();
    }

    // Extract direct imgurl if it's a Google imgres URL
    if (cleanUrl.includes('google.') && (cleanUrl.includes('/imgres') || cleanUrl.includes('/search') || cleanUrl.includes('/url'))) {
      const match = cleanUrl.match(/[?&](?:imgurl|url|q)=([^&#]+)/i);
      if (match && match[1]) {
        try {
          cleanUrl = decodeURIComponent(match[1]);
          if (cleanUrl.includes('%3A') || cleanUrl.includes('%2F')) {
            cleanUrl = decodeURIComponent(cleanUrl);
          }
        } catch {}
      }
    }

    // Google Drive direct image conversion
    if (cleanUrl.includes('drive.google.com')) {
      const fileIdMatch = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/id=([a-zA-Z0-9_-]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        cleanUrl = `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
      }
    }

    // Disallow local loopback to prevent SSRF
    if (cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1') || cleanUrl.startsWith('file:')) {
      return res.redirect(fallbackUrl);
    }

    const imageRes = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site'
      },
      redirect: 'follow'
    });

    if (!imageRes.ok) {
      return res.redirect(fallbackUrl);
    }

    const contentType = imageRes.headers.get('content-type') || '';

    // If target was an HTML webpage (e.g. user pasted product page or google search result page)
    if (contentType.includes('text/html')) {
      const htmlText = await imageRes.text();
      // Try to find og:image or twitter:image
      const ogMatch = htmlText.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                      htmlText.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i) ||
                      htmlText.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);

      if (ogMatch && ogMatch[1]) {
        const extractedImg = ogMatch[1];
        const secondRes = await fetch(extractedImg, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
          }
        });
        if (secondRes.ok) {
          const secondType = secondRes.headers.get('content-type') || 'image/jpeg';
          res.setHeader('Content-Type', secondType);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          const buf = Buffer.from(await secondRes.arrayBuffer());
          return res.send(buf);
        }
      }
      return res.redirect(fallbackUrl);
    }

    res.setHeader('Content-Type', contentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const buffer = Buffer.from(await imageRes.arrayBuffer());
    return res.send(buffer);
  } catch (err: any) {
    console.error('Image proxy error:', err?.message);
    return res.redirect(fallbackUrl);
  }
});

// -------------------------------------------------------------
// PWA STANDARDS: Explicit Manifest & Service Worker Endpoints
// -------------------------------------------------------------
app.get('/manifest.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const filePath = fs.existsSync(path.resolve('public/manifest.json'))
    ? path.resolve('public/manifest.json')
    : path.resolve('dist/manifest.json');
  return res.sendFile(filePath);
});

app.get('/sw.js', (_req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const filePath = fs.existsSync(path.resolve('public/sw.js'))
    ? path.resolve('public/sw.js')
    : path.resolve('dist/sw.js');
  return res.sendFile(filePath);
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Jan Chemist server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
