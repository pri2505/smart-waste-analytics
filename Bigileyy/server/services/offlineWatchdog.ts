import { db } from '../db/database.js';
import { AlertEngine } from './alertEngine.js';

export class OfflineWatchdog {
  private timer: NodeJS.Timeout | null = null;

  public start(intervalMs: number = 30000) {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.checkOfflineBins();
    }, intervalMs);
    console.log('[WATCHDOG] IoT Device Offline Watchdog started (interval: 30s)');
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public checkOfflineBins() {
    const snapshot = db.getSnapshot();
    const timeoutMs = (snapshot.settings.offlineTimeoutMinutes || 15) * 60 * 1000;
    const now = Date.now();

    for (const bin of snapshot.bins) {
      if (!bin.sensorId) continue; // Skip bins without sensors

      // If bin already marked offline, skip
      if (bin.status === 'Offline') continue;

      if (!bin.lastSensorUpdate) {
        // Bin has a sensor assigned but has never reported
        const createdAt = new Date(bin.createdAt).getTime();
        if (now - createdAt > timeoutMs) {
          AlertEngine.raiseOfflineAlert(bin, bin.sensorId);
        }
      } else {
        const lastUpdate = new Date(bin.lastSensorUpdate).getTime();
        if (now - lastUpdate > timeoutMs) {
          AlertEngine.raiseOfflineAlert(bin, bin.sensorId);
        }
      }
    }
  }
}

export const offlineWatchdog = new OfflineWatchdog();
