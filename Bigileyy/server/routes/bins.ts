import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { Bin, WasteCategory, BinStatus, CollectionStatus } from '../../src/types/index.js';
import { eventStream } from '../services/eventStream.js';

const router = Router();

// GET all bins with optional filtering
router.get('/', (req: Request, res: Response) => {
  const { q, zone, category, status } = req.query;
  const snapshot = db.getSnapshot();
  let list = [...snapshot.bins];

  if (typeof q === 'string' && q.trim()) {
    const search = q.toLowerCase();
    list = list.filter(b =>
      b.id.toLowerCase().includes(search) ||
      b.name.toLowerCase().includes(search) ||
      b.location.toLowerCase().includes(search) ||
      (b.sensorId && b.sensorId.toLowerCase().includes(search))
    );
  }

  if (typeof zone === 'string' && zone !== 'ALL') {
    list = list.filter(b => b.zone === zone);
  }

  if (typeof category === 'string' && category !== 'ALL') {
    list = list.filter(b => b.category === category);
  }

  if (typeof status === 'string' && status !== 'ALL') {
    list = list.filter(b => b.status === status);
  }

  res.json({ success: true, count: list.length, bins: list });
});

// GET single bin with telemetry history
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const snapshot = db.getSnapshot();
  const bin = snapshot.bins.find(b => b.id === id);

  if (!bin) {
    return res.status(404).json({ success: false, error: `Bin with ID '${id}' not found` });
  }

  const readings = snapshot.readings
    .filter(r => r.binId === id)
    .slice(0, 50);

  const activeAlerts = snapshot.alerts
    .filter(a => a.binId === id && a.status !== 'resolved');

  res.json({
    success: true,
    bin,
    readings,
    activeAlerts,
    device: bin.sensorId ? snapshot.devices.find(d => d.id === bin.sensorId) : null
  });
});

// POST create new bin
router.post('/', (req: Request, res: Response) => {
  const { id, name, location, zone, category, dimensions, notes, sensorId } = req.body;

  if (!id || !name || !location || !category) {
    return res.status(400).json({ success: false, error: 'Bin ID, Name, Location, and Category are required.' });
  }

  const normalizedId = id.trim().toUpperCase();
  const snapshot = db.getSnapshot();

  // Prevent duplicate IDs
  if (snapshot.bins.some(b => b.id.toUpperCase() === normalizedId)) {
    return res.status(409).json({ success: false, error: `A bin with ID '${normalizedId}' already exists. IDs must be unique.` });
  }

  const heightCm = Number(dimensions?.heightCm) || 100;
  const sensorOffsetCm = Number(dimensions?.sensorOffsetCm) || 5;

  const now = new Date().toISOString();
  const newBin: Bin = {
    id: normalizedId,
    name: name.trim(),
    location: location.trim(),
    zone: zone?.trim() || 'General District',
    category: category as WasteCategory,
    sensorId: sensorId ? sensorId.trim() : null,
    dimensions: { heightCm, sensorOffsetCm },
    currentFillPercentage: 0,
    currentDistanceCm: heightCm,
    status: 'Normal',
    lastSensorUpdate: null,
    collectionStatus: 'Ready',
    notes: notes?.trim() || '',
    createdAt: now,
    updatedAt: now
  };

  db.update(draft => {
    // If a sensor was assigned, bind it in devices table too
    if (newBin.sensorId) {
      const dev = draft.devices.find(d => d.id === newBin.sensorId);
      if (dev) {
        // If device was previously attached elsewhere, unlink from other bin
        const otherBin = draft.bins.find(b => b.sensorId === newBin.sensorId);
        if (otherBin) otherBin.sensorId = null;
        dev.binId = newBin.id;
        dev.status = 'Online';
      }
    }
    draft.bins.unshift(newBin);
  });

  eventStream.broadcast('BIN_CREATED', newBin);
  res.status(201).json({ success: true, bin: newBin });
});

// PUT update bin
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, location, zone, category, dimensions, notes, collectionStatus, assignedDriver } = req.body;

  const snapshot = db.getSnapshot();
  const existing = snapshot.bins.find(b => b.id === id);

  if (!existing) {
    return res.status(404).json({ success: false, error: `Bin '${id}' not found.` });
  }

  let updatedBin: Bin | undefined;
  db.update(draft => {
    const b = draft.bins.find(item => item.id === id);
    if (b) {
      if (name) b.name = name.trim();
      if (location) b.location = location.trim();
      if (zone) b.zone = zone.trim();
      if (category) b.category = category as WasteCategory;
      if (notes !== undefined) b.notes = notes.trim();
      if (collectionStatus) b.collectionStatus = collectionStatus as CollectionStatus;
      if (assignedDriver !== undefined) b.assignedDriver = assignedDriver;

      if (dimensions) {
        if (dimensions.heightCm) b.dimensions.heightCm = Number(dimensions.heightCm);
        if (dimensions.sensorOffsetCm !== undefined) b.dimensions.sensorOffsetCm = Number(dimensions.sensorOffsetCm);
      }

      b.updatedAt = new Date().toISOString();
      updatedBin = { ...b };
    }
  });

  if (updatedBin) {
    eventStream.broadcast('BIN_UPDATED', updatedBin);
    res.json({ success: true, bin: updatedBin });
  } else {
    res.status(500).json({ success: false, error: 'Failed to update bin.' });
  }
});

// DELETE remove bin (with confirmation safety)
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const snapshot = db.getSnapshot();
  const existing = snapshot.bins.find(b => b.id === id);

  if (!existing) {
    return res.status(404).json({ success: false, error: `Bin '${id}' not found.` });
  }

  db.update(draft => {
    // 1. Unbind associated device if any
    if (existing.sensorId) {
      const dev = draft.devices.find(d => d.id === existing.sensorId);
      if (dev) {
        dev.binId = null;
        dev.status = 'Unassigned';
      }
    }

    // 2. Clear alerts for this bin
    draft.alerts = draft.alerts.filter(a => a.binId !== id);

    // 3. Remove bin
    draft.bins = draft.bins.filter(b => b.id !== id);
  });

  eventStream.broadcast('BIN_DELETED', { id });
  res.json({ success: true, message: `Bin '${id}' removed safely.` });
});

// POST bind physical sensor device
router.post('/:id/bind-device', (req: Request, res: Response) => {
  const { id } = req.params;
  const { deviceId } = req.body;

  if (!deviceId) {
    return res.status(400).json({ success: false, error: 'deviceId is required.' });
  }

  const snapshot = db.getSnapshot();
  const bin = snapshot.bins.find(b => b.id === id);
  if (!bin) {
    return res.status(404).json({ success: false, error: `Bin '${id}' not found.` });
  }

  let device = snapshot.devices.find(d => d.id === deviceId);
  if (!device) {
    // Automatically register if not existing yet (developer convenience)
    db.update(draft => {
      draft.devices.push({
        id: deviceId,
        binId: id,
        apiKey: `sec_${deviceId.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Math.random().toString(36).substring(2, 7)}`,
        status: 'Online',
        firmwareVersion: 'v2.1.0-auto',
        lastHeartbeat: new Date().toISOString()
      });
    });
  }

  let updatedBin: Bin | undefined;
  db.update(draft => {
    // If device was bound to an existing other bin, safely unbind from it
    const previousBinWithDevice = draft.bins.find(b => b.sensorId === deviceId && b.id !== id);
    if (previousBinWithDevice) {
      previousBinWithDevice.sensorId = null;
    }

    // If this bin previously had a different device, set that previous device to unassigned
    if (bin.sensorId && bin.sensorId !== deviceId) {
      const oldDev = draft.devices.find(d => d.id === bin.sensorId);
      if (oldDev) {
        oldDev.binId = null;
        oldDev.status = 'Unassigned';
      }
    }

    // Update target bin
    const targetBin = draft.bins.find(b => b.id === id);
    if (targetBin) {
      targetBin.sensorId = deviceId;
      targetBin.updatedAt = new Date().toISOString();
      updatedBin = { ...targetBin };
    }

    // Update target device
    const targetDev = draft.devices.find(d => d.id === deviceId);
    if (targetDev) {
      targetDev.binId = id;
    }
  });

  eventStream.broadcast('DEVICE_BOUND', { binId: id, deviceId });
  res.json({ success: true, message: `Device '${deviceId}' bound to Bin '${id}'.`, bin: updatedBin });
});

// POST unbind physical sensor
router.post('/:id/unbind-device', (req: Request, res: Response) => {
  const { id } = req.params;
  const snapshot = db.getSnapshot();
  const bin = snapshot.bins.find(b => b.id === id);

  if (!bin) {
    return res.status(404).json({ success: false, error: `Bin '${id}' not found.` });
  }

  const deviceId = bin.sensorId;
  let updatedBin: Bin | undefined;

  db.update(draft => {
    const targetBin = draft.bins.find(b => b.id === id);
    if (targetBin) {
      targetBin.sensorId = null;
      targetBin.updatedAt = new Date().toISOString();
      updatedBin = { ...targetBin };
    }

    if (deviceId) {
      const dev = draft.devices.find(d => d.id === deviceId);
      if (dev) {
        dev.binId = null;
        dev.status = 'Unassigned';
      }
    }
  });

  eventStream.broadcast('DEVICE_UNBOUND', { binId: id, deviceId });
  res.json({ success: true, message: `Sensor unassigned from Bin '${id}'.`, bin: updatedBin });
});

export default router;
