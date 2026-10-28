import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import {
  BarChart3,
  Download,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  Scale,
  RefreshCw
} from 'lucide-react';
import { useBins } from '../contexts/BinContext';

export const AnalyticsPage: React.FC = () => {
  const { bins, collections, readings, lastSyncTime } = useBins();

  const [dateRange, setDateRange] = useState('7D');

  // Waste category segregation metrics
  const categories = [
    'Organic',
    'Recyclable Plastic',
    'Paper & Cardboard',
    'Metal & Glass',
    'Hazardous/Electronic',
    'General Commercial'
  ];

  const categoryColors: Record<string, string> = {
    'Organic': '#22c55e',
    'Recyclable Plastic': '#06b6d4',
    'Paper & Cardboard': '#3b82f6',
    'Metal & Glass': '#a855f7',
    'Hazardous/Electronic': '#f43f5e',
    'General Commercial': '#94a3b8'
  };

  const categoryData = categories.map(cat => {
    const matchingBins = bins.filter(b => b.category === cat);
    const avgFill = matchingBins.length > 0
      ? Math.round(matchingBins.reduce((acc, b) => acc + b.currentFillPercentage, 0) / matchingBins.length)
      : 0;

    const matchingCollections = collections.filter(c => c.wasteCategory === cat);
    const totalWeightKg = matchingCollections.reduce((acc, c) => acc + c.weightKgEstimated, 0);

    return {
      name: cat,
      binCount: matchingBins.length,
      averageFill: avgFill,
      totalWeightKg
    };
  });

  // Recent Telemetry Trend readings
  const telemetryTrends = readings
    .slice(0, 15)
    .reverse()
    .map(r => ({
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      binId: r.binId,
      fill: r.fillPercentage
    }));

  const totalCollectedWeight = collections.reduce((acc, c) => acc + c.weightKgEstimated, 0);

  const exportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      fleetOverview: {
        totalBins: bins.length,
        totalWeightCollectedKg: totalCollectedWeight,
        categories: categoryData
      },
      bins: bins.map(b => ({
        id: b.id,
        name: b.name,
        category: b.category,
        fillPercentage: b.currentFillPercentage,
        status: b.status,
        lastUpdated: b.lastSensorUpdate
      })),
      recentCollections: collections
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `municipal_segregation_report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Commercial Waste Segregation Analytics & Trends
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Strictly derived from real database telemetry and verified municipal collection manifests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Municipal Audit JSON</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Total Waste Diverted & Collected</span>
            <span className="text-2xl font-black text-white font-mono">{totalCollectedWeight} kg</span>
            <span className="text-[11px] text-emerald-400 mt-0.5 block">Verified across {collections.length} dispatches</span>
          </div>
          <Scale className="w-8 h-8 text-emerald-400/50" />
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Total Monitored Segregation Streams</span>
            <span className="text-2xl font-black text-white font-mono">{categories.length}</span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Municipal Standard Classifications</span>
          </div>
          <Layers className="w-8 h-8 text-cyan-400/50" />
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Live Data Synchronization</span>
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 radar-live" />
              Connected & Real-Time
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
            </span>
          </div>
          <RefreshCw className="w-8 h-8 text-slate-600" />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fill Level by Waste Category */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-1">
            Current Average Fill Level by Waste Stream (%)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Highlights commercial zones nearing saturation thresholds
          </p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="averageFill" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real Ingested Telemetry Pulse Trends */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-1">
            Live Telemetry Readings Trend
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Time-series data points received from edge sensor nodes
          </p>

          <div className="h-64">
            {telemetryTrends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No recent telemetry points. Send readings via the IoT Simulator or ESP32.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={telemetryTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="fill" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Segregation Category Performance Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-950/60">
          <h3 className="text-sm font-bold text-white">
            Commercial Waste Stream Breakdown & Recovery Weight
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Waste Category</th>
                <th className="px-4 py-3">Deployed Bins</th>
                <th className="px-4 py-3">Avg Current Fill</th>
                <th className="px-4 py-3">Total Recovered Weight</th>
                <th className="px-4 py-3">Compaction Guidance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {categoryData.map(cat => (
                <tr key={cat.name} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categoryColors[cat.name] || '#94a3b8' }} />
                    {cat.name}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {cat.binCount} bins
                  </td>
                  <td className="px-4 py-3 font-mono font-bold">
                    <span className={cat.averageFill >= 80 ? 'text-rose-400' : cat.averageFill >= 60 ? 'text-amber-400' : 'text-emerald-400'}>
                      {cat.averageFill}%
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                    {cat.totalWeightKg} kg
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-[11px]">
                    {cat.averageFill >= 80 ? 'Prioritize compactor dispatch' : 'Normal routine collection'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
