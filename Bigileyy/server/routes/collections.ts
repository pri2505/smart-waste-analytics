import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { CollectionRecord } from '../../src/types/index.js';
import { eventStream } from '../services/eventStream.js';

const router = Router();

// GET all collections
router.get('/', (req: Request, res: Response) => {
  const snapshot = db.getSnapshot();
  res.json({
    success: true,
    count: snapshot.collections.length,
    collections: snapshot.collections
  });
});

// POST dispatch collection for a bin
router.post('/dispatch', (req: Request, res: Response) => {
  const { binId, assignedDriver = 'Municipal Fleet Dispatch #10' } = req.body;

  if (!binId) {
    return res.status(400).json({ success: false, error: 'binId is required' });
  }

  let updatedBin: any = null;
  db.update(draft => {
    const bin = draft.bins.find(b => b.id === binId);
    if (bin) {
      bin.collectionStatus = 'In Transit';
      bin.assignedDriver = assignedDriver;
      bin.updatedAt = new Date().toISOString();
      updatedBin = { ...bin };
    }
  });

  if (!updatedBin) {
    return res.status(404).json({ success: false, error: `Bin '${binId}' not found.` });
  }

  eventStream.broadcast('COLLECTION_DISPATCHED', { bin: updatedBin });
  res.json({ success: true, message: `Collection dispatched for bin '${binId}'.`, bin: updatedBin });
});

// POST complete collection
router.post('/complete', (req: Request, res: Response) => {
  const { binId, collectedBy = 'Municipal Route Crew', weightKgEstimated = 85, destinationFacility = 'Central Materials Recovery Facility' } = req.body;

  if (!binId) {
    return res.status(400).json({ success: false, error: 'binId is required' });
  }

  const snapshot = db.getSnapshot();
  const bin = snapshot.bins.find(b => b.id === binId);
  if (!bin) {
    return res.status(404).json({ success: false, error: `Bin '${binId}' not found.` });
  }

  const now = new Date().toISOString();
  const newRecord: CollectionRecord = {
    id: `COL-${Date.now()}`,
    binId: bin.id,
    binName: bin.name,
    wasteCategory: bin.category,
    collectedAt: now,
    collectedBy,
    fillPercentageBefore: bin.currentFillPercentage,
    weightKgEstimated: Number(weightKgEstimated) || 50,
    destinationFacility,
    notes: 'Emptied and reset to baseline operational status'
  };

  let updatedBin: any = null;
  db.update(draft => {
    // 1. Append collection record
    draft.collections.unshift(newRecord);

    // 2. Reset bin fill level to 0%
    const targetBin = draft.bins.find(b => b.id === binId);
    if (targetBin) {
      targetBin.currentFillPercentage = 0;
      targetBin.currentDistanceCm = targetBin.dimensions.heightCm;
      targetBin.status = 'Normal';
      targetBin.collectionStatus = 'Ready';
      targetBin.assignedDriver = undefined;
      targetBin.updatedAt = now;
      updatedBin = { ...targetBin };
    }

    // 3. Resolve any active alerts for this bin
    for (const a of draft.alerts) {
      if (a.binId === binId && a.status !== 'resolved' && (a.type === 'FULL' || a.type === 'ALMOST_FULL')) {
        a.status = 'resolved';
        a.resolvedAt = now;
      }
    }
  });

  eventStream.broadcast('COLLECTION_COMPLETED', { record: newRecord, bin: updatedBin });
  res.json({ success: true, message: `Bin '${binId}' collected successfully.`, record: newRecord, bin: updatedBin });
});

export default router;
