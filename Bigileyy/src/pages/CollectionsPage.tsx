import React, { useState } from 'react';
import {
  Truck,
  CheckCircle,
  Clock,
  Plus,
  X,
  Scale,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { useBins } from '../contexts/BinContext';
import { useAuth } from '../contexts/AuthContext';

export const CollectionsPage: React.FC = () => {
  const { bins, collections, dispatchCollection, completeCollection } = useBins();
  const { isStaff, user } = useAuth();

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedBinId, setSelectedBinId] = useState(bins[0]?.id || '');
  const [driverName, setDriverName] = useState('Manoj Kumar (Truck #TN-09-CW-4412)');
  const [weightKg, setWeightKg] = useState(85);
  const [facility, setFacility] = useState('Central Materials Recovery Facility');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingBins = bins.filter(
    b => b.collectionStatus === 'Collection Pending' || b.collectionStatus === 'In Transit' || b.currentFillPercentage >= 85
  );

  const handleQuickDispatch = async (binId: string) => {
    try {
      await dispatchCollection(binId, 'Municipal Fleet Compactor #04');
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch collection');
    }
  };

  const handleRecordCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBinId) return;

    setIsSubmitting(true);
    try {
      await completeCollection({
        binId: selectedBinId,
        collectedBy: driverName,
        weightKgEstimated: Number(weightKg),
        destinationFacility: facility
      });
      setIsRecordModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to record collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-cyan-400" />
            Municipal Collection Fleet & Routing
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Optimize compactor truck routes, dispatch collection teams to critical bins, and record landfill diversion manifests.
          </p>
        </div>

        {isStaff && (
          <button
            onClick={() => { setSelectedBinId(pendingBins[0]?.id || bins[0]?.id || ''); setIsRecordModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record Completed Collection</span>
          </button>
        )}
      </div>

      {/* Pending Pickups Queue */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">High Priority Pickup Queue</h3>
            <span className="text-xs text-amber-400 font-mono">({pendingBins.length} bins pending dispatch)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Bin ID</th>
                <th className="px-4 py-3">Location & Zone</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Current Fill</th>
                <th className="px-4 py-3">Dispatch Status</th>
                <th className="px-4 py-3">Assigned Truck</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {pendingBins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400/50 mx-auto mb-2" />
                    All bins are within safe capacity levels. No collections pending!
                  </td>
                </tr>
              ) : (
                pendingBins.map((bin) => (
                  <tr key={bin.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                      {bin.id}
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-white block font-medium">{bin.name}</span>
                      <span className="text-[10px] text-slate-500 block">{bin.location}</span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-slate-800 text-slate-300 border-slate-700">
                        {bin.category}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono font-bold">
                      <span className={bin.currentFillPercentage >= 90 ? 'text-rose-400' : 'text-amber-400'}>
                        {bin.currentFillPercentage}%
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-500/15 text-amber-300 border-amber-500/30">
                        {bin.collectionStatus}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-[11px] text-slate-400 font-mono">
                      {bin.assignedDriver || 'Pending Driver Assign'}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {isStaff && (
                        <div className="flex items-center justify-end gap-2">
                          {bin.collectionStatus !== 'In Transit' && (
                            <button
                              onClick={() => handleQuickDispatch(bin.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg transition"
                            >
                              Dispatch Truck
                            </button>
                          )}
                          <button
                            onClick={() => { setSelectedBinId(bin.id); setIsRecordModalOpen(true); }}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg transition"
                          >
                            Mark Emptied
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Collection Log */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Historical Collection Manifests</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">({collections.length} verified logs)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Manifest ID</th>
                <th className="px-4 py-3">Dustbin ID & Name</th>
                <th className="px-4 py-3">Waste Category</th>
                <th className="px-4 py-3">Collected By</th>
                <th className="px-4 py-3">Pre-Pickup Fill</th>
                <th className="px-4 py-3">Est. Weight</th>
                <th className="px-4 py-3">Destination Facility</th>
                <th className="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {collections.map((col) => (
                <tr key={col.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 font-mono font-bold text-slate-400">
                    {col.id}
                  </td>

                  <td className="px-4 py-3">
                    <span className="font-mono text-emerald-400 font-bold block">{col.binId}</span>
                    <span className="text-[10px] text-slate-500 block">{col.binName}</span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-slate-800 text-slate-300 border-slate-700">
                      {col.wasteCategory}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-slate-200">
                    {col.collectedBy}
                  </td>

                  <td className="px-4 py-3 font-mono font-bold text-amber-400">
                    {col.fillPercentageBefore}%
                  </td>

                  <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                    {col.weightKgEstimated} kg
                  </td>

                  <td className="px-4 py-3 text-slate-300">
                    {col.destinationFacility}
                  </td>

                  <td className="px-4 py-3 text-[11px] text-slate-500 font-mono">
                    {new Date(col.collectedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Collection Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                Record Municipal Collection
              </h3>
              <button onClick={() => setIsRecordModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordCollection} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Dustbin
                </label>
                <select
                  value={selectedBinId}
                  onChange={(e) => setSelectedBinId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {bins.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.id} — {b.name} ({b.currentFillPercentage}% full)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Driver & Compactor Vehicle
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Recovered Weight (kg)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Destination Facility
                  </label>
                  <input
                    type="text"
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                Submitting this form resets the selected bin's fill percentage to <strong className="text-emerald-400">0%</strong>, resolves any active overflow alerts, and records an unalterable collection entry.
              </p>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Logging...' : 'Confirm & Reset Bin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
