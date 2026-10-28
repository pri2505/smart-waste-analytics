import React, { useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  Radio,
  Truck,
  CheckCircle2,
  TrendingUp,
  Cpu,
  ArrowUpRight,
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';
import { useBins } from '../contexts/BinContext';
import { useAuth } from '../contexts/AuthContext';
import { WasteCategory, BinStatus } from '../types';

interface DashboardProps {
  onNavigateTab: (tab: string) => void;
  openSimulator: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateTab, openSimulator }) => {
  const { bins, alerts, collections, devices, lastSyncTime } = useBins();
  const { isStaff } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const totalBins = bins.length;
  const normalBins = bins.filter(b => b.status === 'Normal').length;
  const almostFullBins = bins.filter(b => b.status === 'Almost Full').length;
  const fullBins = bins.filter(b => b.status === 'Full').length;
  const offlineBins = bins.filter(b => b.status === 'Offline').length;
  const pendingCollections = bins.filter(b => b.collectionStatus === 'Collection Pending' || b.collectionStatus === 'In Transit').length;

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const onlineDevices = devices.filter(d => d.status === 'Online').length;

  // Filter bins
  const filteredBins = bins.filter(b => {
    if (selectedCategory !== 'ALL' && b.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && b.status !== selectedStatus) return false;
    return true;
  });

  const getStatusColor = (status: BinStatus) => {
    switch (status) {
      case 'Full': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'Almost Full': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Normal': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Offline': return 'bg-slate-700/40 text-slate-400 border-slate-600/40';
    }
  };

  const getCategoryBadge = (category: WasteCategory) => {
    switch (category) {
      case 'Organic': return 'bg-emerald-950/60 text-emerald-300 border-emerald-600/30';
      case 'Recyclable Plastic': return 'bg-cyan-950/60 text-cyan-300 border-cyan-600/30';
      case 'Paper & Cardboard': return 'bg-blue-950/60 text-blue-300 border-blue-600/30';
      case 'Metal & Glass': return 'bg-purple-950/60 text-purple-300 border-purple-600/30';
      case 'Hazardous/Electronic': return 'bg-rose-950/60 text-rose-300 border-rose-600/30';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Welcome & Telemetry Ticker Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 radar-live" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Live Municipal Network Connected
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Commercial Solid Waste Segregation & IoT Optimization
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time ultrasonic fill monitoring, autonomous overflow alert dispatching, and material segregation telemetry across municipal recycling plants.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <button
            onClick={openSimulator}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-semibold text-xs rounded-xl border border-amber-500/30 shadow-md transition"
          >
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>Launch IoT Simulator</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Bins */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Bins</span>
            <Trash2 className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalBins}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across 3 Zones</div>
        </div>

        {/* Normal Bins */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-medium">Normal</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{normalBins}</div>
          <div className="text-[11px] text-slate-500 mt-1">&lt;70% Capacity</div>
        </div>

        {/* Almost Full */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-medium">Almost Full</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">{almostFullBins}</div>
          <div className="text-[11px] text-slate-500 mt-1">70% to 89%</div>
        </div>

        {/* Full / Overflow */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-xs font-medium">Full / Action</span>
            <AlertTriangle className="w-4 h-4 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">{fullBins}</div>
          <div className="text-[11px] text-rose-400/80 mt-1">≥90% Threshold</div>
        </div>

        {/* Offline Nodes */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Offline Nodes</span>
            <Radio className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-300 font-mono">{offlineBins}</div>
          <div className="text-[11px] text-slate-500 mt-1">&gt;15m Silent</div>
        </div>

        {/* Collection Pending */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <span className="text-xs font-medium">Pickup Queued</span>
            <Truck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono">{pendingCollections}</div>
          <div className="text-[11px] text-slate-500 mt-1">Compactor Ready</div>
        </div>
      </div>

      {/* Urgent Incident Alert Bar (if active alerts) */}
      {activeAlerts.length > 0 && (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                {activeAlerts.length} Municipal Incident(s) Requiring Attention
              </h4>
              <p className="text-xs text-rose-200/90 line-clamp-1">
                Latest: {activeAlerts[0]?.message}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('alerts')}
            className="px-3.5 py-1.5 bg-rose-500 text-white font-bold text-xs rounded-lg hover:bg-rose-600 transition shrink-0"
          >
            Review Incidents
          </button>
        </div>
      )}

      {/* Main Monitoring Table & Filter Controls */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Live Dustbin Fleet Status</h3>
            <span className="text-xs text-slate-500 font-mono">({filteredBins.length} bins shown)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Waste Streams</option>
              <option value="Organic">Organic</option>
              <option value="Recyclable Plastic">Recyclable Plastic</option>
              <option value="Paper & Cardboard">Paper & Cardboard</option>
              <option value="Metal & Glass">Metal & Glass</option>
              <option value="Hazardous/Electronic">Hazardous/Electronic</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Normal">Normal (&lt;70%)</option>
              <option value="Almost Full">Almost Full (70-89%)</option>
              <option value="Full">Full (≥90%)</option>
              <option value="Offline">Offline</option>
            </select>

            <button
              onClick={() => onNavigateTab('bins')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold px-2 py-1 transition flex items-center gap-1"
            >
              <span>Manage Bins</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Bin ID & Name</th>
                <th className="px-4 py-3">Location & Zone</th>
                <th className="px-4 py-3">Waste Category</th>
                <th className="px-4 py-3">Hardware Node</th>
                <th className="px-4 py-3">Fill Capacity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Telemetry</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredBins.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No bins match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredBins.map((bin) => {
                  const fill = bin.currentFillPercentage;
                  const isFull = fill >= 90;
                  const isAlmost = fill >= 70 && fill < 90;

                  return (
                    <tr key={bin.id} className="hover:bg-slate-800/40 transition">
                      {/* ID & Name */}
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-white block">
                          {bin.id}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[180px] block">
                          {bin.name}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3">
                        <span className="text-slate-200 block">{bin.location}</span>
                        <span className="text-[10px] text-slate-500 block">{bin.zone}</span>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getCategoryBadge(bin.category)}`}>
                          {bin.category}
                        </span>
                      </td>

                      {/* Sensor */}
                      <td className="px-4 py-3">
                        {bin.sensorId ? (
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
                            <span className={`w-1.5 h-1.5 rounded-full ${bin.status === 'Offline' ? 'bg-slate-500' : 'bg-emerald-400'}`} />
                            <span>{bin.sensorId}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">Unassigned</span>
                        )}
                      </td>

                      {/* Fill Progress Bar */}
                      <td className="px-4 py-3 min-w-[140px]">
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                          <span className={`font-bold ${isFull ? 'text-rose-400' : isAlmost ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {fill}%
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            {bin.currentDistanceCm}cm dist
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isFull ? 'bg-rose-500' : isAlmost ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(fill, 100)}%` }}
                          />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(bin.status)}`}>
                          {bin.status}
                        </span>
                      </td>

                      {/* Last Telemetry */}
                      <td className="px-4 py-3 text-[11px] text-slate-400">
                        {bin.lastSensorUpdate ? (
                          new Date(bin.lastSensorUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        ) : (
                          <span className="text-slate-600">Never</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onNavigateTab('live')}
                          className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
                        >
                          Telemetry
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
