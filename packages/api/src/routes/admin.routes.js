import { Router } from 'express';
import { requireAdmin } from '../auth.js';
import { getAdminStats, mediaCatalog, subscriptions, orders, users } from '../store.js';
import { v4 as uuidv4 } from 'uuid';

export const adminRouter = Router();

// All admin routes require admin role
adminRouter.use(requireAdmin);

// GET /api/admin/stats — platform analytics
adminRouter.get('/stats', (req, res) => {
  return res.json(getAdminStats());
});

// GET /api/admin/subscribers — list of active subscribers
adminRouter.get('/subscribers', (req, res) => {
  const subs = [...subscriptions.values()];
  return res.json({ subscribers: subs, total: subs.length });
});

// GET /api/admin/orders — list of all orders
adminRouter.get('/orders', (req, res) => {
  const allOrders = [...orders.values()];
  return res.json({ orders: allOrders, total: allOrders.length });
});

// GET /api/admin/catalog — full catalog including private storage keys
adminRouter.get('/catalog', (req, res) => {
  const items = [...mediaCatalog.values()];
  return res.json({ items, total: items.length });
});

// POST /api/admin/catalog — add new media item
adminRouter.post('/catalog', (req, res) => {
  const { title, author, type, price, category, description } = req.body;
  if (!title || !author || !type || !price) {
    return res.status(400).json({ error: 'title, author, type and price are required' });
  }

  const id = uuidv4();
  const newItem = {
    id,
    slug: title.toLowerCase().replace(/\s+/g, '-'),
    title, author, type, price,
    category: category || 'General',
    description: description || '',
    isSubscriptionIncluded: true,
    rating: 0,
    hlsManifestKey: `media/${id}/audio/index.m3u8`,
    pdfKey: type === 'ebook' ? `media/${id}/book/document.pdf` : null,
    createdAt: new Date().toISOString(),
  };
  mediaCatalog.set(id, newItem);

  return res.status(201).json({ item: newItem, message: 'Media item created. Upload files to trigger HLS transcoding worker.' });
});

// GET /api/admin/users — list all users
adminRouter.get('/users', (req, res) => {
  const allUsers = [...users.values()].map(({ passwordHash, ...safe }) => safe);
  return res.json({ users: allUsers, total: allUsers.length });
});
