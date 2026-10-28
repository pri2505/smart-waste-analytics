import { db } from '../db/database.js';
import { Bin, SensorReading, IoTDevice, BinStatus } from '../../src/types/index.js';
import { AlertEngine } from './alertEngine.js';
import { eventStream } from './eventStream.js';

export interface IngestionPayload {
  deviceId: string;
  apiKey?: string;
  distanceCm: number;
  batteryLevel?: number;
  rssi?: number;
  ipAddress?: string;
  isSimulated?: boolean;
  timestamp?: string;
}

export class IoTEngine {
  public static calculateFillPercentage(rawDistanceCm: number, dimensions: { heightCm: number; sensorOffsetCm: number }): number {
    const totalHeight = dimensions.heightCm > 0 ? dimensions.heightCm : 100;
    const offset = dimensions.sensorOffsetCm || 0;

    // Measured distance from sensor face
    // If distance is <= offset, bin is 100% full (or overflowing to sensor)
    // If distance is >= (totalHeight + offset), bin is 0% empty
    const wasteDepth = totalHeight - (rawDistanceCm - offset);
    const percentage = Math.round((wasteDepth / totalHeight) * 100);

    return Math.max(0, Math.min(100, percentage));
  }

  public static processTelemetry(payload: IngestionPayload): {
    success: boolean;
    error?: string;
    reading?: SensorReading;
    bin?: Bin;
  } {
    const { deviceId, apiKey, distanceCm, batteryLevel, rssi, ipAddress, isSimulated = false } = payload;
    const nowIso = new Date().toISOString();
    const readingTimestamp = payload.timestamp || nowIso;

    if (!deviceId) {
      return { success: false, error: 'Missing deviceId in telemetry payload' };
    }

    if (typeof distanceCm !== 'number' || isNaN(distanceCm)) {
      return { success: false, error: 'Invalid or non-numeric distanceCm measurement' };
    }

    // HC-SR04 physical limitations: 2cm to 450cm
    if (distanceCm < 1 || distanceCm > 500) {
      return { success: false, error: `Distance ${distanceCm}cm is outside physical operational range (1-500cm)` };
    }

    const snapshot = db.getSnapshot();

    // 1. Verify device registration
    const device = snapshot.devices.find(d => d.id === deviceId);
    if (!device) {
      return { success: false, error: `Unregistered hardware node: '${deviceId}'. Register device in System Management first.` };
    }

    // 2. Validate API key if device requires auth and apiKey was supplied or configured
    if (apiKey && device.apiKey && apiKey !== device.apiKey) {
      return { success: false, error: 'Authentication failed: Invalid device API key' };
    }

    // 3. Update device telemetry
    db.update(draft => {
      const dev = draft.devices.find(d => d.id === deviceId);
      if (dev) {
        dev.status = 'Online';
        dev.lastHeartbeat = readingTimestamp;
        if (typeof batteryLevel === 'number') dev.batteryLevel = batteryLevel;
        if (typeof rssi === 'number') dev.rssi = rssi;
        if (ipAddress) dev.ipAddress = ipAddress;
      }
    });

    // 4. Find bound bin
    const bin = snapshot.bins.find(b => b.sensorId === deviceId);
    if (!bin) {
      // Device is registered but currently unassigned to any bin
      return {
        success: true,
        error: `Telemetry received, but device ${deviceId} is currently unassigned to any municipal bin.`
      };
    }

    // 5. Prevent out-of-order timestamp override
    if (bin.lastSensorUpdate && new Date(readingTimestamp) < new Date(bin.lastSensorUpdate)) {
      return {
        success: false,
        error: `Out-of-order reading rejected. Latest reading was recorded at ${bin.lastSensorUpdate}`
      };
    }

    // 6. Calculate fill level based on actual bin dimensions
    const fillPercentage = this.calculateFillPercentage(distanceCm, bin.dimensions);

    // 7. Determine Bin Status
    const settings = snapshot.settings;
    let nextStatus: BinStatus = 'Normal';
    if (fillPercentage >= settings.thresholdFull) {
      nextStatus = 'Full';
    } else if (fillPercentage >= settings.thresholdAlmostFull) {
      nextStatus = 'Almost Full';
    } else {
      nextStatus = 'Normal';
    }

    // 8. Create reading record
    const reading: SensorReading = {
      id: `READ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      binId: bin.id,
      deviceId: device.id,
      distanceCm: Math.round(distanceCm * 10) / 10,
      fillPercentage,
      rawDistanceCm: distanceCm,
      timestamp: readingTimestamp,
      isSimulated
    };

    // 9. Persist update in database
    let updatedBin: Bin | undefined;
    db.update(draft => {
      // Update bin state
      const targetBin = draft.bins.find(b => b.id === bin.id);
      if (targetBin) {
        targetBin.currentFillPercentage = fillPercentage;
        targetBin.currentDistanceCm = reading.distanceCm;
        targetBin.status = nextStatus;
        targetBin.lastSensorUpdate = readingTimestamp;
        targetBin.updatedAt = nowIso;
        updatedBin = { ...targetBin };
      }

      // Append reading (keep last 500)
      draft.readings.unshift(reading);
      if (draft.readings.length > 500) {
        draft.readings = draft.readings.slice(0, 500);
      }
    });

    if (updatedBin) {
      // 10. Run alert evaluation
      AlertEngine.evaluateBinAlerts(updatedBin, fillPercentage);

      // 11. Broadcast live telemetry to all connected dashboard tabs
      eventStream.broadcast('SENSOR_TELEMETRY', {
        reading,
        bin: updatedBin,
        device: {
          id: device.id,
          status: 'Online',
          batteryLevel: device.batteryLevel,
          rssi: device.rssi
        }
      });
    }

    return {
      success: true,
      reading,
      bin: updatedBin
    };
  }
}
