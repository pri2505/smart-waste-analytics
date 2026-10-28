import React from 'react';
import {
  Radio,
  Wifi,
  Battery,
  AlertTriangle,
  Clock,
  Cpu,
  Layers,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { useBins } from '../contexts/BinContext';

interface LiveMonitoringProps {
  openSimulator: () => void;
}

export const LiveMonitoring: React.FC<LiveMonitoringProps> = ({ openSimulator }) => {
  const { bins, devices, readings, lastSyncTime } = useBins();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 radar-live" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Live Field Sensor Grid
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Real-Time Ultrasonic IoT Telemetry
          </h2>
          <p className="text-xs text-slate-400">
            Live measurements streamed directly from ESP32 edge nodes deployed at municipal recycling bins.
          </p>
        </div>

        <button
          onClick={openSimulator}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-semibold text-xs rounded-xl border border-amber-500/30 transition shadow-sm"
        >
          <Cpu className="w-4 h-4 text-amber-400" />
          <span>Open Hardware Simulator</span>
        </button>
      </div>

      {/* Grid of Bins with Physical Fill Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {bins.map((bin) => {
          const device = devices.find(d => d.id === bin.sensorId);
          const fill = bin.currentFillPercentage;
          const isFull = fill >= 90;
          const isAlmost = fill >= 70 && fill < 90;
          const isOffline = bin.status === 'Offline';

          return (
            <div
              key={bin.id}
              className={`rounded-2xl border p-5 bg-slate-900/90 shadow-xl transition-all relative overflow-hidden flex flex-col justify-between ${
                isFull
                  ? 'border-rose-500/40 shadow-rose-950/20'
                  : isAlmost
                  ? 'border-amber-500/40 shadow-amber-950/20'
                  : isOffline
                  ? 'border-slate-800 opacity-80'
                  : 'border-slate-800 hover:border-emerald-500/40'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {bin.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {device?.batteryLevel !== undefined && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        <Battery className="w-3 h-3 text-emerald-400" />
                        {device.batteryLevel}%
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isFull ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                      isAlmost ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                      isOffline ? 'bg-slate-700/40 text-slate-400 border-slate-600/40' :
                      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {bin.status}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white truncate">{bin.name}</h3>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{bin.location}</p>
                <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800">
                  {bin.category}
                </span>
              </div>

              {/* Visual Ultrasonic Fill Cylinder */}
              <div className="my-5 p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                {/* Physical Tank Graphic */}
                <div className="w-16 h-28 bg-slate-900 rounded-xl border-2 border-slate-700 relative overflow-hidden flex flex-col justify-end p-0.5 shadow-inner">
                  {/* Liquid fill */}
                  <div
                    className={`w-full rounded-lg transition-all duration-700 relative ${
                      isFull ? 'bg-gradient-to-t from-rose-700 to-rose-500' :
                      isAlmost ? 'bg-gradient-to-t from-amber-700 to-amber-500' :
                      'bg-gradient-to-t from-emerald-700 to-emerald-500'
                    }`}
                    style={{ height: `${Math.min(fill, 100)}%` }}
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-white/30" />
                  </div>

                  {/* Ultrasonic Sensor Beam Illustration at Top */}
                  <div className="absolute top-1 inset-x-0 flex flex-col items-center">
                    <div className="w-5 h-1.5 bg-slate-600 rounded-t-sm" />
                    <div className="w-1 h-2 bg-emerald-400/40 animate-pulse" />
                  </div>
                </div>

                {/* Metrics Callout */}
                <div className="flex-1 space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Calculated Fill Level</span>
                    <span className={`text-2xl font-black font-mono ${
                      isFull ? 'text-rose-400' : isAlmost ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {fill}%
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-300 space-y-0.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Distance:</span>
                      <strong className="text-white">{bin.currentDistanceCm} cm</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bin Depth:</span>
                      <span>{bin.dimensions.heightCm} cm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer: Hardware & Last Seen */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${bin.sensorId ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span className="font-mono text-slate-300">{bin.sensorId || 'No Hardware'}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>
                    {bin.lastSensorUpdate ? new Date(bin.lastSensorUpdate).toLocaleTimeString() : 'No pulses yet'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Stream Telemetry Log Ticker */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Live Ingestion Telemetry Stream</h3>
            <span className="text-xs text-slate-500 font-mono">(Last {readings.length} readings received)</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Push Stream Active
          </span>
        </div>

        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase bg-slate-950/80 text-slate-400 sticky top-0 border-b border-slate-800">
              <tr>
                <th className="px-4 py-2.5">Time</th>
                <th className="px-4 py-2.5">Device Node ID</th>
                <th className="px-4 py-2.5">Bound Bin ID</th>
                <th className="px-4 py-2.5">Raw Distance</th>
                <th className="px-4 py-2.5">Computed Fill %</th>
                <th className="px-4 py-2.5">Source Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {readings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500 font-sans">
                    No sensor readings received yet. Launch the simulator or connect an ESP32.
                  </td>
                </tr>
              ) : (
                readings.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-2 text-slate-400">
                      {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-4 py-2 text-emerald-400 font-bold">
                      {r.deviceId}
                    </td>
                    <td className="px-4 py-2 text-slate-200">
                      {r.binId}
                    </td>
                    <td className="px-4 py-2 text-white">
                      {r.distanceCm} cm
                    </td>
                    <td className="px-4 py-2 font-bold">
                      <span className={
                        r.fillPercentage >= 90 ? 'text-rose-400' :
                        r.fillPercentage >= 70 ? 'text-amber-400' : 'text-emerald-400'
                      }>
                        {r.fillPercentage}%
                      </span>
                    </td>
                    <td className="px-4 py-2 font-sans">
                      {r.isSimulated ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Dev Simulator
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          Physical Hardware
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
