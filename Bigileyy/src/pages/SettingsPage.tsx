import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Bell,
  Clock,
  Shield,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useBins } from '../contexts/BinContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useBins();
  const { isAdmin } = useAuth();
  const { browserPermission, requestNotificationPermission } = useNotifications();

  const [thresholdAlmostFull, setThresholdAlmostFull] = useState(70);
  const [thresholdFull, setThresholdFull] = useState(90);
  const [offlineTimeoutMinutes, setOfflineTimeoutMinutes] = useState(15);
  const [enableBrowserNotifications, setEnableBrowserNotifications] = useState(true);
  const [autoDispatchCollection, setAutoDispatchCollection] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setThresholdAlmostFull(settings.thresholdAlmostFull);
      setThresholdFull(settings.thresholdFull);
      setOfflineTimeoutMinutes(settings.offlineTimeoutMinutes);
      setEnableBrowserNotifications(settings.enableBrowserNotifications);
      setAutoDispatchCollection(settings.autoDispatchCollection);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSavedSuccess(false);

    if (thresholdAlmostFull >= thresholdFull) {
      setErrorMsg('Almost Full threshold must be strictly lower than Full threshold.');
      return;
    }

    setIsSaving(true);
    try {
      await updateSettings({
        thresholdAlmostFull: Number(thresholdAlmostFull),
        thresholdFull: Number(thresholdFull),
        offlineTimeoutMinutes: Number(offlineTimeoutMinutes),
        enableBrowserNotifications: Boolean(enableBrowserNotifications),
        autoDispatchCollection: Boolean(autoDispatchCollection)
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setThresholdAlmostFull(70);
    setThresholdFull(90);
    setOfflineTimeoutMinutes(15);
    setEnableBrowserNotifications(true);
    setAutoDispatchCollection(true);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sliders className="w-5 h-5 text-emerald-400" />
          Municipal System Thresholds & Calibration
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure real-time capacity thresholds, offline detection watchdogs, and dispatch automation.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Threshold Calibration Card */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-emerald-400" />
            Fill Capacity Threshold Calibration
          </h3>

          {errorMsg && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>System thresholds updated and broadcasted to municipal fleet!</span>
            </div>
          )}

          {/* Warning Level Slider (Almost Full) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-slate-200 block">
                  Almost Full Warning Threshold
                </label>
                <span className="text-[11px] text-slate-400">
                  Triggers yellow warning alerts and queues route planning
                </span>
              </div>
              <span className="text-sm font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                {thresholdAlmostFull}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="85"
              step="1"
              disabled={!isAdmin}
              value={thresholdAlmostFull}
              onChange={(e) => setThresholdAlmostFull(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-50"
            />
          </div>

          {/* Critical Level Slider (Full) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-slate-200 block">
                  Critical Full / Overflow Threshold
                </label>
                <span className="text-[11px] text-slate-400">
                  Triggers red critical alerts, plays audio chime, and prompts emergency compactor pickup
                </span>
              </div>
              <span className="text-sm font-mono font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded border border-rose-500/20">
                {thresholdFull}%
              </span>
            </div>
            <input
              type="range"
              min="80"
              max="98"
              step="1"
              disabled={!isAdmin}
              value={thresholdFull}
              onChange={(e) => setThresholdFull(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500 disabled:opacity-50"
            />
          </div>

          {/* Visual Band Demonstration */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
            <span className="text-slate-400 text-[10px] block font-sans">Active Municipal Classification Bands:</span>
            <div className="h-4 w-full rounded-md overflow-hidden flex text-[10px] text-white font-bold text-center">
              <div style={{ width: `${thresholdAlmostFull}%` }} className="bg-emerald-600 flex items-center justify-center">
                0% - {thresholdAlmostFull}% (Normal)
              </div>
              <div style={{ width: `${thresholdFull - thresholdAlmostFull}%` }} className="bg-amber-600 flex items-center justify-center">
                Warning
              </div>
              <div style={{ width: `${100 - thresholdFull}%` }} className="bg-rose-600 flex items-center justify-center">
                Full
              </div>
            </div>
          </div>
        </div>

        {/* Watchdog & Notification Automation Card */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="w-4 h-4 text-emerald-400" />
            Watchdogs & Automation
          </h3>

          {/* Offline Watchdog Timeout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="text-xs font-semibold text-slate-200 block">
                IoT Node Offline Silence Timeout (Minutes)
              </label>
              <p className="text-[11px] text-slate-400">
                Marks a bin and its sensor as Offline if no telemetry is received within this window.
              </p>
            </div>
            <input
              type="number"
              min="2"
              max="120"
              disabled={!isAdmin}
              value={offlineTimeoutMinutes}
              onChange={(e) => setOfflineTimeoutMinutes(Number(e.target.value))}
              className="w-32 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
          </div>

          {/* Auto Dispatch Toggle */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                Auto-Queue Collection on Overflow
              </span>
              <p className="text-[11px] text-slate-400">
                Automatically updates bin collection status to 'Collection Pending' when the 90% threshold is breached.
              </p>
            </div>
            <input
              type="checkbox"
              disabled={!isAdmin}
              checked={autoDispatchCollection}
              onChange={(e) => setAutoDispatchCollection(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded"
            />
          </div>

          {/* Browser Notification Permissions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                Browser Desktop Push Alerts
              </span>
              <p className="text-[11px] text-slate-400">
                Display native OS notifications for critical overflow and offline incidents.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                browserPermission === 'granted'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                Permission: {browserPermission}
              </span>
              {browserPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={requestNotificationPermission}
                  className="px-2 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition"
                >
                  Enable
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isAdmin ? (
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Recommended Standards</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Applying Changes...' : 'Save & Broadcast Calibration'}</span>
            </button>
          </div>
        ) : (
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-400 text-center">
            Settings modification is restricted to Administrators only. Log in as an Administrator to adjust thresholds.
          </div>
        )}
      </form>
    </div>
  );
};
