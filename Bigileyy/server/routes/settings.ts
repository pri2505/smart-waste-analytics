import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { AlertEngine } from '../services/alertEngine.js';
import { eventStream } from '../services/eventStream.js';

const router = Router();

// GET settings
router.get('/', (req: Request, res: Response) => {
  const snapshot = db.getSnapshot();
  res.json({ success: true, settings: snapshot.settings });
});

// PUT update settings (Admin only)
router.put('/', (req: Request, res: Response) => {
  const {
    thresholdAlmostFull,
    thresholdFull,
    offlineTimeoutMinutes,
    enableBrowserNotifications,
    enableEmailAlerts,
    autoDispatchCollection
  } = req.body;

  if (thresholdAlmostFull !== undefined && thresholdFull !== undefined) {
    if (Number(thresholdAlmostFull) >= Number(thresholdFull)) {
      return res.status(400).json({
        success: false,
        error: 'thresholdAlmostFull must be strictly less than thresholdFull'
      });
    }
  }

  let updatedSettings: any = null;
  db.update(draft => {
    if (thresholdAlmostFull !== undefined) draft.settings.thresholdAlmostFull = Number(thresholdAlmostFull);
    if (thresholdFull !== undefined) draft.settings.thresholdFull = Number(thresholdFull);
    if (offlineTimeoutMinutes !== undefined) draft.settings.offlineTimeoutMinutes = Number(offlineTimeoutMinutes);
    if (enableBrowserNotifications !== undefined) draft.settings.enableBrowserNotifications = Boolean(enableBrowserNotifications);
    if (enableEmailAlerts !== undefined) draft.settings.enableEmailAlerts = Boolean(enableEmailAlerts);
    if (autoDispatchCollection !== undefined) draft.settings.autoDispatchCollection = Boolean(autoDispatchCollection);
    draft.settings.lastUpdated = new Date().toISOString();
    updatedSettings = { ...draft.settings };

    // Re-evaluate bin statuses under newly modified thresholds
    for (const bin of draft.bins) {
      if (bin.status !== 'Offline') {
        if (bin.currentFillPercentage >= draft.settings.thresholdFull) {
          bin.status = 'Full';
        } else if (bin.currentFillPercentage >= draft.settings.thresholdAlmostFull) {
          bin.status = 'Almost Full';
        } else {
          bin.status = 'Normal';
        }
      }
    }
  });

  // Re-run alert evaluation on all active bins
  const freshSnapshot = db.getSnapshot();
  for (const bin of freshSnapshot.bins) {
    if (bin.status !== 'Offline') {
      AlertEngine.evaluateBinAlerts(bin, bin.currentFillPercentage);
    }
  }

  eventStream.broadcast('SETTINGS_UPDATED', updatedSettings);
  res.json({ success: true, settings: updatedSettings, message: 'Municipal threshold parameters updated successfully.' });
});

export default router;
