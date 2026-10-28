import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Bin,
  IoTDevice,
  SensorReading,
  Alert,
  CollectionRecord,
  SystemSettings
} from '../types';
import { api } from '../services/api';

interface BinContextType {
  bins: Bin[];
  alerts: Alert[];
  devices: IoTDevice[];
  collections: CollectionRecord[];
  readings: SensorReading[];
  settings: SystemSettings | null;
  loading: boolean;
  error: string | null;
  lastSyncTime: string;
  refreshData: () => Promise<void>;
  addBin: (binData: Partial<Bin>) => Promise<Bin>;
  updateBin: (id: string, binData: Partial<Bin>) => Promise<Bin>;
  deleteBin: (id: string) => Promise<void>;
  bindDevice: (binId: string, deviceId: string) => Promise<void>;
  unbindDevice: (binId: string) => Promise<void>;
  dispatchCollection: (binId: string, driver?: string) => Promise<void>;
  completeCollection: (payload: { binId: string; collectedBy?: string; weightKgEstimated?: number; destinationFacility?: string }) => Promise<void>;
  acknowledgeAlert: (id: string) => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<SystemSettings>) => Promise<void>;
  registerDevice: (id: string, firmwareVersion?: string) => Promise<IoTDevice>;
  sendSimulatedTelemetry: (payload: { deviceId: string; distanceCm: number; apiKey?: string; batteryLevel?: number }) => Promise<any>;
}

const BinContext = createContext<BinContextType | undefined>(undefined);

export const BinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bins, setBins] = useState<Bin[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());

  const refreshData = useCallback(async () => {
    try {
      const [binsRes, alertsRes, devicesRes, collectionsRes, readingsRes, settingsRes] = await Promise.all([
        api.getBins(),
        api.getAlerts(),
        api.getDevices(),
        api.getCollections(),
        api.getReadings({ limit: 50 }),
        api.getSettings()
      ]);

      setBins(binsRes.bins);
      setAlerts(alertsRes.alerts);
      setDevices(devicesRes.devices);
      setCollections(collectionsRes.collections);
      setReadings(readingsRes.readings);
      setSettings(settingsRes.settings);
      setLastSyncTime(new Date().toISOString());
      setError(null);
    } catch (err: any) {
      console.error('[BinContext] Refresh error:', err);
      setError(err.message || 'Failed to sync with backend');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Hook into SSE stream for zero-latency reactive state updates
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/v1/events');

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          const { type, data } = parsed;

          switch (type) {
            case 'SENSOR_TELEMETRY': {
              const { reading, bin: updatedBin, device: updatedDevice } = data;
              if (updatedBin) {
                setBins(prev => prev.map(b => b.id === updatedBin.id ? { ...b, ...updatedBin } : b));
              }
              if (reading) {
                setReadings(prev => [reading, ...prev.slice(0, 49)]);
              }
              if (updatedDevice) {
                setDevices(prev => prev.map(d => d.id === updatedDevice.id ? { ...d, ...updatedDevice } : d));
              }
              setLastSyncTime(new Date().toISOString());
              break;
            }
            case 'ALERT_TRIGGERED': {
              const newAlert = data as Alert;
              setAlerts(prev => {
                const exists = prev.some(a => a.id === newAlert.id);
                return exists ? prev : [newAlert, ...prev];
              });
              break;
            }
            case 'ALERTS_RESOLVED': {
              const { resolvedAlertIds } = data;
              setAlerts(prev => prev.map(a => resolvedAlertIds.includes(a.id) ? { ...a, status: 'resolved', resolvedAt: new Date().toISOString() } : a));
              break;
            }
            case 'ALERT_ACKNOWLEDGED': {
              const { alertId, user } = data;
              setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'acknowledged', acknowledgedBy: user, acknowledgedAt: new Date().toISOString() } : a));
              break;
            }
            case 'ALERT_RESOLVED': {
              const { alertId } = data;
              setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'resolved', resolvedAt: new Date().toISOString() } : a));
              break;
            }
            case 'BIN_CREATED': {
              setBins(prev => [data, ...prev]);
              break;
            }
            case 'BIN_UPDATED': {
              setBins(prev => prev.map(b => b.id === data.id ? { ...b, ...data } : b));
              break;
            }
            case 'BIN_DELETED': {
              setBins(prev => prev.filter(b => b.id !== data.id));
              setAlerts(prev => prev.filter(a => a.binId !== data.id));
              break;
            }
            case 'COLLECTION_COMPLETED': {
              const { record, bin } = data;
              if (record) setCollections(prev => [record, ...prev]);
              if (bin) setBins(prev => prev.map(b => b.id === bin.id ? { ...b, ...bin } : b));
              break;
            }
            case 'SETTINGS_UPDATED': {
              setSettings(data);
              break;
            }
          }
        } catch {
          // ignore malformed SSE
        }
      };
    } catch {
      // SSE error handled by notification context
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const addBin = async (binData: Partial<Bin>) => {
    const res = await api.createBin(binData);
    setBins(prev => [res.bin, ...prev.filter(b => b.id !== res.bin.id)]);
    return res.bin;
  };

  const updateBin = async (id: string, binData: Partial<Bin>) => {
    const res = await api.updateBin(id, binData);
    setBins(prev => prev.map(b => b.id === id ? res.bin : b));
    return res.bin;
  };

  const deleteBin = async (id: string) => {
    await api.deleteBin(id);
    setBins(prev => prev.filter(b => b.id !== id));
    setAlerts(prev => prev.filter(a => a.binId !== id));
  };

  const bindDevice = async (binId: string, deviceId: string) => {
    const res = await api.bindDevice(binId, deviceId);
    setBins(prev => prev.map(b => b.id === binId ? res.bin : b));
    await refreshData();
  };

  const unbindDevice = async (binId: string) => {
    const res = await api.unbindDevice(binId);
    setBins(prev => prev.map(b => b.id === binId ? res.bin : b));
    await refreshData();
  };

  const dispatchCollection = async (binId: string, driver?: string) => {
    const res = await api.dispatchCollection(binId, driver);
    setBins(prev => prev.map(b => b.id === binId ? res.bin : b));
  };

  const completeCollection = async (payload: { binId: string; collectedBy?: string; weightKgEstimated?: number; destinationFacility?: string }) => {
    const res = await api.completeCollection(payload);
    setCollections(prev => [res.record, ...prev]);
    setBins(prev => prev.map(b => b.id === payload.binId ? res.bin : b));
  };

  const acknowledgeAlert = async (id: string) => {
    await api.acknowledgeAlert(id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'acknowledged' } : a));
  };

  const resolveAlert = async (id: string) => {
    await api.resolveAlert(id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' } : a));
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    const res = await api.updateSettings(newSettings);
    setSettings(res.settings);
    await refreshData();
  };

  const registerDevice = async (id: string, firmwareVersion?: string) => {
    const res = await api.registerDevice(id, firmwareVersion);
    setDevices(prev => [...prev, res.device]);
    return res.device;
  };

  const sendSimulatedTelemetry = async (payload: { deviceId: string; distanceCm: number; apiKey?: string; batteryLevel?: number }) => {
    return api.sendTelemetry({
      ...payload,
      isSimulated: true
    });
  };

  return (
    <BinContext.Provider
      value={{
        bins,
        alerts,
        devices,
        collections,
        readings,
        settings,
        loading,
        error,
        lastSyncTime,
        refreshData,
        addBin,
        updateBin,
        deleteBin,
        bindDevice,
        unbindDevice,
        dispatchCollection,
        completeCollection,
        acknowledgeAlert,
        resolveAlert,
        updateSettings,
        registerDevice,
        sendSimulatedTelemetry
      }}
    >
      {children}
    </BinContext.Provider>
  );
};

export const useBins = () => {
  const context = useContext(BinContext);
  if (!context) {
    throw new Error('useBins must be used within a BinProvider');
  }
  return context;
};
