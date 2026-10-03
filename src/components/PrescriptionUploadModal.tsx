import React, { useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  FileUp,
  Image as ImageIcon,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
  Zap
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  generateDirectPrescriptionWhatsAppUrl,
  generatePrescriptionWhatsAppUrl,
  getStoreWhatsAppNumber
} from '../utils/whatsapp';

export const PrescriptionUploadModal: React.FC = () => {
  const {
    isPrescriptionModalOpen,
    setIsPrescriptionModalOpen,
    submitPrescription,
    storeConfig,
    showToast
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab mode: 'direct' (instant WhatsApp upload) vs 'form' (attach photo & details)
  const [activeTab, setActiveTab] = useState<'direct' | 'attach'>('direct');

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [urgency, setUrgency] = useState<'standard' | 'urgent'>('standard');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedRx, setSubmittedRx] = useState<any>(null);

  if (!isPrescriptionModalOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('File size exceeds 20MB. Please choose a smaller photo.');
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = event => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImagePreview('');
    setSelectedFile(null);
    setFileName('');
    setFileSize('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyImageToClipboard = async () => {
    if (!selectedFile && !imagePreview) return;
    try {
      if (selectedFile && selectedFile.type.startsWith('image/')) {
        const item = new ClipboardItem({ [selectedFile.type]: selectedFile });
        await navigator.clipboard.write([item]);
        showToast('Prescription image copied! You can paste (Ctrl+V) directly into WhatsApp.', 'success');
        return;
      }
    } catch {}
    showToast('Prescription photo ready! Tap attach in WhatsApp.', 'info');
  };

  /**
   * DIRECT 1-TAP ACTION:
   * Immediately opens WhatsApp with Jan Chemist without requiring file upload to website server first.
   * Customer attaches/snaps the prescription photo directly in WhatsApp.
   */
  const handleDirectWhatsAppPrescription = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Background record creation so backend pharmacist has a reference ID
      const directDetails = {
        customerName: customerName.trim() || 'Valued Patient',
        phone: phone.trim() || 'Direct WhatsApp',
        address: address.trim() || 'Via WhatsApp chat',
        notes: notes.trim() || 'Direct WhatsApp prescription submission',
        urgency,
        prescriptionImage: imagePreview || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600',
        fileName: fileName || 'Direct_WhatsApp_Prescription.jpg',
        fileSize: fileSize || 'Direct'
      };

      // Try saving in background without blocking
      try {
        await submitPrescription(directDetails);
      } catch (err) {
        console.warn('Background prescription record note:', err);
      }

      // Generate direct WhatsApp link
      const directWaUrl = generateDirectPrescriptionWhatsAppUrl(
        {
          name: customerName,
          phone,
          address,
          notes,
          urgency
        },
        storeConfig
      );

      // Trigger celebration
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {}

      // Open WhatsApp directly
      window.open(directWaUrl, '_blank');
      showToast(`Jan Chemist WhatsApp opened! Attach your prescription photo in chat.`, 'success');

      // Set confirmation
      setSubmittedRx({
        id: `RX-DIRECT-${Date.now().toString().slice(-6)}`,
        customerName: customerName.trim() || 'Valued Patient',
        phone: phone.trim() || storeConfig.displayPhone,
        address: address.trim() || 'Provided on WhatsApp',
        directMode: true
      });
    } catch (err: any) {
      setErrorMsg('Could not open WhatsApp: ' + (err?.message || 'Please try again'));
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * FORM SUBMIT ACTION:
   * Saves to server + opens WhatsApp
   */
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Please enter your WhatsApp contact number.');
      return;
    }
    if (!address.trim()) {
      setErrorMsg('Please provide your complete delivery address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const finalImage =
      imagePreview ||
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600';

    try {
      const prescriptionRecord = await submitPrescription({
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        notes: notes.trim(),
        urgency,
        prescriptionImage: finalImage,
        fileName: fileName || 'Prescription_Photo.jpg',
        fileSize: fileSize || 'Standard'
      });

      setSubmittedRx(prescriptionRecord);

      // Copy image to clipboard if available
      if (selectedFile && selectedFile.type.startsWith('image/')) {
        try {
          const item = new ClipboardItem({ [selectedFile.type]: selectedFile });
          await navigator.clipboard.write([item]);
        } catch {}
      }

      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      } catch {}

      // Open WhatsApp directly with the prescription details & store hotline
      const waUrl = generatePrescriptionWhatsAppUrl(prescriptionRecord, storeConfig);
      window.open(waUrl, '_blank');
      showToast('Prescription submitted! Jan Chemist WhatsApp chat opened.', 'success');
    } catch (err: any) {
      setErrorMsg('Error submitting prescription: ' + (err?.message || 'Please try again'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsPrescriptionModalOpen(false);
    setSubmittedRx(null);
    setCustomerName('');
    setPhone('');
    setAddress('');
    setNotes('');
    setImagePreview('');
    setSelectedFile(null);
    setFileName('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 my-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>100% Genuine Certified Medicines &bull; Pharmacist on Duty</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-emerald-300 shrink-0" />
            <span>Order with Doctor&apos;s Prescription</span>
          </h2>

          <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-lg leading-relaxed">
            Upload or send your prescription directly to Jan Chemist on WhatsApp. Our certified pharmacist will verify the dosage, confirm genuine stock, and arrange delivery.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-emerald-200">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>Hours: 8:00 AM - 1:00 AM (7 Days)</span>
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5 text-green-300" />
              <span>WhatsApp: {storeConfig.displayPhone}</span>
            </span>
          </div>
        </div>

        {/* Success Confirmation Screen */}
        {submittedRx ? (
          <div className="p-6 sm:p-8 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                Prescription Sent to Jan Chemist!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
                Your order has been recorded with reference <strong className="text-slate-900 font-mono font-bold">{submittedRx.id}</strong>. Our certified pharmacist will review it and reply directly to your WhatsApp.
              </p>
            </div>

            {/* Instruction banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 max-w-md mx-auto text-left text-xs space-y-2">
              <div className="font-bold text-emerald-950 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Next Step in WhatsApp:</span>
              </div>
              <p className="text-emerald-900/90 text-[11px] leading-relaxed">
                If you haven&apos;t attached your prescription photo yet, simply tap the <strong>📎 paperclip</strong> or <strong>📷 camera icon</strong> in the WhatsApp chat to send the photo directly to our pharmacist.
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5 max-w-md mx-auto pt-2">
              <a
                href={
                  submittedRx.directMode
                    ? generateDirectPrescriptionWhatsAppUrl(
                        { name: customerName, phone, address, notes, urgency },
                        storeConfig
                      )
                    : generatePrescriptionWhatsAppUrl(submittedRx, storeConfig)
                }
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/25 transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white/20" />
                <span>Open / Return to WhatsApp Chat</span>
              </a>

              {selectedFile && (
                <button
                  type="button"
                  onClick={handleCopyImageToClipboard}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Copy Image to Clipboard (Paste in WhatsApp)</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition cursor-pointer"
              >
                Close &amp; Return to Storefront
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* TAB SELECTOR: Direct WhatsApp vs Attach Photo Here */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTab('direct')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'direct'
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Direct WhatsApp (Fastest)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('attach')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'attach'
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Attach Photo File Here</span>
              </button>
            </div>

            {/* TAB 1: DIRECT WHATSAPP (INSTANT UPLOAD TO WHATSAPP) */}
            {activeTab === 'direct' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Highlight Card */}
                <div className="p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 border-2 border-emerald-400 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-950 font-black text-sm">
                    <span className="p-1 rounded-lg bg-emerald-600 text-white">
                      <Zap className="w-4 h-4" />
                    </span>
                    <span>Direct WhatsApp Prescription Upload</span>
                  </div>

                  <p className="text-xs text-emerald-900/90 leading-relaxed">
                    Skip uploading files to the website! Tap the button below to open Jan Chemist WhatsApp directly (<strong>{storeConfig.displayPhone}</strong>). You can take a photo or attach your prescription straight from your phone camera or gallery.
                  </p>

                  <div className="space-y-1.5 text-[11px] text-emerald-950 font-medium">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Zero upload wait &bull; Instant chat with certified pharmacist</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>100% Genuine medicines sourced directly from verified distributors</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Express home delivery across city (8:00 AM - 1:00 AM)</span>
                    </div>
                  </div>
                </div>

                {/* Quick Optional Info Before Opening WhatsApp */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-800">
                    Optional Details (included in your WhatsApp message):
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Patient Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="e.g. Tariq Mehmood"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Your WhatsApp Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="e.g. 03201234567"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Delivery Address (Optional)
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="e.g. House # 12, Street 4, Sector F-8, Islamabad"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Medicine Names / Dosage Instructions (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="e.g. Panadol Extra 2 packs, Lipitor 20mg, or specific brand preference..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  {/* Urgency selector */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Delivery Urgency:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setUrgency('standard')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          urgency === 'standard'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Standard Delivery (1-2 hrs)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUrgency('urgent')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          urgency === 'urgent'
                            ? 'border-red-600 bg-red-50 text-red-900 font-bold'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-red-600 font-black">🚨</span>
                        <span>Urgent Priority (30-45 mins)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Big Direct WhatsApp Launch Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleDirectWhatsAppPrescription}
                    className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-700 hover:to-green-800 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-700/30 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <MessageCircle className="w-5 h-5 fill-white/20" />
                    <span>Directly Send Prescription to WhatsApp ({storeConfig.displayPhone})</span>
                  </button>
                  <p className="text-[11px] text-center text-slate-500 mt-2">
                    Opens WhatsApp chat with <strong>Jan Chemist Official Dispensary</strong> where you can attach your prescription photo.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: ATTACH PHOTO FILE HERE */}
            {activeTab === 'attach' && (
              <form onSubmit={handleFormSubmit} className="space-y-3.5 animate-in fade-in duration-150">
                {/* Drag and Drop File Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Select Prescription Photo or Document:
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className="hidden"
                  />

                  {!imagePreview ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-emerald-400 hover:border-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl p-5 text-center cursor-pointer transition space-y-2"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-800">
                          Click to snap photo or upload prescription
                        </span>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Supports JPG, PNG, PDF up to 20MB. Clear daylight photo recommended.
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-white px-3 py-1 rounded-full shadow-xs border border-emerald-200">
                        <Camera className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Take Photo / Browse File</span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative border border-emerald-300 rounded-2xl p-3 bg-emerald-50/70 flex items-center gap-3">
                      <img
                        src={imagePreview}
                        alt="Prescription preview"
                        className="w-16 h-16 object-cover rounded-xl border border-emerald-200 shadow-xs bg-white"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <div className="font-bold text-slate-900 truncate">{fileName}</div>
                        <div className="text-slate-500">{fileSize} &bull; Ready to send</div>
                        <div className="text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Photo selected</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Patient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="e.g. Muhammad Tariq"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      WhatsApp Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="e.g. 03201234567"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Complete Delivery Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="e.g. House # 12, Street 4, Sector G-9, Islamabad"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Medicine Names or Dosage Instructions (Optional):
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Panadol Extra 2 packs, Surbex Z 1 bottle, please confirm brand authenticity..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                {/* Authenticity Guarantee Note */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Original Guarantee:</strong> Jan Chemist provides 100% genuine pharmaceutical drugs sourced directly from authorized manufacturers.
                  </span>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-700 hover:to-green-800 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/30 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5 fill-white/20" />
                    <span>Confirm &amp; Send to Pharmacist on WhatsApp</span>
                  </button>
                  <p className="text-[11px] text-center text-slate-400 mt-2">
                    WhatsApp will open directly to Jan Chemist hotline: <strong>{storeConfig.displayPhone}</strong>
                  </p>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
