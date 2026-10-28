import React, { useState } from 'react';
import {
  Bell,
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  BellRing
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useBins } from '../../contexts/BinContext';

interface TopNavProps {
  title: string;
  subtitle?: string;
  onNavigateToAlerts?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ title, subtitle, onNavigateToAlerts }) => {
  const { sseConnected, browserPermission, requestNotificationPermission } = useNotifications();
  const { alerts, devices, refreshData, loading, lastSyncTime } = useBins();
  const [showBellDropdown, setShowBellDropdown] = useState(false);

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const onlineDevices = devices.filter(d => d.status === 'Online').length;

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Title & Context */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
        )}
      </div>

      {/* Status Indicators & Action Controls */}
      <div className="flex items-center gap-3">
        {/* SSE Stream Status Badge */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${
          sseConnected
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
        }`}>
          {sseConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span>LIVE SSE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 radar-live ml-0.5" />
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>OFFLINE</span>
            </>
          )}
        </div>

        {/* Nodes Online Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-slate-800/80 text-slate-300 border border-slate-700/60">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Nodes: <strong className="text-white">{onlineDevices}</strong>/{devices.length} Online</span>
        </div>

        {/* Browser Notification Permission Button */}
        {browserPermission !== 'granted' && (
          <button
            onClick={requestNotificationPermission}
            title="Enable browser notifications for urgent overflow alerts"
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg transition"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Enable Push</span>
          </button>
        )}

        {/* Manual Refresh Button */}
        <button
          onClick={refreshData}
          disabled={loading}
          title={`Last synced: ${new Date(lastSyncTime).toLocaleTimeString()}`}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowBellDropdown(!showBellDropdown)}
            className="p-2 relative text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <Bell className="w-4 h-4" />
            {activeAlerts.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900" />
            )}
          </button>

          {showBellDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Active Municipal Incidents ({activeAlerts.length})
                </span>
                {onNavigateToAlerts && (
                  <button
                    onClick={() => {
                      setShowBellDropdown(false);
                      onNavigateToAlerts();
                    }}
                    className="text-[10px] text-emerald-400 hover:underline font-semibold"
                  >
                    View All
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                {activeAlerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400/60 mx-auto mb-2" />
                    No active overflow or offline incidents.
                  </div>
                ) : (
                  activeAlerts.map(alert => (
                    <div key={alert.id} className="p-3 hover:bg-slate-800/50 transition text-left">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className={`font-semibold px-1.5 py-0.2 rounded ${
                          alert.severity === 'critical' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {alert.type}
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-200 line-clamp-2">
                        {alert.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {alert.location || alert.binName}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
