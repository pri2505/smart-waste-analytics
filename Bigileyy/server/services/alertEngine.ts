import { db } from '../db/database.js';
import { Bin, Alert, AlertType } from '../../src/types/index.js';
import { eventStream } from './eventStream.js';

export class AlertEngine {
  public static evaluateBinAlerts(bin: Bin, fillPercentage: number) {
    const snapshot = db.getSnapshot();
    const settings = snapshot.settings;
    const now = new Date().toISOString();

    const activeAlerts = snapshot.alerts.filter(
      a => a.binId === bin.id && (a.status === 'active' || a.status === 'acknowledged')
    );

    if (fillPercentage >= settings.thresholdFull) {
      // Check if active FULL alert already exists
      const hasFullAlert = activeAlerts.some(a => a.type === 'FULL');
      if (!hasFullAlert) {
        // Resolve any active ALMOST_FULL alert since it escalated
        const almostFullAlert = activeAlerts.find(a => a.type === 'ALMOST_FULL');
        if (almostFullAlert) {
          db.update(draft => {
            const target = draft.alerts.find(a => a.id === almostFullAlert.id);
            if (target) {
              target.status = 'resolved';
              target.resolvedAt = now;
            }
          });
        }

        const newAlert: Alert = {
          id: `ALT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          binId: bin.id,
          deviceId: bin.sensorId || undefined,
          binName: bin.name,
          location: bin.location,
          type: 'FULL',
          severity: 'critical',
          message: `CRITICAL OVERFLOW ALERT: ${bin.name} (${bin.id}) is at ${fillPercentage}% capacity. Immediate municipal pickup required!`,
          fillPercentage,
          status: 'active',
          createdAt: now
        };

        db.update(draft => {
          draft.alerts.unshift(newAlert);
          // If auto dispatch collection enabled, mark collection status
          const targetBin = draft.bins.find(b => b.id === bin.id);
          if (targetBin && settings.autoDispatchCollection) {
            targetBin.collectionStatus = 'Collection Pending';
          }
        });

        eventStream.broadcast('ALERT_TRIGGERED', newAlert);
      }
    } else if (fillPercentage >= settings.thresholdAlmostFull) {
      // Between thresholdAlmostFull and thresholdFull
      const hasAlmostFullAlert = activeAlerts.some(a => a.type === 'ALMOST_FULL');
      const hasFullAlert = activeAlerts.some(a => a.type === 'FULL');

      // If it dropped from Full to Almost Full, resolve Full
      if (hasFullAlert) {
        db.update(draft => {
          const fullAlert = draft.alerts.find(a => a.binId === bin.id && a.type === 'FULL' && a.status !== 'resolved');
          if (fullAlert) {
            fullAlert.status = 'resolved';
            fullAlert.resolvedAt = now;
          }
        });
      }

      if (!hasAlmostFullAlert && !hasFullAlert) {
        const newAlert: Alert = {
          id: `ALT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          binId: bin.id,
          deviceId: bin.sensorId || undefined,
          binName: bin.name,
          location: bin.location,
          type: 'ALMOST_FULL',
          severity: 'warning',
          message: `CAPACITY WARNING: ${bin.name} (${bin.id}) reached ${fillPercentage}%. Compactor collection route should be scheduled.`,
          fillPercentage,
          status: 'active',
          createdAt: now
        };

        db.update(draft => {
          draft.alerts.unshift(newAlert);
        });

        eventStream.broadcast('ALERT_TRIGGERED', newAlert);
      }
    } else {
      // Normal fill level (< thresholdAlmostFull).
      // Resolve any active FULL or ALMOST_FULL alerts because the bin was cleared or emptied
      const alertsToResolve = activeAlerts.filter(a => a.type === 'FULL' || a.type === 'ALMOST_FULL');
      if (alertsToResolve.length > 0) {
        db.update(draft => {
          for (const item of alertsToResolve) {
            const target = draft.alerts.find(a => a.id === item.id);
            if (target) {
              target.status = 'resolved';
              target.resolvedAt = now;
            }
          }
        });

        eventStream.broadcast('ALERTS_RESOLVED', {
          binId: bin.id,
          resolvedAlertIds: alertsToResolve.map(a => a.id),
          currentFillPercentage: fillPercentage
        });
      }
    }
  }

  public static raiseOfflineAlert(bin: Bin, deviceId: string) {
    const snapshot = db.getSnapshot();
    const existing = snapshot.alerts.find(
      a => a.binId === bin.id && a.type === 'OFFLINE' && a.status !== 'resolved'
    );

    if (existing) return; // Prevent duplicate

    const now = new Date().toISOString();
    const newAlert: Alert = {
      id: `ALT-OFF-${Date.now()}`,
      binId: bin.id,
      deviceId,
      binName: bin.name,
      location: bin.location,
      type: 'OFFLINE',
      severity: 'critical',
      message: `DEVICE OFFLINE: Sensor ${deviceId} attached to ${bin.name} (${bin.id}) has stopped transmitting telemetry.`,
      fillPercentage: bin.currentFillPercentage,
      status: 'active',
      createdAt: now
    };

    db.update(draft => {
      draft.alerts.unshift(newAlert);
      const targetBin = draft.bins.find(b => b.id === bin.id);
      if (targetBin) {
        targetBin.status = 'Offline';
      }
      const targetDev = draft.devices.find(d => d.id === deviceId);
      if (targetDev) {
        targetDev.status = 'Offline';
      }
    });

    eventStream.broadcast('ALERT_TRIGGERED', newAlert);
    eventStream.broadcast('BIN_UPDATED', { binId: bin.id, status: 'Offline' });
  }

  public static acknowledge(alertId: string, user: string): boolean {
    let success = false;
    db.update(draft => {
      const target = draft.alerts.find(a => a.id === alertId);
      if (target) {
        target.status = 'acknowledged';
        target.acknowledgedBy = user;
        target.acknowledgedAt = new Date().toISOString();
        success = true;
      }
    });

    if (success) {
      eventStream.broadcast('ALERT_ACKNOWLEDGED', { alertId, user });
    }
    return success;
  }

  public static resolve(alertId: string): boolean {
    let success = false;
    db.update(draft => {
      const target = draft.alerts.find(a => a.id === alertId);
      if (target) {
        target.status = 'resolved';
        target.resolvedAt = new Date().toISOString();
        success = true;
      }
    });

    if (success) {
      eventStream.broadcast('ALERT_RESOLVED', { alertId });
    }
    return success;
  }
}
