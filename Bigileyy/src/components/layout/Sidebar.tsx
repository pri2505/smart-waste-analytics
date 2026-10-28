import React from 'react';
import {
  LayoutDashboard,
  Trash2,
  Radio,
  AlertTriangle,
  BarChart3,
  Truck,
  Users,
  Sliders,
  Cpu,
  BookOpen,
  LogOut,
  ShieldCheck,
  UserCheck,
  Eye
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBins } from '../../contexts/BinContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openSimulator: () => void;
  openHardwareGuide: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openSimulator,
  openHardwareGuide
}) => {
  const { user, isAdmin, isStaff, logout, switchRolePreset } = useAuth();
  const { alerts, bins } = useBins();

  const unreadAlerts = alerts.filter(a => a.status === 'active').length;
  const pendingCollections = bins.filter(b => b.collectionStatus === 'Collection Pending' || b.collectionStatus === 'In Transit').length;

  const navItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'bins', label: 'Bin Management', icon: Trash2 },
    { id: 'live', label: 'Live IoT Telemetry', icon: Radio, pulse: true },
    { id: 'alerts', label: 'Alerts & Incidents', icon: AlertTriangle, badge: unreadAlerts, badgeColor: 'bg-rose-500' },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'collections', label: 'Collection Fleet', icon: Truck, badge: pendingCollections, badgeColor: 'bg-amber-500' },
    ...(isAdmin ? [{ id: 'users', label: 'User Management', icon: Users }] : []),
    ...(isAdmin ? [{ id: 'settings', label: 'System Settings', icon: Sliders }] : [])
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-30 backdrop-blur-md select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-xl">
          ♻️
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
            EcoSegregate
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              IoT
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium truncate max-w-[150px]">
            Commercial Segregation
          </p>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase px-3 mb-2">
          Municipal Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-2">
                {item.pulse && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 radar-live" />
                )}
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${item.badgeColor || 'bg-slate-700'}`}>
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {/* Hardware & Simulator Tools Section */}
        <div className="pt-4 mt-4 border-t border-slate-800/80">
          <div className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase px-3 mb-2">
            IoT Developer Tools
          </div>

          <button
            onClick={openSimulator}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all"
          >
            <Cpu className="w-4 h-4 text-amber-400" />
            <div className="text-left flex-1">
              <span className="block leading-tight">IoT Test Simulator</span>
              <span className="text-[10px] text-amber-400/70 font-normal">Test ultrasonic inputs</span>
            </div>
          </button>

          <button
            onClick={openHardwareGuide}
            className="w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>ESP32 Wiring Guide</span>
          </button>
        </div>
      </nav>

      {/* Role Switcher & User Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        {/* Role Quick-Switch */}
        <div className="mb-2.5 bg-slate-900 rounded-lg p-1.5 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[10px] text-slate-400 font-medium px-1">Role:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => switchRolePreset('Admin')}
              title="Switch to Admin (Full access)"
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                isAdmin
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => switchRolePreset('Staff')}
              title="Switch to Municipal Staff"
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                isStaff && !isAdmin
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Staff
            </button>
            <button
              onClick={() => switchRolePreset('Viewer')}
              title="Switch to Read-Only Viewer"
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                !isStaff && !isAdmin
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Viewer
            </button>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              isAdmin ? 'bg-rose-600 text-white' : isStaff ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
            }`}>
              {isAdmin ? <ShieldCheck className="w-4 h-4" /> : isStaff ? <UserCheck className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.name || 'Municipal User'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.role || 'Guest'}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
