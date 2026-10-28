import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { recentToasts, dismissToast } = useNotifications();

  if (recentToasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {recentToasts.map(toast => {
        const isCrit = toast.severity === 'critical';
        const isWarn = toast.severity === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-2xl backdrop-blur-xl flex items-start gap-3 transition-all animate-in slide-in-from-top-4 duration-200 ${
              isCrit
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-100 shadow-rose-950/50'
                : isWarn
                ? 'bg-amber-950/90 border-amber-500/40 text-amber-100 shadow-amber-950/50'
                : 'bg-slate-900/90 border-slate-700/60 text-slate-100'
            }`}
          >
            <div className="mt-0.5">
              {isCrit ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
              ) : isWarn ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-blue-400 shrink-0" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider">{toast.title}</h4>
                <span className="text-[10px] opacity-70 ml-2">{toast.timestamp}</span>
              </div>
              <p className="text-xs font-medium mt-1 leading-snug">{toast.message}</p>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-white/60 hover:text-white p-1 rounded-md transition shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
