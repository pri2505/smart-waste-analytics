import type {
  Bin,
  IoTDevice,
  SensorReading,
  Alert,
  UserProfile,
  CollectionRecord,
  SystemSettings
} from '../types';

const API_BASE = '/api/v1';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('eco_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers as Record<string, string> || {})
    }
  });

  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.error || `HTTP ${response.status}: Request failed`);
  }

  return data;
}

export const api = {
  // Bins
  getBins: (params?: { q?: string; zone?: string; category?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.zone) query.set('zone', params.zone);
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    return request<{ success: boolean; count: number; bins: Bin[] }>(`/bins?${query.toString()}`);
  },

  getBin: (id: string) => {
    return request<{
      success: boolean;
      bin: Bin;
      readings: SensorReading[];
      activeAlerts: Alert[];
      device: IoTDevice | null;
    }>(`/bins/${id}`);
  },

  createBin: (binData: Partial<Bin>) => {
    return request<{ success: boolean; bin: Bin }>('/bins', {
      method: 'POST',
      body: JSON.stringify(binData)
    });
  },

  updateBin: (id: string, binData: Partial<Bin>) => {
    return request<{ success: boolean; bin: Bin }>(`/bins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(binData)
    });
  },

  deleteBin: (id: string) => {
    return request<{ success: boolean; message: string }>(`/bins/${id}`, {
      method: 'DELETE'
    });
  },

  bindDevice: (binId: string, deviceId: string) => {
    return request<{ success: boolean; message: string; bin: Bin }>(`/bins/${binId}/bind-device`, {
      method: 'POST',
      body: JSON.stringify({ deviceId })
    });
  },

  unbindDevice: (binId: string) => {
    return request<{ success: boolean; message: string; bin: Bin }>(`/bins/${binId}/unbind-device`, {
      method: 'POST'
    });
  },

  // Sensors / IoT Telemetry Ingestion
  sendTelemetry: (payload: {
    deviceId: string;
    distanceCm: number;
    apiKey?: string;
    batteryLevel?: number;
    rssi?: number;
    isSimulated?: boolean;
  }) => {
    return request<{
      success: boolean;
      message: string;
      data: { reading: SensorReading; bin: any };
    }>('/sensors/reading', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getReadings: (params?: { binId?: string; deviceId?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.binId) query.set('binId', params.binId);
    if (params?.deviceId) query.set('deviceId', params.deviceId);
    if (params?.limit) query.set('limit', params.limit.toString());
    return request<{ success: boolean; count: number; readings: SensorReading[] }>(`/sensors/readings?${query.toString()}`);
  },

  // Devices
  getDevices: () => {
    return request<{ success: boolean; count: number; devices: IoTDevice[] }>('/devices');
  },

  registerDevice: (id: string, firmwareVersion?: string) => {
    return request<{ success: boolean; device: IoTDevice }>('/devices', {
      method: 'POST',
      body: JSON.stringify({ id, firmwareVersion })
    });
  },

  deleteDevice: (id: string) => {
    return request<{ success: boolean; message: string }>(`/devices/${id}`, {
      method: 'DELETE'
    });
  },

  // Alerts
  getAlerts: (params?: { status?: string; severity?: string; binId?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.severity) query.set('severity', params.severity);
    if (params?.binId) query.set('binId', params.binId);
    return request<{ success: boolean; count: number; unreadCount: number; alerts: Alert[] }>(`/alerts?${query.toString()}`);
  },

  acknowledgeAlert: (id: string, user?: string) => {
    return request<{ success: boolean; message: string }>(`/alerts/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ user })
    });
  },

  resolveAlert: (id: string) => {
    return request<{ success: boolean; message: string }>(`/alerts/${id}/resolve`, {
      method: 'POST'
    });
  },

  // Collections
  getCollections: () => {
    return request<{ success: boolean; count: number; collections: CollectionRecord[] }>('/collections');
  },

  dispatchCollection: (binId: string, assignedDriver?: string) => {
    return request<{ success: boolean; message: string; bin: Bin }>('/collections/dispatch', {
      method: 'POST',
      body: JSON.stringify({ binId, assignedDriver })
    });
  },

  completeCollection: (payload: {
    binId: string;
    collectedBy?: string;
    weightKgEstimated?: number;
    destinationFacility?: string;
  }) => {
    return request<{ success: boolean; message: string; record: CollectionRecord; bin: Bin }>('/collections/complete', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Analytics
  getAnalyticsOverview: () => {
    return request<{
      success: boolean;
      data: {
        metrics: {
          totalBins: number;
          normalBins: number;
          almostFullBins: number;
          fullBins: number;
          offlineBins: number;
          collectionPendingBins: number;
          activeAlertsCount: number;
          averageFillPercentage: number;
          onlineDevicesCount: number;
          totalDevicesCount: number;
        };
        categoryDistribution: Array<{
          category: string;
          binCount: number;
          averageFill: number;
          totalCollectedKg: number;
        }>;
        recentTrends: Array<{
          timestamp: string;
          binId: string;
          fillPercentage: number;
          distanceCm: number;
        }>;
        recentAlerts: Alert[];
        recentCollections: CollectionRecord[];
        lastSyncStatus: {
          timestamp: string;
          status: string;
          connectedNodes: number;
        };
      };
    }>('/analytics/overview');
  },

  // Settings
  getSettings: () => {
    return request<{ success: boolean; settings: SystemSettings }>('/settings');
  },

  updateSettings: (settings: Partial<SystemSettings>) => {
    return request<{ success: boolean; settings: SystemSettings; message: string }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },

  // Users
  getUsers: () => {
    return request<{ success: boolean; count: number; users: UserProfile[] }>('/users');
  },

  createUser: (userData: Partial<UserProfile>) => {
    return request<{ success: boolean; user: UserProfile }>('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  updateUser: (id: string, userData: Partial<UserProfile>) => {
    return request<{ success: boolean; user: UserProfile }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  deleteUser: (id: string) => {
    return request<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE'
    });
  },

  // Auth
  login: (email: string) => {
    return request<{ success: boolean; token: string; user: UserProfile; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  register: (userData: Partial<UserProfile>) => {
    return request<{ success: boolean; token: string; user: UserProfile; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  getPresets: () => {
    return request<{ success: boolean; presets: Array<{ email: string; name: string; role: string; department: string }> }>('/auth/presets');
  }
};
