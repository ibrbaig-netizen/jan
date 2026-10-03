import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const Toast: React.FC = () => {
  const { toast } = useStore();

  if (!toast) return null;

  return (
    <div className="fixed top-20 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm pointer-events-none">
      <div
        className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md ${
          toast.type === 'success'
            ? 'bg-emerald-900/95 text-white border-emerald-500/50'
            : toast.type === 'warning'
            ? 'bg-amber-900/95 text-white border-amber-500/50'
            : 'bg-slate-900/95 text-white border-slate-700'
        }`}
      >
        {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
        {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />}
        {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0" />}
        <span className="text-xs font-semibold leading-snug">{toast.message}</span>
      </div>
    </div>
  );
};
