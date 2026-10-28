import React, { useState } from 'react';
import {
  X,
  Cpu,
  Send,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Radio,
  Sliders,
  BatteryCharging,
  ShieldAlert
} from 'lucide-react';
import { useBins } from '../../contexts/BinContext';

interface IoTSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IoTSimulatorModal: React.FC<IoTSimulatorModalProps> = ({ isOpen, onClose }) => {
  const { bins, devices, sendSimulatedTelemetry } = useBins();

  const [selectedBinId, setSelectedBinId] = useState<string>(bins[0]?.id || 'BIN-MUC-101');
  const [distanceCm, setDistanceCm] = useState<number>(30);
  const [batteryLevel, setBatteryLevel] = useState<number>(85);
  const [rssi, setRssi] = useState<number>(-65);
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [useInvalidKey, setUseInvalidKey] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastResponse, setLastResponse] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetBin = bins.find(b => b.id === selectedBinId);
  const targetDevice = devices.find(d => d.id === targetBin?.sensorId);

  // Live calculation preview in modal
  const height = targetBin?.dimensions?.heightCm || 100;
  const offset = targetBin?.dimensions?.sensorOffsetCm || 5;
  const wasteDepth = height - (distanceCm - offset);
  const previewFill = Math.max(0, Math.min(100, Math.round((wasteDepth / height) * 100)));

  const handleSend = async (overrideDistance?: number, overrideKey?: string, isInvalidKeyTest?: boolean) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setLastResponse(null);

    const dist = overrideDistance !== undefined ? overrideDistance : distanceCm;
    const deviceId = targetBin?.sensorId || (devices[0]?.id ?? 'ESP32-NODE-01');
    const key = isInvalidKeyTest ? 'invalid_key_xxx' : (overrideKey || targetDevice?.apiKey || 'sec_node01_k9f8w2q1');

    try {
      const res = await sendSimulatedTelemetry({
        deviceId,
        distanceCm: dist,
        apiKey: key,
        batteryLevel
      });
      setLastResponse(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Telemetry transmission failed');
      setLastResponse({ success: false, error: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                IoT Sensor Telemetry Simulator
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Dev Testbed
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Simulates real HC-SR04 ultrasonic readings arriving at <code className="text-emerald-400">/api/v1/sensors/reading</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 p-3.5 px-5 flex items-start gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-amber-300">Data Integrity Notice:</strong> Every measurement sent from this simulator is strictly flagged as <code className="bg-amber-950/80 px-1 py-0.5 rounded text-amber-300">isSimulated: true</code> in the database. Simulated readings test ultrasonic math, threshold alerts, and SSE synchronization without fabricating field telemetry.
          </div>
        </div>

        {/* Body Form */}
        <div className="p-6 space-y-6">
          {/* Target Bin & Assigned Hardware */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Municipal Dustbin
              </label>
              <select
                value={selectedBinId}
                onChange={(e) => setSelectedBinId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {bins.map(bin => (
                  <option key={bin.id} value={bin.id}>
                    {bin.id} — {bin.name} ({bin.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Bound Sensor Node ID
              </label>
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-2 text-sm flex items-center justify-between text-slate-300">
                <span className="font-mono text-emerald-400 font-medium">
                  {targetBin?.sensorId || 'No Hardware Bound'}
                </span>
                <span className="text-xs text-slate-500">
                  {targetDevice?.status || 'Unlinked'}
                </span>
              </div>
            </div>
          </div>

          {/* Bin Calibration Specs */}
          <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">Bin Internal Depth:</span>{' '}
              <strong className="text-white font-mono">{height} cm</strong>
            </div>
            <div>
              <span className="text-slate-400">Sensor Mounting Offset:</span>{' '}
              <strong className="text-white font-mono">{offset} cm</strong>
            </div>
            <div>
              <span className="text-slate-400">Current Saved Fill:</span>{' '}
              <strong className="text-emerald-400 font-mono">{targetBin?.currentFillPercentage || 0}%</strong>
            </div>
          </div>

          {/* Ultrasonic Distance Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Simulated Ultrasonic Distance Measurement
              </label>
              <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {distanceCm} cm
              </span>
            </div>

            <input
              type="range"
              min="3"
              max="130"
              step="1"
              value={distanceCm}
              onChange={(e) => setDistanceCm(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />

            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>3 cm (Overfilled to sensor face)</span>
              <span>50 cm (Half filled)</span>
              <span>130 cm (Completely empty)</span>
            </div>
          </div>

          {/* Computed Fill Level Live Gauge */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Estimated Fill Level</span>
              <span className={`text-2xl font-black font-mono ${
                previewFill >= 90 ? 'text-rose-400' : previewFill >= 70 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {previewFill}%
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Status: {previewFill >= 90 ? '🚨 Full / Overflow' : previewFill >= 70 ? '⚠️ Almost Full' : '✅ Normal'}
              </span>
            </div>

            {/* Quick 1-Click Test Scenarios */}
            <div className="flex flex-wrap gap-2 justify-end max-w-xs">
              <button
                type="button"
                onClick={() => { setDistanceCm(8); handleSend(8); }}
                className="px-2.5 py-1 text-xs font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 rounded-md transition"
              >
                🚨 95% Overflow
              </button>
              <button
                type="button"
                onClick={() => { setDistanceCm(30); handleSend(30); }}
                className="px-2.5 py-1 text-xs font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 rounded-md transition"
              >
                ⚠️ 75% Warning
              </button>
              <button
                type="button"
                onClick={() => { setDistanceCm(90); handleSend(90); }}
                className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-md transition"
              >
                🧹 15% Emptied
              </button>
              <button
                type="button"
                onClick={() => { handleSend(600); }}
                className="px-2 py-1 text-[11px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition"
              >
                ⛔ Out of Range (600cm)
              </button>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => handleSend()}
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Transmitting Ingestion Pulse...' : 'Send Live Sensor Telemetry'}</span>
          </button>

          {/* Response Console */}
          {lastResponse && (
            <div className={`p-3.5 rounded-xl border text-xs font-mono overflow-x-auto ${
              lastResponse.success !== false
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">
                  {lastResponse.success !== false ? '✅ HTTP 200 Telemetry Accepted' : '❌ Ingestion Rejected'}
                </span>
                <span className="text-[10px] opacity-70">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
              <pre className="text-[11px]">
                {JSON.stringify(lastResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
