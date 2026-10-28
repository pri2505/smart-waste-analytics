import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Bin,
  IoTDevice,
  SensorReading,
  Alert,
  UserProfile,
  CollectionRecord,
  SystemSettings
} from '../../src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface DatabaseSchema {
  bins: Bin[];
  devices: IoTDevice[];
  readings: SensorReading[];
  alerts: Alert[];
  users: UserProfile[];
  collections: CollectionRecord[];
  settings: SystemSettings;
}

// Initial default municipal seed data
const initialData: DatabaseSchema = {
  settings: {
    thresholdAlmostFull: 70,
    thresholdFull: 90,
    offlineTimeoutMinutes: 15,
    enableBrowserNotifications: true,
    enableEmailAlerts: false,
    autoDispatchCollection: true,
    lastUpdated: new Date().toISOString()
  },
  users: [
    {
      id: 'USR-ADMIN-01',
      email: 'admin@municipal.gov.in',
      name: 'Rajesh Sharma (Director of Sanitation)',
      role: 'Admin',
      department: 'Solid Waste Management Directorate',
      phone: '+91 98765 43210',
      createdAt: '2026-01-15T08:00:00.000Z'
    },
    {
      id: 'USR-STAFF-01',
      email: 'staff@municipal.gov.in',
      name: 'Ananya Deshmukh (Fleet Supervisor)',
      role: 'Staff',
      department: 'Zone 1 Recycling Operations',
      phone: '+91 98765 43211',
      createdAt: '2026-02-01T09:30:00.000Z'
    },
    {
      id: 'USR-VIEW-01',
      email: 'auditor@environment.org',
      name: 'Dr. Vikram Sen (Environmental Auditor)',
      role: 'Viewer',
      department: 'Green Audit Board',
      phone: '+91 98765 43212',
      createdAt: '2026-03-10T10:15:00.000Z'
    }
  ],
  devices: [
    {
      id: 'ESP32-NODE-01',
      binId: 'BIN-MUC-101',
      apiKey: 'sec_node01_k9f8w2q1',
      status: 'Online',
      firmwareVersion: 'v2.1.0-prod',
      batteryLevel: 94,
      rssi: -62,
      lastHeartbeat: new Date().toISOString(),
      ipAddress: '192.168.1.101'
    },
    {
      id: 'ESP32-NODE-02',
      binId: 'BIN-MUC-102',
      apiKey: 'sec_node02_m4x7v9p3',
      status: 'Online',
      firmwareVersion: 'v2.1.0-prod',
      batteryLevel: 88,
      rssi: -58,
      lastHeartbeat: new Date().toISOString(),
      ipAddress: '192.168.1.102'
    },
    {
      id: 'ESP32-NODE-03',
      binId: 'BIN-MUC-103',
      apiKey: 'sec_node03_j3b2c8z5',
      status: 'Online',
      firmwareVersion: 'v2.1.0-prod',
      batteryLevel: 76,
      rssi: -65,
      lastHeartbeat: new Date().toISOString(),
      ipAddress: '192.168.1.103'
    },
    {
      id: 'ESP32-NODE-04',
      binId: 'BIN-MUC-104',
      apiKey: 'sec_node04_p8l1n5t4',
      status: 'Offline',
      firmwareVersion: 'v2.0.4-legacy',
      batteryLevel: 14,
      rssi: -84,
      lastHeartbeat: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      ipAddress: '192.168.1.104'
    },
    {
      id: 'ESP32-NODE-05',
      binId: null,
      apiKey: 'sec_node05_spare_d9w3',
      status: 'Unassigned',
      firmwareVersion: 'v2.1.0-prod',
      batteryLevel: 100,
      rssi: -45,
      lastHeartbeat: new Date().toISOString(),
      ipAddress: '192.168.1.105'
    }
  ],
  bins: [
    {
      id: 'BIN-MUC-101',
      name: 'Central Food Court - Organic Segregation',
      location: 'Terminal 1 Plaza, North Wing',
      zone: 'Commercial Zone A',
      category: 'Organic',
      sensorId: 'ESP32-NODE-01',
      dimensions: { heightCm: 100, sensorOffsetCm: 5 },
      currentFillPercentage: 42,
      currentDistanceCm: 63,
      status: 'Normal',
      lastSensorUpdate: new Date().toISOString(),
      collectionStatus: 'Ready',
      notes: 'High organic throughput between 12:00 PM and 3:00 PM',
      createdAt: '2026-02-10T11:00:00.000Z',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'BIN-MUC-102',
      name: 'Retail Boulevard - Recyclable Plastics',
      location: 'Market Walkway, Gate 3',
      zone: 'Commercial Zone A',
      category: 'Recyclable Plastic',
      sensorId: 'ESP32-NODE-02',
      dimensions: { heightCm: 120, sensorOffsetCm: 6 },
      currentFillPercentage: 78,
      currentDistanceCm: 32,
      status: 'Almost Full',
      lastSensorUpdate: new Date().toISOString(),
      collectionStatus: 'Ready',
      notes: 'PET bottles and clear polymers compaction station',
      createdAt: '2026-02-12T14:30:00.000Z',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'BIN-MUC-103',
      name: 'Logistics Depot - Corrugated Paper & Cardboard',
      location: 'Freight Dock Bay 4',
      zone: 'Industrial Hub B',
      category: 'Paper & Cardboard',
      sensorId: 'ESP32-NODE-03',
      dimensions: { heightCm: 150, sensorOffsetCm: 8 },
      currentFillPercentage: 94,
      currentDistanceCm: 17,
      status: 'Full',
      lastSensorUpdate: new Date().toISOString(),
      collectionStatus: 'Collection Pending',
      assignedDriver: 'Manoj Kumar (Truck #TN-09-CW-4412)',
      notes: 'Exceeded 90% threshold. Compactor pickup queued.',
      createdAt: '2026-02-14T09:15:00.000Z',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'BIN-MUC-104',
      name: 'Electronics Scrap & Battery Safe Vault',
      location: 'Municipal E-Waste Yard - Section 2',
      zone: 'Industrial Hub B',
      category: 'Hazardous/Electronic',
      sensorId: 'ESP32-NODE-04',
      dimensions: { heightCm: 90, sensorOffsetCm: 5 },
      currentFillPercentage: 35,
      currentDistanceCm: 63,
      status: 'Offline',
      lastSensorUpdate: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      collectionStatus: 'Ready',
      notes: 'Node telemetry silent for over 30 minutes. Inspection ticket issued.',
      createdAt: '2026-02-18T16:00:00.000Z',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'BIN-MUC-105',
      name: 'Glass & Beverage Cans Depository',
      location: 'Marina Waterfront Promenade',
      zone: 'Recreational Waterfront',
      category: 'Metal & Glass',
      sensorId: null,
      dimensions: { heightCm: 100, sensorOffsetCm: 5 },
      currentFillPercentage: 20,
      currentDistanceCm: 85,
      status: 'Normal',
      lastSensorUpdate: null,
      collectionStatus: 'Ready',
      notes: 'Hardware installation pending. Manual sensor unassigned.',
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: new Date().toISOString()
    }
  ],
  readings: [
    {
      id: 'READ-001',
      binId: 'BIN-MUC-101',
      deviceId: 'ESP32-NODE-01',
      distanceCm: 63,
      fillPercentage: 42,
      rawDistanceCm: 63,
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      isSimulated: false
    },
    {
      id: 'READ-002',
      binId: 'BIN-MUC-102',
      deviceId: 'ESP32-NODE-02',
      distanceCm: 32,
      fillPercentage: 78,
      rawDistanceCm: 32,
      timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      isSimulated: false
    },
    {
      id: 'READ-003',
      binId: 'BIN-MUC-103',
      deviceId: 'ESP32-NODE-03',
      distanceCm: 17,
      fillPercentage: 94,
      rawDistanceCm: 17,
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      isSimulated: false
    }
  ],
  alerts: [
    {
      id: 'ALT-101',
      binId: 'BIN-MUC-103',
      deviceId: 'ESP32-NODE-03',
      binName: 'Logistics Depot - Corrugated Paper & Cardboard',
      location: 'Freight Dock Bay 4',
      type: 'FULL',
      severity: 'critical',
      message: 'Bin capacity at 94%. Immediate collection dispatch required to avoid overflow.',
      fillPercentage: 94,
      status: 'active',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    {
      id: 'ALT-102',
      binId: 'BIN-MUC-102',
      deviceId: 'ESP32-NODE-02',
      binName: 'Retail Boulevard - Recyclable Plastics',
      location: 'Market Walkway, Gate 3',
      type: 'ALMOST_FULL',
      severity: 'warning',
      message: 'Bin capacity crossed 75% threshold (currently 78%). Plan route collection.',
      fillPercentage: 78,
      status: 'active',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
      id: 'ALT-103',
      binId: 'BIN-MUC-104',
      deviceId: 'ESP32-NODE-04',
      binName: 'Electronics Scrap & Battery Safe Vault',
      location: 'Municipal E-Waste Yard - Section 2',
      type: 'OFFLINE',
      severity: 'critical',
      message: 'Sensor ESP32-NODE-04 heartbeat timed out (last signal > 30 minutes ago).',
      fillPercentage: 35,
      status: 'active',
      createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString()
    }
  ],
  collections: [
    {
      id: 'COL-2026-001',
      binId: 'BIN-MUC-101',
      binName: 'Central Food Court - Organic Segregation',
      wasteCategory: 'Organic',
      collectedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      collectedBy: 'Ramesh K. (Truck #TN-09-CW-1102)',
      fillPercentageBefore: 92,
      weightKgEstimated: 145,
      destinationFacility: 'Municipal Biomethanation Plant #2',
      notes: 'Cleared successfully. Bin washed and sanitized.'
    },
    {
      id: 'COL-2026-002',
      binId: 'BIN-MUC-102',
      binName: 'Retail Boulevard - Recyclable Plastics',
      wasteCategory: 'Recyclable Plastic',
      collectedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      collectedBy: 'Suresh V. (Truck #TN-09-CW-1105)',
      fillPercentageBefore: 88,
      weightKgEstimated: 68,
      destinationFacility: 'State Polymer Sorting & Baling Facility',
      notes: 'Clean dry stream, high grade PET.'
    }
  ]
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all top-level keys exist
        return {
          settings: parsed.settings || initialData.settings,
          users: parsed.users || initialData.users,
          devices: parsed.devices || initialData.devices,
          bins: parsed.bins || initialData.bins,
          readings: parsed.readings || initialData.readings,
          alerts: parsed.alerts || initialData.alerts,
          collections: parsed.collections || initialData.collections,
        };
      }
    } catch (err) {
      console.error('[DB] Error reading existing db.json, re-initializing with seed data:', err);
    }

    this.saveData(initialData);
    return JSON.parse(JSON.stringify(initialData));
  }

  private saveData(dataToSave: DatabaseSchema) {
    try {
      this.ensureDataDir();
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('[DB] Atomic write failed:', err);
    }
  }

  public getSnapshot(): DatabaseSchema {
    return JSON.parse(JSON.stringify(this.data));
  }

  public update(updater: (draft: DatabaseSchema) => void): DatabaseSchema {
    updater(this.data);
    this.saveData(this.data);
    return this.getSnapshot();
  }
}

export const db = new Database();
