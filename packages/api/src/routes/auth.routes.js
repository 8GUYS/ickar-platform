import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createUser, findUserByEmail, findUserById } from '../store.js';
import { signToken, requireAuth } from '../auth.js';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Please check your details and try again.', issues: result.error.issues });
  }

  const { name, email, password } = result.data;
  if (findUserByEmail(email)) {
    return res.status(409).json({ error: 'That email already has an account.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = createUser({ email, passwordHash, name });
  const token = signToken({ id: user.id, email: user.email, role: user.role });

  return res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, tier: user.tier || 'free' },
    token,
  });
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Please check your details and try again.', issues: result.error.issues });
  }

  const { email, password } = result.data;
  const user = findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: "That email or password doesn't match." });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "That email or password doesn't match." });
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  return res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, tier: user.tier || 'free' },
    token,
  });
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, (req, res) => {
  const user = findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ id: user.id, name: user.name, email: user.email, role: user.role, tier: user.tier || 'free' });
});
