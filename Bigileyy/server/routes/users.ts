import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { UserProfile, UserRole } from '../../src/types/index.js';
import { eventStream } from '../services/eventStream.js';

const router = Router();

// GET all users
router.get('/', (req: Request, res: Response) => {
  const snapshot = db.getSnapshot();
  res.json({
    success: true,
    count: snapshot.users.length,
    users: snapshot.users
  });
});

// POST create user (Admin only)
router.post('/', (req: Request, res: Response) => {
  const { email, name, role = 'Staff', department, phone } = req.body;

  if (!email || !name) {
    return res.status(400).json({ success: false, error: 'Email and full name are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const snapshot = db.getSnapshot();

  if (snapshot.users.some(u => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(409).json({ success: false, error: `User with email '${normalizedEmail}' already exists.` });
  }

  const newUser: UserProfile = {
    id: `USR-${Date.now().toString(36).toUpperCase()}`,
    email: normalizedEmail,
    name: name.trim(),
    role: role as UserRole,
    department: department?.trim() || 'Municipal Operations',
    phone: phone?.trim() || '',
    createdAt: new Date().toISOString()
  };

  db.update(draft => {
    draft.users.push(newUser);
  });

  eventStream.broadcast('USER_CREATED', newUser);
  res.status(201).json({ success: true, user: newUser });
});

// PUT update user role or department
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, role, department, phone } = req.body;

  let updatedUser: UserProfile | undefined;
  db.update(draft => {
    const user = draft.users.find(u => u.id === id);
    if (user) {
      if (name) user.name = name.trim();
      if (role) user.role = role as UserRole;
      if (department) user.department = department.trim();
      if (phone !== undefined) user.phone = phone.trim();
      updatedUser = { ...user };
    }
  });

  if (!updatedUser) {
    return res.status(404).json({ success: false, error: `User '${id}' not found.` });
  }

  eventStream.broadcast('USER_UPDATED', updatedUser);
  res.json({ success: true, user: updatedUser });
});

// DELETE user
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const snapshot = db.getSnapshot();
  const existing = snapshot.users.find(u => u.id === id);

  if (!existing) {
    return res.status(404).json({ success: false, error: `User '${id}' not found.` });
  }

  if (existing.email === 'admin@municipal.gov.in') {
    return res.status(403).json({ success: false, error: 'Cannot delete the primary root Administrator account.' });
  }

  db.update(draft => {
    draft.users = draft.users.filter(u => u.id !== id);
  });

  eventStream.broadcast('USER_DELETED', { id });
  res.json({ success: true, message: `User '${id}' removed.` });
});

export default router;
