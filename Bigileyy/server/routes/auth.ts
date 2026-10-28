import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { UserProfile, UserRole } from '../../src/types/index.js';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email address is required.' });
  }

  const normalized = email.trim().toLowerCase();
  const snapshot = db.getSnapshot();
  const user = snapshot.users.find(u => u.email.toLowerCase() === normalized);

  if (!user) {
    // If not found, provide helpful error or registration guidance
    return res.status(401).json({
      success: false,
      error: `No municipal account registered for '${email}'. Try one of the preset accounts (Admin, Staff, Viewer) or register.`
    });
  }

  // Generate lightweight session token
  const token = `tok_${user.id}_${Date.now()}`;

  res.json({
    success: true,
    token,
    user,
    message: `Logged in as ${user.name} (${user.role})`
  });
});

// POST /api/v1/auth/register
router.post('/register', (req: Request, res: Response) => {
  const { email, name, role = 'Viewer', department, phone } = req.body;

  if (!email || !name) {
    return res.status(400).json({ success: false, error: 'Email and full name are required.' });
  }

  const normalized = email.trim().toLowerCase();
  const snapshot = db.getSnapshot();

  if (snapshot.users.some(u => u.email.toLowerCase() === normalized)) {
    return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
  }

  const newUser: UserProfile = {
    id: `USR-${Date.now().toString(36).toUpperCase()}`,
    email: normalized,
    name: name.trim(),
    role: role as UserRole,
    department: department?.trim() || 'General Municipal Staff',
    phone: phone?.trim() || '',
    createdAt: new Date().toISOString()
  };

  db.update(draft => {
    draft.users.push(newUser);
  });

  const token = `tok_${newUser.id}_${Date.now()}`;
  res.status(201).json({
    success: true,
    token,
    user: newUser,
    message: `Account created successfully with role: ${newUser.role}`
  });
});

// GET /api/v1/auth/presets
// Returns available preset accounts for immediate testing
router.get('/presets', (req: Request, res: Response) => {
  const snapshot = db.getSnapshot();
  res.json({
    success: true,
    presets: snapshot.users.map(u => ({
      email: u.email,
      name: u.name,
      role: u.role,
      department: u.department
    }))
  });
});

export default router;
