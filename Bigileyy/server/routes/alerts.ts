import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { AlertEngine } from '../services/alertEngine.js';

const router = Router();

// GET all alerts with filter
router.get('/', (req: Request, res: Response) => {
  const { status, severity, binId } = req.query;
  const snapshot = db.getSnapshot();
  let list = [...snapshot.alerts];

  if (typeof status === 'string' && status !== 'ALL') {
    list = list.filter(a => a.status === status);
  }
  if (typeof severity === 'string' && severity !== 'ALL') {
    list = list.filter(a => a.severity === severity);
  }
  if (typeof binId === 'string' && binId) {
    list = list.filter(a => a.binId === binId);
  }

  const unreadCount = snapshot.alerts.filter(a => a.status === 'active').length;

  res.json({
    success: true,
    count: list.length,
    unreadCount,
    alerts: list
  });
});

// POST acknowledge alert
router.post('/:id/acknowledge', (req: Request, res: Response) => {
  const { id } = req.params;
  const { user = 'Municipal Staff Operator' } = req.body;

  const success = AlertEngine.acknowledge(id, user);
  if (!success) {
    return res.status(404).json({ success: false, error: `Alert '${id}' not found.` });
  }

  res.json({ success: true, message: `Alert '${id}' acknowledged by ${user}.` });
});

// POST resolve alert
router.post('/:id/resolve', (req: Request, res: Response) => {
  const { id } = req.params;

  const success = AlertEngine.resolve(id);
  if (!success) {
    return res.status(404).json({ success: false, error: `Alert '${id}' not found.` });
  }

  res.json({ success: true, message: `Alert '${id}' resolved.` });
});

export default router;
