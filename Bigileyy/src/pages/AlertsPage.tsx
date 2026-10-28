import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Check,
  ShieldCheck,
  Sliders,
  AlertCircle,
  Info
} from 'lucide-react';
import { useBins } from '../contexts/BinContext';
import { useAuth } from '../contexts/AuthContext';
import { AlertStatus } from '../types';

interface AlertsPageProps {
  onNavigateToSettings?: () => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ onNavigateToSettings }) => {
  const { alerts, acknowledgeAlert, resolveAlert, settings } = useBins();
  const { user, isStaff, isAdmin } = useAuth();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const filteredAlerts = alerts.filter(a => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    return true;
  });

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const acknowledgedCount = alerts.filter(a => a.status === 'acknowledged').length;
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length;

  const handleAcknowledge = async (alertId: string) => {
    const operator = user?.name || 'Municipal Staff Operator';
    try {
      await acknowledgeAlert(alertId);
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge alert');
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await resolveAlert(alertId);
    } catch (err: any) {
      alert(err.message || 'Failed to resolve alert');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            Municipal Incident & Overflow Alert Center
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time threshold triggers, node heartbeats, and staff dispatch acknowledgements.
          </p>
        </div>

        {isAdmin && onNavigateToSettings && (
          <button
            onClick={onNavigateToSettings}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Configure Thresholds ({settings?.thresholdAlmostFull}% / {settings?.thresholdFull}%)</span>
          </button>
        )}
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-rose-950/30 border border-rose-500/30 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-300 font-medium block">Active Incidents</span>
            <span className="text-2xl font-black text-rose-400 font-mono">{activeCount}</span>
          </div>
          <AlertCircle className="w-6 h-6 text-rose-400" />
        </div>

        <div className="bg-amber-950/30 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-300 font-medium block">Staff Acknowledged</span>
            <span className="text-2xl font-black text-amber-400 font-mono">{acknowledgedCount}</span>
          </div>
          <Clock className="w-6 h-6 text-amber-400" />
        </div>

        <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-300 font-medium block">Resolved History</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">{resolvedCount}</span>
          </div>
          <CheckCircle className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-300">Filter Incidents:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Statuses ({alerts.length})</option>
            <option value="active">Active Only ({activeCount})</option>
            <option value="acknowledged">Acknowledged ({acknowledgedCount})</option>
            <option value="resolved">Resolved ({resolvedCount})</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Incident ID</th>
                <th className="px-4 py-3">Target Dustbin</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Incident Message</th>
                <th className="px-4 py-3">Fill %</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No incidents match the active filters.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => {
                  const isCrit = alert.severity === 'critical';
                  const isWarn = alert.severity === 'warning';

                  return (
                    <tr key={alert.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-400">
                        {alert.id}
                      </td>

                      <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                        {alert.binId}
                      </td>

                      <td className="px-4 py-3 text-slate-300">
                        {alert.location || alert.binName || 'General Facility'}
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-200 max-w-sm">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isCrit ? 'bg-rose-500/20 text-rose-400' : isWarn ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {alert.type}
                          </span>
                          <span className="truncate">{alert.message}</span>
                        </div>
                        {alert.acknowledgedBy && (
                          <span className="text-[10px] text-amber-400/80 block mt-0.5">
                            Acknowledged by {alert.acknowledgedBy} at {new Date(alert.acknowledgedAt || '').toLocaleTimeString()}
                          </span>
                        )}
                        {alert.resolvedAt && (
                          <span className="text-[10px] text-emerald-400/80 block mt-0.5">
                            Resolved at {new Date(alert.resolvedAt).toLocaleTimeString()}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 font-mono font-bold">
                        <span className={
                          alert.fillPercentage >= 90 ? 'text-rose-400' :
                          alert.fillPercentage >= 70 ? 'text-amber-400' : 'text-emerald-400'
                        }>
                          {alert.fillPercentage}%
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-400 text-[11px]">
                        {new Date(alert.createdAt).toLocaleString()}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          alert.status === 'active' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                          alert.status === 'acknowledged' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {alert.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Staff Actions */}
                      <td className="px-4 py-3 text-right">
                        {isStaff ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {alert.status === 'active' && (
                              <button
                                onClick={() => handleAcknowledge(alert.id)}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded border border-amber-500/30 transition"
                              >
                                Acknowledge
                              </button>
                            )}

                            {alert.status !== 'resolved' && (
                              <button
                                onClick={() => handleResolve(alert.id)}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded border border-emerald-500/30 transition"
                              >
                                Resolve
                              </button>
                            )}

                            {alert.status === 'resolved' && (
                              <span className="text-[11px] text-slate-500 italic">Closed</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Read-only</span>
                        )}
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
