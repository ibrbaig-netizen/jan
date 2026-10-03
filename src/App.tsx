/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AdminPortal } from './components/AdminPortal';
import { CartDrawer } from './components/CartDrawer';
import { DepartmentBar } from './components/DepartmentBar';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { Footer } from './components/Footer';
import { HeroBanner } from './components/HeroBanner';
import { Navbar } from './components/Navbar';
import { OwnerLoginScreen } from './components/OwnerLoginScreen';
import { PrescriptionUploadModal } from './components/PrescriptionUploadModal';
import { ProductGrid } from './components/ProductGrid';
import { StoreSearchOverlay } from './components/StoreSearchOverlay';
import { Toast } from './components/Toast';
import { StoreProvider, useStore } from './context/StoreContext';

const StoreContent: React.FC = () => {
  const { isAdminView, isOwnerAuthenticated } = useStore();

  // 1. SEPARATE OWNER PORTAL ROUTE
  if (isAdminView) {
    if (!isOwnerAuthenticated) {
      return (
        <div className="min-h-screen bg-slate-950 font-sans selection:bg-purple-600 selection:text-white">
          <OwnerLoginScreen />
          <Toast />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-100 font-sans selection:bg-purple-600 selection:text-white">
        <AdminPortal />
        <Toast />
      </div>
    );
  }

  // 2. SEPARATE CUSTOMER FRONTEND (100% Pure Retail & Pharmacy Experience)
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans selection:bg-emerald-600 selection:text-white transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Storefront Flow */}
      <main className="flex-1">
        {/* Hero Banner with Brand Story, Prescription Upload CTA, and Timings */}
        <HeroBanner />

        {/* Sticky Department Filter Navigation */}
        <DepartmentBar />

        {/* Products Grid with Sorting, Search, and Quick WhatsApp Orders */}
        <ProductGrid />
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals & Overlays for Customer */}
      <CartDrawer />
      <PrescriptionUploadModal />
      <StoreSearchOverlay />
      <FloatingWhatsApp />
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <StoreContent />
    </StoreProvider>
  );
}
