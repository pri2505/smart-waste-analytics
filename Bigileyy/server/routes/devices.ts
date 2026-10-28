import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { IoTDevice } from '../../src/types/index.js';
import { eventStream } from '../services/eventStream.js';

const router = Router();

// GET all devices
router.get('/', (req: Request, res: Response) => {
  const snapshot = db.getSnapshot();
  res.json({
    success: true,
    count: snapshot.devices.length,
    devices: snapshot.devices
  });
});

// POST register new IoT device
router.post('/', (req: Request, res: Response) => {
  const { id, firmwareVersion = 'v2.1.0-prod' } = req.body;

  if (!id || !id.trim()) {
    return res.status(400).json({ success: false, error: 'Device ID is required.' });
  }

  const normalizedId = id.trim().toUpperCase();
  const snapshot = db.getSnapshot();

  if (snapshot.devices.some(d => d.id === normalizedId)) {
    return res.status(409).json({ success: false, error: `Device ID '${normalizedId}' is already registered.` });
  }

  // Generate unique secret API key for this hardware device
  const randomSecret = Math.random().toString(36).substring(2, 10);
  const apiKey = `sec_${normalizedId.toLowerCase().replace(/[^a-z0-9]/g, '')}_${randomSecret}`;

  const newDevice: IoTDevice = {
    id: normalizedId,
    binId: null,
    apiKey,
    status: 'Unassigned',
    firmwareVersion,
    batteryLevel: 100,
    rssi: -50,
    lastHeartbeat: null
  };

  db.update(draft => {
    draft.devices.push(newDevice);
  });

  eventStream.broadcast('DEVICE_REGISTERED', newDevice);
  res.status(201).json({ success: true, device: newDevice });
});

// DELETE device
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const snapshot = db.getSnapshot();
  const existing = snapshot.devices.find(d => d.id === id);

  if (!existing) {
    return res.status(404).json({ success: false, error: `Device '${id}' not found.` });
  }

  db.update(draft => {
    // If bound to a bin, unbind it
    if (existing.binId) {
      const bin = draft.bins.find(b => b.id === existing.binId);
      if (bin) bin.sensorId = null;
    }
    draft.devices = draft.devices.filter(d => d.id !== id);
  });

  eventStream.broadcast('DEVICE_DELETED', { id });
  res.json({ success: true, message: `Device '${id}' removed.` });
});

export default router;
