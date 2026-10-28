export type WasteCategory =
  | 'Organic'
  | 'Recyclable Plastic'
  | 'Paper & Cardboard'
  | 'Metal & Glass'
  | 'Hazardous/Electronic'
  | 'General Commercial';

export type BinStatus = 'Normal' | 'Almost Full' | 'Full' | 'Offline';

export type CollectionStatus = 'Ready' | 'Collection Pending' | 'In Transit' | 'Collected';

export type UserRole = 'Admin' | 'Staff' | 'Viewer';

export interface BinDimensions {
  heightCm: number;        // Total internal depth of bin (e.g. 100 cm)
  sensorOffsetCm: number;  // Distance from sensor face to maximum fill level / bin top (e.g. 5 cm)
}

export interface Bin {
  id: string;                      // Unique Bin ID (e.g. "BIN-MUC-101")
  name: string;                    // Name / Label (e.g. "Central Market - Organic")
  location: string;                // Location description (e.g. "Zone A - North Wing")
  zone: string;                    // Operational zone
  category: WasteCategory;
  sensorId: string | null;         // Associated ESP32 Device ID
  dimensions: BinDimensions;
  currentFillPercentage: number;   // 0 - 100
  currentDistanceCm: number;       // Current measured distance
  status: BinStatus;
  lastSensorUpdate: string | null; // ISO timestamp
  collectionStatus: CollectionStatus;
  assignedDriver?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IoTDevice {
  id: string;                      // Device ID (e.g. "ESP32-NODE-01")
  binId: string | null;            // Associated Bin ID
  apiKey: string;                  // Authentication token
  status: 'Online' | 'Offline' | 'Unassigned';
  firmwareVersion: string;
  batteryLevel?: number;           // % battery remaining if battery-backed
  rssi?: number;                   // WiFi signal strength dBm
  lastHeartbeat: string | null;
  ipAddress?: string;
}

export interface SensorReading {
  id: string;
  binId: string;
  deviceId: string;
  distanceCm: number;
  fillPercentage: number;
  rawDistanceCm: number;
  timestamp: string;
  isSimulated: boolean;
}

export type AlertType = 'ALMOST_FULL' | 'FULL' | 'OFFLINE' | 'DEVICE_TAMPER' | 'RAPID_FILL';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface Alert {
  id: string;
  binId: string;
  deviceId?: string;
  binName?: string;
  location?: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  fillPercentage: number;
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  phone?: string;
  createdAt: string;
}

export interface CollectionRecord {
  id: string;
  binId: string;
  binName: string;
  wasteCategory: WasteCategory;
  collectedAt: string;
  collectedBy: string;
  fillPercentageBefore: number;
  weightKgEstimated: number;
  destinationFacility: string;
  notes?: string;
}

export interface SystemSettings {
  thresholdAlmostFull: number;      // e.g. 70%
  thresholdFull: number;            // e.g. 90%
  offlineTimeoutMinutes: number;    // e.g. 15 minutes
  enableBrowserNotifications: boolean;
  enableEmailAlerts: boolean;
  autoDispatchCollection: boolean;
  lastUpdated: string;
}
