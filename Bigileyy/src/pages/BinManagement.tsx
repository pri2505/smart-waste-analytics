import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  Search,
  Edit2,
  Trash,
  Link,
  Unlink,
  Eye,
  X,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Radio,
  Sliders,
  ShieldAlert
} from 'lucide-react';
import { useBins } from '../contexts/BinContext';
import { useAuth } from '../contexts/AuthContext';
import { Bin, WasteCategory, CollectionStatus } from '../types';

export const BinManagement: React.FC = () => {
  const { bins, devices, readings, addBin, updateBin, deleteBin, bindDevice, unbindDevice } = useBins();
  const { isAdmin, isStaff } = useAuth();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBin, setEditingBin] = useState<Bin | null>(null);
  const [binToDelete, setBinToDelete] = useState<Bin | null>(null);
  const [binToBind, setBinToBind] = useState<Bin | null>(null);
  const [selectedDeviceToBind, setSelectedDeviceToBind] = useState('');
  const [detailBin, setDetailBin] = useState<Bin | null>(null);

  // Form State
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formZone, setFormZone] = useState('Commercial Zone A');
  const [formCategory, setFormCategory] = useState<WasteCategory>('Organic');
  const [formHeight, setFormHeight] = useState(100);
  const [formOffset, setFormOffset] = useState(5);
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filteredBins = bins.filter(b => {
    const matchesSearch =
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.location.toLowerCase().includes(search.toLowerCase()) ||
      (b.sensorId && b.sensorId.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || b.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const resetForm = () => {
    setFormId('');
    setFormName('');
    setFormLocation('');
    setFormZone('Commercial Zone A');
    setFormCategory('Organic');
    setFormHeight(100);
    setFormOffset(5);
    setFormNotes('');
    setFormError(null);
  };

  const openAddModal = () => {
    resetForm();
    // Suggest next available sequential ID
    const nextNum = bins.length + 101;
    setFormId(`BIN-MUC-${nextNum}`);
    setIsAddOpen(true);
  };

  const openEditModal = (bin: Bin) => {
    setEditingBin(bin);
    setFormId(bin.id);
    setFormName(bin.name);
    setFormLocation(bin.location);
    setFormZone(bin.zone);
    setFormCategory(bin.category);
    setFormHeight(bin.dimensions.heightCm);
    setFormOffset(bin.dimensions.sensorOffsetCm);
    setFormNotes(bin.notes || '');
    setFormError(null);
  };

  const handleSaveBin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formId.trim()) {
      setFormError('Unique Bin ID is required.');
      return;
    }
    if (!formName.trim()) {
      setFormError('Bin Name is required.');
      return;
    }
    if (!formLocation.trim()) {
      setFormError('Location is required.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingBin) {
        // Edit existing
        await updateBin(editingBin.id, {
          name: formName,
          location: formLocation,
          zone: formZone,
          category: formCategory,
          dimensions: { heightCm: Number(formHeight), sensorOffsetCm: Number(formOffset) },
          notes: formNotes
        });
        setEditingBin(null);
      } else {
        // Add new
        await addBin({
          id: formId.trim().toUpperCase(),
          name: formName.trim(),
          location: formLocation.trim(),
          zone: formZone.trim(),
          category: formCategory,
          dimensions: { heightCm: Number(formHeight), sensorOffsetCm: Number(formOffset) },
          notes: formNotes.trim()
        });
        setIsAddOpen(false);
      }
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!binToDelete) return;
    setIsSaving(true);
    try {
      await deleteBin(binToDelete.id);
      setBinToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Failed to remove bin');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBindDevice = async () => {
    if (!binToBind || !selectedDeviceToBind) return;
    setIsSaving(true);
    try {
      await bindDevice(binToBind.id, selectedDeviceToBind);
      setBinToBind(null);
      setSelectedDeviceToBind('');
    } catch (err: any) {
      alert(err.message || 'Failed to bind sensor device');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnbindDevice = async (binId: string) => {
    if (!confirm('Are you sure you want to detach the physical sensor node from this bin?')) return;
    try {
      await unbindDevice(binId);
    } catch (err: any) {
      alert(err.message || 'Failed to unbind sensor device');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-emerald-400" />
            Dynamic Dustbin Fleet Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Register municipal dustbins, calibrate ultrasonic dimensions, and bind physical ESP32 sensor hardware.
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Dustbin</span>
          </button>
        ) : (
          <span className="text-xs text-slate-500 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            Read-Only Access (Admin required to add/edit bins)
          </span>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ID, name, location, or node..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Categories</option>
            <option value="Organic">Organic</option>
            <option value="Recyclable Plastic">Recyclable Plastic</option>
            <option value="Paper & Cardboard">Paper & Cardboard</option>
            <option value="Metal & Glass">Metal & Glass</option>
            <option value="Hazardous/Electronic">Hazardous/Electronic</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Normal">Normal</option>
            <option value="Almost Full">Almost Full</option>
            <option value="Full">Full</option>
            <option value="Offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Dustbins Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Bin ID</th>
                <th className="px-4 py-3">Label / Name</th>
                <th className="px-4 py-3">Location & Zone</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Assigned Sensor</th>
                <th className="px-4 py-3">Fill %</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Collection Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredBins.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No bins found.
                  </td>
                </tr>
              ) : (
                filteredBins.map((bin) => (
                  <tr key={bin.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                      {bin.id}
                    </td>

                    <td className="px-4 py-3 font-medium text-white max-w-[160px] truncate">
                      {bin.name}
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-slate-200 block">{bin.location}</span>
                      <span className="text-[10px] text-slate-500 block">{bin.zone}</span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-slate-800 text-slate-300 border-slate-700">
                        {bin.category}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {bin.sensorId ? (
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="text-emerald-400 font-bold">{bin.sensorId}</span>
                          {isAdmin && (
                            <button
                              onClick={() => handleUnbindDevice(bin.id)}
                              title="Unbind sensor device"
                              className="text-slate-500 hover:text-rose-400 p-0.5 transition"
                            >
                              <Unlink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 italic text-[11px]">None</span>
                          {isAdmin && (
                            <button
                              onClick={() => { setBinToBind(bin); setSelectedDeviceToBind(devices[0]?.id || ''); }}
                              className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5 ml-1"
                            >
                              <Link className="w-3 h-3" />
                              <span>Bind</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono font-bold">
                      <span className={
                        bin.currentFillPercentage >= 90 ? 'text-rose-400' :
                        bin.currentFillPercentage >= 70 ? 'text-amber-400' : 'text-emerald-400'
                      }>
                        {bin.currentFillPercentage}%
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        bin.status === 'Full' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                        bin.status === 'Almost Full' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        bin.status === 'Normal' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        'bg-slate-700/40 text-slate-400 border-slate-600/40'
                      }`}>
                        {bin.status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-[11px] text-slate-300">
                        {bin.collectionStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDetailBin(bin)}
                          title="View bin telemetry specifications"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              onClick={() => openEditModal(bin)}
                              title="Edit bin metadata"
                              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setBinToDelete(bin)}
                              title="Delete bin"
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Bin Modal */}
      {(isAddOpen || editingBin) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingBin ? `Edit Dustbin: ${editingBin.id}` : 'Register New Municipal Dustbin'}
              </h3>
              <button
                onClick={() => { setIsAddOpen(false); setEditingBin(null); }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBin} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ID & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Unique Bin ID *
                  </label>
                  <input
                    type="text"
                    disabled={!!editingBin}
                    placeholder="e.g. BIN-MUC-106"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">Must be globally unique</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Waste Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as WasteCategory)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Organic">Organic</option>
                    <option value="Recyclable Plastic">Recyclable Plastic</option>
                    <option value="Paper & Cardboard">Paper & Cardboard</option>
                    <option value="Metal & Glass">Metal & Glass</option>
                    <option value="Hazardous/Electronic">Hazardous/Electronic</option>
                    <option value="General Commercial">General Commercial</option>
                  </select>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bin Name / Operational Tag *
                </label>
                <input
                  type="text"
                  placeholder="e.g. South Terminal Food Court Station #1"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Location & Zone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Physical Location *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Level 2, Food Court"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Municipal Zone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Commercial Zone A"
                    value={formZone}
                    onChange={(e) => setFormZone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Total Bin Height (cm)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="300"
                    value={formHeight}
                    onChange={(e) => setFormHeight(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                  />
                  <span className="text-[10px] text-slate-500">Internal depth</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Sensor Offset (cm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formOffset}
                    onChange={(e) => setFormOffset(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                  />
                  <span className="text-[10px] text-slate-500">Mount distance to rim</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Operational Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Compaction details, access keys, or pickup schedule..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setEditingBin(null); }}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingBin ? 'Update Dustbin' : 'Register Dustbin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Delete Bin */}
      {binToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Confirm Bin Removal</h3>
              <p className="text-xs text-slate-300 mt-1">
                Are you sure you want to permanently delete <strong className="text-rose-400">{binToDelete.name} ({binToDelete.id})</strong>?
              </p>
              <p className="text-[11px] text-slate-500 mt-2">
                This action safely detaches bound sensor hardware and cleans related active alerts. This cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBinToDelete(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
              >
                {isSaving ? 'Deleting...' : 'Yes, Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sensor Binding Modal */}
      {binToBind && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Link className="w-4 h-4 text-emerald-400" />
                Associate IoT Hardware Node
              </h3>
              <button onClick={() => setBinToBind(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Select an ESP32 hardware device to bind with <strong className="text-emerald-400">{binToBind.id}</strong> ({binToBind.name}).
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Available IoT Sensor Nodes
              </label>
              <select
                value={selectedDeviceToBind}
                onChange={(e) => setSelectedDeviceToBind(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select hardware node...</option>
                {devices.map(dev => (
                  <option key={dev.id} value={dev.id}>
                    {dev.id} ({dev.status}) {dev.binId ? `[Currently bound to ${dev.binId}]` : '[Unassigned]'}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setBinToBind(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBindDevice}
                disabled={!selectedDeviceToBind || isSaving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition disabled:opacity-50"
              >
                {isSaving ? 'Binding...' : 'Confirm Association'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Bin Details Slide-over / Modal */}
      {detailBin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-mono">{detailBin.id}</h3>
                <p className="text-xs text-slate-400">{detailBin.name}</p>
              </div>
              <button onClick={() => setDetailBin(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Category</span>
                <strong className="text-emerald-400">{detailBin.category}</strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Current Status</span>
                <strong className="text-white">{detailBin.status}</strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Fill Percentage</span>
                <strong className="text-white font-mono text-base">{detailBin.currentFillPercentage}%</strong>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Ultrasonic Distance</span>
                <strong className="text-white font-mono text-base">{detailBin.currentDistanceCm} cm</strong>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="text-white font-medium">{detailBin.location} ({detailBin.zone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hardware Node:</span>
                <span className="text-emerald-400 font-mono">{detailBin.sensorId || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Internal Depth:</span>
                <span className="text-white font-mono">{detailBin.dimensions.heightCm} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mounting Offset:</span>
                <span className="text-white font-mono">{detailBin.dimensions.sensorOffsetCm} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Telemetry:</span>
                <span className="text-slate-300">
                  {detailBin.lastSensorUpdate ? new Date(detailBin.lastSensorUpdate).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setDetailBin(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
