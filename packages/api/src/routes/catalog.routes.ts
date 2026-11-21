import { Router } from 'express';
import { prisma } from '../db.js';

export const catalogRouter = Router();

// GET /api/catalog — public list of published media items
catalogRouter.get('/', async (req, res) => {
  const { q, category, type } = req.query as { q?: string; category?: string; type?: string };

  try {
    const where: any = {
      published: true,
    };

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (type) {
      where.type = type.toUpperCase();
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { author: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.mediaItem.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        author: true,
        narrator: true,
        coverUrl: true,
        type: true,
        duration: true,
        pages: true,
        rating: true,
        priceKobo: true,
        isSubscriptionIncluded: true,
        category: true,
        description: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map priceKobo back to price in Naira for the frontend
    const mapped = items.map((item: any) => ({
      ...item,
      price: Math.round(item.priceKobo / 100),
      type: item.type.toLowerCase(),
    }));

    return res.json({ items: mapped, total: mapped.length });
  } catch (error: any) {
    console.error('Catalog query error:', error);
    return res.status(500).json({ error: 'Failed to fetch catalog' });
  }
});

// GET /api/catalog/:id — single media details
catalogRouter.get('/:id', async (req, res) => {
  try {
    const item = await prisma.mediaItem.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        slug: true,
        title: true,
        author: true,
        narrator: true,
        coverUrl: true,
        type: true,
        duration: true,
        pages: true,
        rating: true,
        priceKobo: true,
        isSubscriptionIncluded: true,
        category: true,
        description: true,
        createdAt: true,
      },
    });

    if (!item) return res.status(404).json({ error: 'Media not found' });

    return res.json({
      ...item,
      price: Math.round(item.priceKobo / 100),
      type: item.type.toLowerCase(),
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch media details' });
  }
});
