import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';

const router = Router();

// GET /api/v1/analytics/overview
router.get('/overview', (req: Request, res: Response) => {
  const snapshot = db.getSnapshot();
  const bins = snapshot.bins;
  const readings = snapshot.readings;
  const alerts = snapshot.alerts;
  const collections = snapshot.collections;
  const devices = snapshot.devices;

  const totalBins = bins.length;
  const normalBins = bins.filter(b => b.status === 'Normal').length;
  const almostFullBins = bins.filter(b => b.status === 'Almost Full').length;
  const fullBins = bins.filter(b => b.status === 'Full').length;
  const offlineBins = bins.filter(b => b.status === 'Offline').length;
  const collectionPendingBins = bins.filter(b => b.collectionStatus === 'Collection Pending' || b.collectionStatus === 'In Transit').length;

  const activeAlertsCount = alerts.filter(a => a.status === 'active').length;
  const averageFillPercentage = totalBins > 0
    ? Math.round(bins.reduce((acc, b) => acc + b.currentFillPercentage, 0) / totalBins)
    : 0;

  // Breakdown by waste category
  const categories = [
    'Organic',
    'Recyclable Plastic',
    'Paper & Cardboard',
    'Metal & Glass',
    'Hazardous/Electronic',
    'General Commercial'
  ];

  const categoryDistribution = categories.map(cat => {
    const matchingBins = bins.filter(b => b.category === cat);
    const avgFill = matchingBins.length > 0
      ? Math.round(matchingBins.reduce((acc, b) => acc + b.currentFillPercentage, 0) / matchingBins.length)
      : 0;

    const matchingCollections = collections.filter(c => c.wasteCategory === cat);
    const totalCollectedKg = matchingCollections.reduce((acc, c) => acc + c.weightKgEstimated, 0);

    return {
      category: cat,
      binCount: matchingBins.length,
      averageFill: avgFill,
      totalCollectedKg
    };
  });

  // Recent 10 readings for live trend line
  const recentTrends = readings
    .slice(0, 30)
    .reverse()
    .map(r => ({
      timestamp: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      binId: r.binId,
      fillPercentage: r.fillPercentage,
      distanceCm: r.distanceCm
    }));

  const onlineDevicesCount = devices.filter(d => d.status === 'Online').length;

  res.json({
    success: true,
    data: {
      metrics: {
        totalBins,
        normalBins,
        almostFullBins,
        fullBins,
        offlineBins,
        collectionPendingBins,
        activeAlertsCount,
        averageFillPercentage,
        onlineDevicesCount,
        totalDevicesCount: devices.length
      },
      categoryDistribution,
      recentTrends,
      recentAlerts: alerts.slice(0, 5),
      recentCollections: collections.slice(0, 5),
      lastSyncStatus: {
        timestamp: new Date().toISOString(),
        status: 'Synchronized with Cloud Data Store',
        connectedNodes: onlineDevicesCount
      }
    }
  });
});

export default router;
