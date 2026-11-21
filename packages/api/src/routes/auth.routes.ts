import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { signToken, requireAuth } from '../auth.js';

export const authRouter = Router();

const DEFAULT_TENANT_SLUG = 'ickar-global';

// Ensure default tenant exists
async function getDefaultTenantId(): Promise<string> {
  let tenant = await prisma.tenant.findUnique({
    where: { slug: DEFAULT_TENANT_SLUG },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'ICKAR Platform Global',
        slug: DEFAULT_TENANT_SLUG,
      },
    });
  }

  return tenant.id;
}

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
    return res.status(400).json({ error: 'Validation failed', issues: result.error.issues });
  }

  const { name, email, password } = result.data;

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const tenantId = await getDefaultTenantId();
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        tenantId,
        name,
        email,
        passwordHash,
        role: 'SUBSCRIBER',
      },
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role, tenantId: user.tenantId });

    return res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (error: any) {
    console.error('Registration database error:', error);
    return res.status(500).json({ error: 'Failed to create user account' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', issues: result.error.issues });
  }

  const { email, password } = result.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role, tenantId: user.tenantId });

    return res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (error: any) {
    console.error('Login database error:', error);
    return res.status(500).json({ error: 'Authentication service unavailable' });
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});
