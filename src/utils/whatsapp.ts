import { CartItem, OrderLog, OrderStatus, PrescriptionOrder, Product, StoreConfig } from '../types';

/**
 * Permanent Locked Jan Chemist Configuration (Preserved as Default for Any New Remix)
 */
export const LOCKED_JAN_CHEMIST_DEFAULTS: Readonly<StoreConfig> = Object.freeze({
  storeName: 'JAN CHEMIST',
  tagline: 'With us its original',
  whatsappNumber: '923205868464',
  displayPhone: '03205868464',
  openingTime: '08:00',
  closingTime: '01:00',
  daysOpen: '7 Days a Week (8:00 AM - 1:00 AM)',
  freeDeliveryThreshold: 2000,
  standardDeliveryFee: 150,
  
  // Branding Defaults (Locked Jan Chemist Logo & Colors)
  logoType: 'custom-image',
  customLogoUrl: '/logo.svg',
  logoBadgeColor: '#248243',

  // Frontend Descriptions Defaults
  heroTitle: 'Your Complete Superstore & Trusted Pharmacy',
  heroSubtitle: 'Shop 10 departments: Cosmetics, Grocery, Drinks, Lingerie, Toiletries, Toys, Birthday Items, Crockery, Electronics, and certified Prescription Medicines.',
  announcementTicker: '“With us its original” — 100% Genuine Pharmacy & Superstore',
  departmentDescriptions: {},

  // Owner Security PIN (Default: 1234)
  adminPin: '1234'
});

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  ...LOCKED_JAN_CHEMIST_DEFAULTS
};

/**
 * Checks if store is currently open based on 8:00 AM to 1:00 AM next day (17 hours daily)
 */
export function isStoreCurrentlyOpen(opening = '08:00', closing = '01:00'): {
  isOpen: boolean;
  statusText: string;
  nextStatusText: string;
} {
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeVal = currentHours * 60 + currentMinutes;

  // Open: 08:00 (480 mins) to 01:00 next day (60 mins)
  // That means: open if time >= 08:00 OR time < 01:00
  const openMins = 8 * 60; // 480
  const closeMins = 1 * 60; // 60

  const isOpen = currentTimeVal >= openMins || currentTimeVal < closeMins;

  if (isOpen) {
    return {
      isOpen: true,
      statusText: 'Open Now • Closes at 1:00 AM',
      nextStatusText: 'Delivering within 30-45 minutes'
    };
  } else {
    return {
      isOpen: false,
      statusText: 'Closed • Opens at 8:00 AM',
      nextStatusText: 'Orders placed now will be prioritized at 8:00 AM'
    };
  }
}

/**
 * Gets the verified Jan Chemist store WhatsApp number in international format (e.g. 923205868464)
 */
export function getStoreWhatsAppNumber(config: StoreConfig = DEFAULT_STORE_CONFIG): string {
  const raw = config.whatsappNumber || LOCKED_JAN_CHEMIST_DEFAULTS.whatsappNumber || '923205868464';
  let cleaned = String(raw).replace(/[^0-9]/g, '');
  if (cleaned.startsWith('00')) cleaned = cleaned.slice(2);
  if (cleaned.startsWith('0')) cleaned = '92' + cleaned.slice(1);
  else if (cleaned.startsWith('3') && cleaned.length === 10) cleaned = '92' + cleaned;
  return cleaned || '923205868464';
}

/**
 * Normalizes phone numbers for WhatsApp wa.me links.
 * Converts local Pakistani formats (03001234567, 3001234567, +923001234567)
 * into standard international format without '+' (923001234567).
 * If fallbackPhone is not provided, returns empty string when phone is invalid/empty (does NOT default to store phone).
 */
export function normalizeWhatsAppPhone(phone: string, fallbackPhone = '', defaultCountryCode = '92'): string {
  if (!phone || !String(phone).trim()) return fallbackPhone;
  let cleaned = String(phone).replace(/[^0-9]/g, '');
  if (!cleaned) return fallbackPhone;

  // Remove leading 00
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2);
  }

  // If local Pakistani number with leading 0 (e.g. 03201234567 -> 923201234567)
  if (cleaned.startsWith('0')) {
    cleaned = defaultCountryCode + cleaned.slice(1);
  } else if (!cleaned.startsWith(defaultCountryCode) && (cleaned.length === 10 || cleaned.startsWith('3'))) {
    // 3201234567 -> 923201234567
    cleaned = defaultCountryCode + cleaned;
  }

  return cleaned;
}

/**
 * Formats a customer / patient phone number safely for backend messaging.
 * Returns empty string if missing or invalid.
 */
export function cleanPatientWhatsAppPhone(phone?: string): string {
  if (!phone) return '';
  return normalizeWhatsAppPhone(phone, '');
}

export function getPrescriptionWebLink(id: string): string {
  try {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      return `${window.location.origin}/api/prescriptions/view/${id}`;
    }
  } catch {}
  return `/api/prescriptions/view/${id}`;
}

export function getPrescriptionDirectImageUrl(id: string): string {
  try {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      return `${window.location.origin}/api/prescriptions/${id}/image`;
    }
  } catch {}
  return `/api/prescriptions/${id}/image`;
}

/**
 * Creates WhatsApp plain message text for cart checkout with optional prescription details
 */
export function generateCartWhatsAppMessageText(
  items: CartItem[],
  customer: {
    name: string;
    phone: string;
    address: string;
    notes?: string;
    paymentMethod?: string;
    hasPrescription?: boolean;
    prescriptionFileName?: string;
    prescriptionNotes?: string;
    prescriptionViewUrl?: string;
    prescriptionId?: string;
  },
  config: StoreConfig = DEFAULT_STORE_CONFIG
): string {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = subtotal >= config.freeDeliveryThreshold ? 0 : config.standardDeliveryFee;
  const grandTotal = subtotal + deliveryFee;

  let text = `🟢 *JAN CHEMIST - NEW ORDER*\n`;
  text += `_"${config.tagline}"_\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  text += `👤 *Customer Details:*\n`;
  text += `• Name: *${customer.name.trim() || 'Valued Customer'}*\n`;
  text += `• Phone: *${customer.phone.trim() || 'N/A'}*\n`;
  text += `• Address: *${customer.address.trim() || 'Not specified'}*\n`;
  if (customer.paymentMethod) {
    text += `• Payment: *${customer.paymentMethod}*\n`;
  }
  if (customer.notes && customer.notes.trim()) {
    text += `• Note: _${customer.notes.trim()}_\n`;
  }

  // Optional Prescription Information
  if (customer.hasPrescription) {
    text += `\n🩺 *Doctor's Prescription Attached:*\n`;
    text += `• Status: ✅ Attached / Uploaded (${customer.prescriptionFileName || 'Doctor Prescription'})\n`;
    if (customer.prescriptionViewUrl) {
      text += `• View Rx Link: ${customer.prescriptionViewUrl}\n`;
    } else if (customer.prescriptionId) {
      text += `• View Rx Link: ${getPrescriptionWebLink(customer.prescriptionId)}\n`;
    }
    if (customer.prescriptionNotes && customer.prescriptionNotes.trim()) {
      text += `• Rx Instructions: _"${customer.prescriptionNotes.trim()}"_\n`;
    }
    text += `• _(Certified Pharmacist verification requested)_\n`;
  }

  text += `\n📦 *Order Items (${items.reduce((s, i) => s + i.quantity, 0)} items):*\n`;
  items.forEach((item, index) => {
    const barcodeStr = item.product.barcode || item.product.sku || 'N/A';
    const packingStr = item.product.unit || 'Standard';
    const hasCutPrice = item.product.originalPrice && item.product.originalPrice > item.product.price;
    const cutPriceText = hasCutPrice ? ` [Cut Market Price: ~Rs. ${item.product.originalPrice!.toLocaleString()}~]` : '';

    text += `${index + 1}. *${item.product.name}*\n`;
    text += `   • Barcode: *${barcodeStr}*\n`;
    text += `   • Packing: ${packingStr}\n`;
    text += `   • Price: Rs. ${item.product.price.toLocaleString()}${cutPriceText}\n`;
    text += `   • Qty: ${item.quantity} = *Rs. ${(item.product.price * item.quantity).toLocaleString()}*\n`;
  });

  text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💰 Subtotal: *Rs. ${subtotal.toLocaleString()}*\n`;
  text += `🚚 Delivery Fee: *${deliveryFee === 0 ? 'FREE (Above Rs. ' + config.freeDeliveryThreshold + ')' : 'Rs. ' + deliveryFee}*\n`;
  text += `💵 *Total Payable: Rs. ${grandTotal.toLocaleString()}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `🕒 Timings: ${config.daysOpen}\n`;
  text += `🛡️ *100% Original Guaranteed*\n\n`;
  text += `Please confirm my order and share estimated delivery time. Thank you!`;

  return text;
}

/**
 * Creates WhatsApp URL for cart checkout with optional prescription details
 */
export function generateCartWhatsAppUrl(
  items: CartItem[],
  customer: {
    name: string;
    phone: string;
    address: string;
    notes?: string;
    paymentMethod?: string;
    hasPrescription?: boolean;
    prescriptionFileName?: string;
    prescriptionNotes?: string;
    prescriptionViewUrl?: string;
    prescriptionId?: string;
  },
  config: StoreConfig = DEFAULT_STORE_CONFIG
): string {
  const text = generateCartWhatsAppMessageText(items, customer, config);
  const storePhone = getStoreWhatsAppNumber(config);
  return `https://wa.me/${storePhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Creates 1-Tap Direct WhatsApp URL to immediately upload/send prescription photo directly in WhatsApp chat
 */
export function generateDirectPrescriptionWhatsAppUrl(
  customerDetails?: { name?: string; phone?: string; address?: string; notes?: string; urgency?: string },
  config: StoreConfig = DEFAULT_STORE_CONFIG
): string {
  const storePhone = getStoreWhatsAppNumber(config);
  let text = `🩺 *JAN CHEMIST - DIRECT PRESCRIPTION ORDER*\n`;
  text += `_"${config.tagline}"_\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `Hello Jan Chemist Pharmacist! 👋\n`;
  text += `I am sending my doctor's prescription directly here on WhatsApp for 100% genuine medicines delivery.\n\n`;
  if (customerDetails?.name && customerDetails.name.trim()) {
    text += `👤 *Patient Name:* ${customerDetails.name.trim()}\n`;
  }
  if (customerDetails?.phone && customerDetails.phone.trim()) {
    text += `📞 *Contact Phone:* ${customerDetails.phone.trim()}\n`;
  }
  if (customerDetails?.address && customerDetails.address.trim()) {
    text += `📍 *Delivery Address:* ${customerDetails.address.trim()}\n`;
  }
  if (customerDetails?.urgency && customerDetails.urgency === 'urgent') {
    text += `🚨 *Urgency:* Emergency Priority (30-45 mins delivery needed)\n`;
  }
  if (customerDetails?.notes && customerDetails.notes.trim()) {
    text += `📝 *Medication Notes / Names:* ${customerDetails.notes.trim()}\n`;
  }
  text += `\n📎 *(I am attaching the prescription photo / document directly in this chat)*\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🛡️ *100% Original Medicines Guaranteed*\n`;
  text += `Please verify availability, share dosage instructions and total bill. Thank you!`;

  return `https://wa.me/${storePhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates formatted WhatsApp status update message text from backend to customer
 */
export function generateOrderStatusWhatsAppText(
  order: OrderLog,
  status: OrderStatus,
  config: StoreConfig = DEFAULT_STORE_CONFIG,
  customNote?: string
): string {
  let text = '';

  if (status === 'approved') {
    text = `🟢 *JAN CHEMIST - ORDER APPROVED*\n`;
    text += `_"${config.tagline}"_\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `Dear *${order.customerName}*,\n\n`;
    text += `Great news! Your Jan Chemist order *${order.id}* (Total: *Rs. ${order.total.toLocaleString()}*) has been reviewed and *APPROVED* by our on-duty certified pharmacist. ✅\n\n`;
    if (order.prescriptionImage) {
      text += `🩺 *Prescription Verified:* Your uploaded prescription (${order.prescriptionFileName || 'Rx'}) has been authenticated and approved for dispensing.\n\n`;
    }
    text += `📦 *Items Being Prepared (${order.items.reduce((s, i) => s + i.quantity, 0)} items):*\n`;
    order.items.forEach(i => {
      const barcodeStr = i.product.barcode || i.product.sku || 'N/A';
      const packingStr = i.product.unit || 'Standard';
      const hasCutPrice = i.product.originalPrice && i.product.originalPrice > i.product.price;
      const cutPriceText = hasCutPrice ? ` [Cut Market Price: ~Rs. ${i.product.originalPrice!.toLocaleString()}~]` : '';
      text += `• ${i.quantity}x *${i.product.name}*\n   ↳ Barcode: ${barcodeStr} | Packing: ${packingStr} | Price: Rs. ${i.product.price.toLocaleString()}${cutPriceText}\n`;
    });
    text += `\n📍 *Delivery Address:* ${order.address}\n`;
    text += `💳 *Payment Method:* ${order.paymentMethod || 'Cash on Delivery'}\n\n`;
    if (customNote && customNote.trim()) {
      text += `📝 *Note from Pharmacist:* ${customNote.trim()}\n\n`;
    }
    text += `Our team is now carefully packing your 100% original items. We will notify you once dispatched!`;
  } else if (status === 'packed') {
    text = `📦 *JAN CHEMIST - ORDER PACKED & DISPATCHED*\n`;
    text += `_"${config.tagline}"_\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `Dear *${order.customerName}*,\n\n`;
    text += `Your order *${order.id}* is *PACKED & OUT FOR DELIVERY*! 🚚\n\n`;
    text += `📍 *Delivery Address:* ${order.address}\n`;
    text += `💵 *Total Amount to Pay: Rs. ${order.total.toLocaleString()}* (${order.paymentMethod || 'COD'})\n`;
    text += `⏱️ *Rider ETA:* Estimated 25-40 minutes in local delivery route.\n\n`;
    if (customNote && customNote.trim()) {
      text += `📝 *Dispatch Note:* ${customNote.trim()}\n\n`;
    }
    text += `Please keep your phone active for rider arrival. Thank you for choosing Jan Chemist!`;
  } else if (status === 'delivered') {
    text = `✅ *JAN CHEMIST - ORDER DELIVERED*\n`;
    text += `_"${config.tagline}"_\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `Dear *${order.customerName}*,\n\n`;
    text += `Your order *${order.id}* has been successfully marked as *DELIVERED*! 🎉\n\n`;
    text += `🛡️ *100% Original Guaranteed:* All medicines, cosmetics, and superstore goods supplied by Jan Chemist are sourced directly from verified distributors.\n\n`;
    if (customNote && customNote.trim()) {
      text += `📝 *Delivery Note:* ${customNote.trim()}\n\n`;
    }
    text += `If you need any dosage assistance or further items, our helpline is open 8:00 AM - 1:00 AM 7 days a week.\n\n`;
    text += `Thank you for shopping with Jan Chemist!`;
  } else if (status === 'cancelled') {
    text = `❌ *JAN CHEMIST - ORDER UPDATE*\n`;
    text += `_"${config.tagline}"_\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `Dear *${order.customerName}*,\n\n`;
    text += `Your order *${order.id}* has been marked as cancelled.\n`;
    if (customNote && customNote.trim()) {
      text += `Reason/Note: ${customNote.trim()}\n\n`;
    }
    text += `If this was an error or you would like to revise items or prescription, please reply here directly and our pharmacist will assist you immediately.`;
  } else {
    text = `🟢 *JAN CHEMIST - ORDER UPDATE*\n`;
    text += `_"${config.tagline}"_\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `Dear *${order.customerName}*,\n\n`;
    text += `Update regarding your order *${order.id}*:\n`;
    text += `• Status: *${status.replace('_', ' ').toUpperCase()}*\n`;
    text += `• Total: Rs. ${order.total.toLocaleString()} (${order.items.length} items)\n`;
    if (order.items && order.items.length > 0) {
      text += `• Items Ordered:\n`;
      order.items.forEach(i => {
        const barcodeStr = i.product.barcode || i.product.sku || 'N/A';
        const packingStr = i.product.unit || 'Standard';
        const hasCutPrice = i.product.originalPrice && i.product.originalPrice > i.product.price;
        const cutPriceText = hasCutPrice ? ` [Cut Market Price: ~Rs. ${i.product.originalPrice!.toLocaleString()}~]` : '';
        text += `   ↳ ${i.quantity}x ${i.product.name} (Barcode: ${barcodeStr}, Packing: ${packingStr}, Rs. ${i.product.price.toLocaleString()}${cutPriceText})\n`;
      });
    }
    text += `• Address: ${order.address}\n\n`;
    if (customNote && customNote.trim()) {
      text += `📝 *Note:* ${customNote.trim()}\n\n`;
    }
    text += `Please let us know if you have any questions. Thank you!`;
  }

  return text;
}

/**
 * Creates formatted WhatsApp URL from backend to customer for status updates
 * (e.g. approved, packed, delivered, cancelled)
 */
export function generateOrderStatusWhatsAppUrl(
  order: OrderLog,
  status: OrderStatus,
  config: StoreConfig = DEFAULT_STORE_CONFIG,
  customNote?: string
): string {
  const targetPatientPhone = cleanPatientWhatsAppPhone(order.phone);
  if (!targetPatientPhone) return '';
  const text = generateOrderStatusWhatsAppText(order, status, config, customNote);
  return `https://wa.me/${targetPatientPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Creates WhatsApp URL for single product direct order / inquiry
 */
export function generateSingleProductWhatsAppUrl(
  product: Product,
  quantity = 1,
  config: StoreConfig = DEFAULT_STORE_CONFIG
): string {
  const storePhone = getStoreWhatsAppNumber(config);
  const barcodeValue = product.barcode || product.sku || 'N/A';
  const packingValue = product.unit || 'Standard';
  const hasCutPrice = product.originalPrice && product.originalPrice > product.price;
  const cutPriceText = hasCutPrice ? ` [Cut Market Price: ~Rs. ${product.originalPrice!.toLocaleString()}~]` : '';

  let text = `🟢 *JAN CHEMIST - QUICK ORDER*\n`;
  text += `_"${config.tagline}"_\n\n`;
  text += `Hello! I would like to order this original product:\n\n`;
  text += `📦 *${product.name}*\n`;
  text += `• Barcode: *${barcodeValue}*\n`;
  text += `• Packing: *${packingValue}*\n`;
  text += `• Price: *Rs. ${product.price.toLocaleString()}*${cutPriceText}\n`;
  text += `• Desired Qty: *${quantity}*\n`;
  text += `• Total Payable: *Rs. ${(product.price * quantity).toLocaleString()}*\n\n`;
  text += `Please confirm delivery availability at your earliest. Thanks!`;

  return `https://wa.me/${storePhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Creates WhatsApp URL for prescription submission with live viewable links
 */
export function generatePrescriptionWhatsAppUrl(
  prescription: PrescriptionOrder,
  config: StoreConfig = DEFAULT_STORE_CONFIG
): string {
  const storePhone = getStoreWhatsAppNumber(config);
  const viewUrl = prescription.viewUrl || getPrescriptionWebLink(prescription.id);

  let text = `🩺 *JAN CHEMIST - PRESCRIPTION ORDER*\n`;
  text += `_"${config.tagline}"_\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `Hello Pharmacist! I am ordering medicines with my doctor's prescription:\n\n`;
  text += `📋 *Prescription ID:* *${prescription.id}*\n`;
  text += `👤 *Patient / Customer:* *${prescription.customerName}*\n`;
  text += `📞 *WhatsApp:* ${prescription.phone}\n`;
  text += `📍 *Delivery Address:* ${prescription.address}\n`;
  text += `⚡ *Urgency:* ${prescription.urgency === 'urgent' ? '🚨 URGENT (Immediate Delivery Needed)' : 'Standard Routine Delivery'}\n`;
  if (prescription.notes && prescription.notes.trim()) {
    text += `📝 *Doctor/Medication Notes:*\n"${prescription.notes.trim()}"\n`;
  }
  text += `\n📎 *PRESCRIPTION PHOTO:*\n${viewUrl}\n`;
  text += `*(Attached directly or tap link above to view)*\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🛡️ *100% Genuine Pharmacy Guarantee*\n`;
  text += `Please verify dosage, confirm availability, and send total bill & rider ETA. Thank you!`;

  return `https://wa.me/${storePhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Creates WhatsApp URL for Pharmacist to quote prescription bill and dosage instructions back to customer
 */
export function generatePrescriptionQuoteWhatsAppUrl(
  prescription: PrescriptionOrder,
  quoteAmount: number,
  pharmacistNotes?: string,
  config: StoreConfig = DEFAULT_STORE_CONFIG
): string {
  const targetPatientPhone = cleanPatientWhatsAppPhone(prescription.phone);
  if (!targetPatientPhone) return '';
  const viewUrl = prescription.viewUrl || getPrescriptionWebLink(prescription.id);

  let text = `🟢 *JAN CHEMIST - PRESCRIPTION VERIFIED & APPROVED*\n`;
  text += `_"${config.tagline}"_\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `Dear *${prescription.customerName}*,\n\n`;
  text += `Your prescription (*${prescription.id}*) has been reviewed and verified by our on-duty certified pharmacist at Jan Chemist. ✅\n\n`;
  text += `💰 *Prescription Total Bill:* *Rs. ${quoteAmount.toLocaleString()}*\n`;
  text += `📍 *Delivery Address:* ${prescription.address}\n`;
  text += `⏱️ *Dispatch ETA:* ${prescription.urgency === 'urgent' ? 'Immediate Rider Dispatch (25-35 mins)' : 'Standard Delivery (45-60 mins)'}\n`;
  if (pharmacistNotes && pharmacistNotes.trim()) {
    text += `\n📝 *Pharmacist Instructions:*\n"${pharmacistNotes.trim()}"\n`;
  }
  text += `\n📎 *Verified Rx Reference:* ${viewUrl}\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🛡️ *100% Original Medicines Guaranteed*\n`;
  text += `Please reply *YES* to confirm this order and dispatch the rider to your address!`;

  return `https://wa.me/${targetPatientPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Generic direct WhatsApp link builder from store backend to a patient
 */
export function generateReplyToPatientWhatsAppUrl(
  patientPhone: string,
  messageText: string
): string {
  const cleanPhone = cleanPatientWhatsAppPhone(patientPhone);
  if (!cleanPhone) return '';
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
}
