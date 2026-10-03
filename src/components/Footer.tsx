import React, { useState } from 'react';
import {
  Clock,
  Download,
  FileText,
  Heart,
  Info,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Smartphone,
  Truck,
  X
} from 'lucide-react';
import { DEPARTMENTS } from '../data/departments';
import { useStore } from '../context/StoreContext';
import { DepartmentId } from '../types';
import { JanChemistLogo } from './JanChemistLogo';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const Footer: React.FC = () => {
  const { storeConfig, setSelectedDepartment, setIsPrescriptionModalOpen, openAdminPortal, showToast } = useStore();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const handleInstallApp = async () => {
    if (isInstalled) {
      showToast('Jan Chemist App is already installed and running!', 'info');
      return;
    }
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        showToast('Thank you for installing Jan Chemist!', 'success');
      }
      return;
    }
    setShowInstallGuide(true);
  };

  return (
    <footer className="bg-slate-950 text-slate-300 pt-14 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 space-y-12">
        {/* Top 4 Value Pillars Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 border-b border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-900/60 border border-emerald-600/40 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">100% Original Products</h4>
              <p className="text-xs text-slate-400 mt-1">
                &ldquo;{storeConfig.tagline}&rdquo; — guaranteed authentic medicines &amp; consumer goods.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-900/40 border border-amber-600/40 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">8:00 AM to 1:00 AM</h4>
              <p className="text-xs text-slate-400 mt-1">
                Open 7 days a week for daytime groceries and late-night pharmacy emergencies.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-green-900/40 border border-green-600/40 text-green-400 flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">WhatsApp Fast Order</h4>
              <p className="text-xs text-slate-400 mt-1">
                Instant delivery checkout directly to hotline <strong>{storeConfig.displayPhone}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-900/40 border border-red-600/40 text-red-400 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Doctor Prescriptions</h4>
              <p className="text-xs text-slate-400 mt-1">
                Snap &amp; upload prescription. Certified pharmacist verifies and dispatches.
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer Links & Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          {/* Brand & Address */}
          <div className="lg:col-span-4 space-y-4">
            <JanChemistLogo size="md" variant="transparent-light" showTagline={true} />
            <p className="text-xs text-slate-400 leading-relaxed pr-4">
              Jan Chemist is your premier superstore and trusted healthcare provider. Offering authentic cosmetics, daily grocery, chilled beverages, quality lingerie, baby toys, party items, fine crockery, electronics, and verified prescription medicines.
            </p>
            <div className="space-y-2 text-xs text-slate-300 pt-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Timings: <strong>8:00 AM - 1:00 AM</strong> (Mon - Sun)</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Helpline: <strong>{storeConfig.displayPhone}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-400" />
                <span>Delivery WhatsApp: <strong>{storeConfig.displayPhone}</strong></span>
              </div>
            </div>
          </div>

          {/* Departments Directory */}
          <div className="lg:col-span-5 space-y-3">
            <h4 className="font-bold text-white text-sm tracking-wider uppercase">
              Our 8+ Superstore Departments
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {DEPARTMENTS.map(dept => (
                <button
                  key={dept.id}
                  onClick={() => {
                    setSelectedDepartment(dept.id);
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  className="text-left text-slate-400 hover:text-emerald-400 transition cursor-pointer py-0.5"
                >
                  • {dept.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions & Admin */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-bold text-white text-sm tracking-wider uppercase">
              Quick Customer Services
            </h4>
            <div className="space-y-2.5 text-xs">
              <button
                onClick={() => setIsPrescriptionModalOpen(true)}
                className="w-full py-2.5 px-3 bg-red-600/90 hover:bg-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
              >
                <FileText className="w-4 h-4" />
                <span>Upload Doctor Prescription</span>
              </button>

              <a
                href={`https://wa.me/${storeConfig.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Customer Care</span>
              </a>

              <button
                type="button"
                onClick={handleInstallApp}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer border border-emerald-500/40 shadow-sm"
              >
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>{isInstalled ? 'Jan Chemist App Installed' : 'Install Jan Chemist App'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* PWA Install Guide Modal in Footer */}
        {showInstallGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Install Jan Chemist App</span>
                </h4>
                <button
                  onClick={() => setShowInstallGuide(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isIOS ? (
                <div className="space-y-3 text-xs text-slate-300">
                  <p className="text-slate-400">Install directly onto your iPhone or iPad:</p>
                  <div className="space-y-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                    <p>1. Tap the <strong>Share</strong> button in Safari toolbar.</p>
                    <p>2. Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>.</p>
                    <p>3. Tap <strong>Add</strong> to use Jan Chemist with 1 tap!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-slate-300">
                  <p className="text-slate-400">Install Jan Chemist on Chrome, Edge, or Android:</p>
                  <div className="space-y-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                    <p>• Click the <strong>Install (⊕ or 📲)</strong> icon in your browser address bar.</p>
                    <p>• Or tap the browser menu (<strong>⋮</strong>) and choose <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowInstallGuide(false)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Copyright & Tagline Bottom with Backend Access Button */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-3 text-slate-400">
            <span>
              &copy; {new Date().getFullYear()} Jan Chemist. All rights reserved. &ldquo;{storeConfig.tagline}&rdquo;.
            </span>
            <span className="hidden sm:inline text-slate-700">•</span>
            {/* Discreet Staff Portal link for store owner / admin only */}
            <a
              href="/admin"
              onClick={(e) => {
                e.preventDefault();
                openAdminPortal();
              }}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 transition text-[11px] cursor-pointer"
              title="Jan Chemist Staff Portal"
            >
              <Lock className="w-3 h-3 text-slate-500" />
              <span>Staff Login</span>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-slate-400 text-[11px]">
            <span>Delivery: 8:00 AM - 1:00 AM Daily</span>
            <span>•</span>
            <span>WhatsApp: {storeConfig.displayPhone}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
