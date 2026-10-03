import React, { useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  FileUp,
  Image as ImageIcon,
  MessageCircle,
  Minus,
  Paperclip,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  X
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { generateCartWhatsAppMessageText, generateCartWhatsAppUrl } from '../utils/whatsapp';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    cartCount,
    cartTotal,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    isCartOpen,
    setIsCartOpen,
    storeConfig,
    logOrder,
    showToast
  } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [formError, setFormError] = useState('');

  // Optional Prescription Upload State
  const [prescriptionImage, setPrescriptionImage] = useState<string>('');
  const [prescriptionFileName, setPrescriptionFileName] = useState<string>('');
  const [prescriptionNotes, setPrescriptionNotes] = useState<string>('');
  const [previewPrescriptionModal, setPreviewPrescriptionModal] = useState<boolean>(false);
  const prescriptionFileRef = useRef<HTMLInputElement>(null);

  if (!isCartOpen) return null;

  const freeDeliveryThreshold = storeConfig.freeDeliveryThreshold;
  const isFreeDelivery = cartTotal >= freeDeliveryThreshold;
  const remainingForFree = Math.max(0, freeDeliveryThreshold - cartTotal);
  const deliveryFee = isFreeDelivery || cartCount === 0 ? 0 : storeConfig.standardDeliveryFee;
  const grandTotal = cartTotal + deliveryFee;

  const handlePrescriptionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Prescription image must be under 5MB.', 'warning');
        return;
      }
      setPrescriptionFileName(file.name);
      const reader = new FileReader();
      reader.onload = event => {
        setPrescriptionImage(event.target?.result as string);
        showToast('Prescription attached to WhatsApp order!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePrescription = () => {
    setPrescriptionImage('');
    setPrescriptionFileName('');
    setPrescriptionNotes('');
    if (prescriptionFileRef.current) prescriptionFileRef.current.value = '';
    showToast('Prescription removed from order.', 'info');
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!customerName.trim()) {
      setFormError('Please enter your name.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Please provide your WhatsApp contact number.');
      return;
    }
    if (!address.trim()) {
      setFormError('Please provide your complete delivery address.');
      return;
    }

    // Prevent Negative Stock: Verify real-time stock limits before confirming checkout
    for (const item of cart) {
      if (item.quantity > item.product.stock) {
        setFormError(`Insufficient stock: "${item.product.name}" only has ${item.product.stock} available (you requested ${item.quantity}). Please adjust quantity.`);
        return;
      }
    }

    setFormError('');

    // If prescription photo is attached, upload to server to get permanent viewable link
    let attachedRxViewUrl = '';
    if (prescriptionImage) {
      try {
        const rxRes = await fetch('/api/prescriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: customerName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            notes: prescriptionNotes.trim() || `Cart order attached Rx (${cart.length} cart items)`,
            urgency: 'standard',
            prescriptionImage,
            fileName: prescriptionFileName || 'prescription.jpg',
            fileSize: 'Cart Attached'
          })
        });
        if (rxRes.ok) {
          const rxData = await rxRes.json();
          if (rxData && rxData.viewUrl) {
            attachedRxViewUrl = rxData.viewUrl;
          }
        }
      } catch (err) {
        console.warn('Prescription upload in cart checkout:', err);
      }
    }

    const customerPayload = {
      name: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      notes: notes.trim(),
      paymentMethod,
      hasPrescription: Boolean(prescriptionImage),
      prescriptionFileName: prescriptionFileName || undefined,
      prescriptionNotes: prescriptionNotes.trim() || undefined,
      prescriptionViewUrl: attachedRxViewUrl || undefined
    };

    const whatsappMessageText = generateCartWhatsAppMessageText(cart, customerPayload, storeConfig);

    // Log order in store context & database (orders + order_items with frozen price + atomic stock decrement)
    const orderResult = await logOrder({
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      notes: notes.trim(),
      paymentMethod,
      prescriptionImage: prescriptionImage || undefined,
      prescriptionFileName: prescriptionFileName || undefined,
      prescriptionNotes: prescriptionNotes.trim() || undefined,
      whatsappMessage: whatsappMessageText,
      items: cart,
      subtotal: cartTotal,
      deliveryFee,
      total: grandTotal
    });

    if (!orderResult.success) {
      setFormError(orderResult.error || 'Failed to place order. Please review stock and try again.');
      return;
    }

    // Confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {}

    // Generate WhatsApp URL with live prescription link
    const url = generateCartWhatsAppUrl(cart, customerPayload, storeConfig);

    // Open WhatsApp
    window.open(url, '_blank');
    clearCart();
    setIsCartOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>Your Shopping Cart</span>
                {cartCount > 0 && (
                  <span className="text-xs bg-red-600 text-white font-bold px-2 py-0.5 rounded-full">
                    {cartCount} items
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-emerald-200">
                100% Original Products Guaranteed
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Goal Bar */}
        {cartCount > 0 && (
          <div className="bg-emerald-50 px-5 py-2.5 border-b border-emerald-100">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-900 mb-1">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-600" />
                {isFreeDelivery ? (
                  <strong className="text-emerald-700">Congratulations! You unlocked FREE Delivery!</strong>
                ) : (
                  <span>
                    Add <strong>Rs. {remainingForFree.toLocaleString()}</strong> more for <strong>FREE Delivery</strong>
                  </span>
                )}
              </span>
              <span className="text-[11px] text-emerald-700">Threshold: Rs. {freeDeliveryThreshold}</span>
            </div>
            <div className="w-full bg-emerald-200/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (cartTotal / freeDeliveryThreshold) * 100)}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                <ShoppingBag className="w-10 h-10" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Your cart is empty</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Explore our 8+ departments: Cosmetics, Grocery, Drinks, Lingerie, Toiletries, Toys, Crockery, Electronics or upload a prescription!
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
              >
                Start Shopping Now
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs text-slate-500">
                <span>Selected Items</span>
                <button
                  onClick={clearCart}
                  className="text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              {cart.map(item => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3 p-3 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/70 transition"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0 bg-white"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                      {item.product.department}
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 truncate" title={item.product.name}>
                      {item.product.name}
                    </h4>
                    <div className="text-xs text-slate-600 font-semibold mt-0.5">
                      Rs. {item.product.price.toLocaleString()}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">/ {item.product.unit}</span>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-bold text-xs text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-slate-900 ml-auto font-mono">
                        Rs. {(item.product.price * item.quantity).toLocaleString()}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-red-500 p-1 transition cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Checkout Form & WhatsApp Order CTA */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-4">
            {/* Bill Summary */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal ({cartCount} items):</span>
                <span className="font-bold text-slate-900">Rs. {cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges:</span>
                <span className={`font-bold ${deliveryFee === 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-200 text-sm font-extrabold text-slate-950">
                <span>Total Amount:</span>
                <span className="text-emerald-800 text-base">Rs. {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Customer Details Form */}
            <form onSubmit={handleCheckout} className="space-y-2.5 pt-1">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Delivery Details:</span>
                <span className="text-[10px] text-emerald-700 font-semibold">Hours: 8:00 AM - 1:00 AM</span>
              </div>

              {formError && (
                <div className="p-2 bg-red-100 text-red-800 rounded-lg text-xs font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Your Name *"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                />
                <input
                  type="tel"
                  required
                  placeholder="WhatsApp Number *"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <input
                type="text"
                required
                placeholder="Full Delivery Address (Street, House/Flat, City) *"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-white rounded-xl border border-slate-300 text-slate-700 focus:outline-none focus:border-emerald-600 font-medium"
                >
                  <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                  <option value="JazzCash / EasyPaisa">JazzCash / EasyPaisa</option>
                  <option value="Online Bank Transfer">Online Bank Transfer</option>
                </select>
                <input
                  type="text"
                  placeholder="Optional delivery notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Optional Prescription Upload */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center text-[10px] font-black">
                      Rx
                    </span>
                    <span className="font-bold text-xs text-emerald-950">
                      Attach Prescription (Optional)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200">
                    Pharmacist Verification
                  </span>
                </div>

                <p className="text-[11px] text-emerald-900/80 leading-snug">
                  Ordering medicines or regulated health supplies? Attach your prescription so our certified pharmacist verifies dosage and expiry.
                </p>

                <input
                  type="file"
                  ref={prescriptionFileRef}
                  onChange={handlePrescriptionUpload}
                  accept="image/*"
                  className="hidden"
                />

                {!prescriptionImage ? (
                  <button
                    type="button"
                    onClick={() => prescriptionFileRef.current?.click()}
                    className="w-full py-2.5 px-3 border border-dashed border-emerald-400 hover:border-emerald-600 bg-white hover:bg-emerald-50 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                  >
                    <FileUp className="w-4 h-4 text-emerald-600" />
                    <span>Attach Prescription Photo (Camera / Gallery)</span>
                  </button>
                ) : (
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={prescriptionImage}
                          alt="Prescription preview"
                          onClick={() => setPreviewPrescriptionModal(true)}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 cursor-pointer shrink-0 hover:opacity-90 transition"
                          title="Click to zoom prescription image"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate" title={prescriptionFileName}>
                            {prescriptionFileName || 'Prescription Image'}
                          </div>
                          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Attached to WhatsApp order
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewPrescriptionModal(true)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                          title="Preview full image"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePrescription}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Remove prescription"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Doctor's notes, dosage instructions, or patient name (optional)"
                      value={prescriptionNotes}
                      onChange={e => setPrescriptionNotes(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                )}
              </div>

              {/* Big Green Order on WhatsApp Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/30 transition-all cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-white/20" />
                <span>Confirm &amp; Order on WhatsApp ({storeConfig.displayPhone})</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Prescription Zoom Modal in Cart */}
      {previewPrescriptionModal && prescriptionImage && (
        <div
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewPrescriptionModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-3 p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Prescription Preview</span>
              </span>
              <button
                onClick={() => setPreviewPrescriptionModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={prescriptionImage}
              alt="Prescription enlarged"
              className="w-full max-h-[60vh] object-contain rounded-xl border border-slate-200"
            />
            {prescriptionNotes && (
              <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-xl">
                Notes: &ldquo;{prescriptionNotes}&rdquo;
              </p>
            )}
            <button
              type="button"
              onClick={() => setPreviewPrescriptionModal(false)}
              className="w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
            >
              Done Previewing
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
