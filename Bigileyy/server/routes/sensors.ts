import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { IoTEngine } from '../services/iotEngine.js';

const router = Router();

// POST /api/v1/sensors/reading
// Core IoT telemetry ingestion from ESP32 or developer hardware simulator
router.post('/reading', (req: Request, res: Response) => {
  // Extract credentials from either HTTP headers or JSON payload
  const deviceId = (req.headers['x-device-id'] as string) || req.body.deviceId;
  const apiKey = (req.headers['x-device-key'] as string) || req.body.apiKey;
  const distanceCm = Number(req.body.distanceCm);
  const batteryLevel = req.body.batteryLevel !== undefined ? Number(req.body.batteryLevel) : undefined;
  const rssi = req.body.rssi !== undefined ? Number(req.body.rssi) : undefined;
  const isSimulated = Boolean(req.body.isSimulated);
  const timestamp = req.body.timestamp || new Date().toISOString();
  const ipAddress = req.ip || (req.socket.remoteAddress as string);

  if (!deviceId) {
    return res.status(400).json({
      success: false,
      error: 'Device ID required (provide X-Device-Id header or deviceId body field)'
    });
  }

  if (isNaN(distanceCm)) {
    return res.status(400).json({
      success: false,
      error: 'Valid numeric distanceCm measurement is required'
    });
  }

  const result = IoTEngine.processTelemetry({
    deviceId,
    apiKey,
    distanceCm,
    batteryLevel,
    rssi,
    ipAddress,
    isSimulated,
    timestamp
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  return res.status(200).json({
    success: true,
    message: 'Telemetry ingested successfully',
    data: {
      reading: result.reading,
      bin: result.bin ? {
        id: result.bin.id,
        currentFillPercentage: result.bin.currentFillPercentage,
        status: result.bin.status,
        lastSensorUpdate: result.bin.lastSensorUpdate
      } : null
    }
  });
});

// GET /api/v1/sensors/readings
router.get('/readings', (req: Request, res: Response) => {
  const { binId, deviceId, limit = '100' } = req.query;
  const snapshot = db.getSnapshot();
  let list = [...snapshot.readings];

  if (typeof binId === 'string') {
    list = list.filter(r => r.binId === binId);
  }
  if (typeof deviceId === 'string') {
    list = list.filter(r => r.deviceId === deviceId);
  }

  const max = Math.min(Number(limit) || 100, 500);
  list = list.slice(0, max);

  res.json({ success: true, count: list.length, readings: list });
});

export default router;
