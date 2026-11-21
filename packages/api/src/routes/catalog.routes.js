import { Router } from 'express';
import { mediaCatalog } from '../store.js';

export const catalogRouter = Router();

// GET /api/catalog — public list of all titles (safe fields only)
catalogRouter.get('/', (req, res) => {
  const { q, category, type } = req.query;
  let items = [...mediaCatalog.values()];

  if (q) {
    const search = q.toLowerCase();
    items = items.filter(m =>
      m.title.toLowerCase().includes(search) ||
      m.author.toLowerCase().includes(search)
    );
  }
  if (category) {
    items = items.filter(m => m.category.toLowerCase() === category.toLowerCase());
  }
  if (type) {
    items = items.filter(m => m.type === type);
  }

  // Strip private storage keys from public response
  const safe = items.map(({ hlsManifestKey, pdfKey, ...rest }) => rest);
  return res.json({ items: safe, total: safe.length });
});

// GET /api/catalog/:id — single title public view
catalogRouter.get('/:id', (req, res) => {
  const media = mediaCatalog.get(req.params.id);
  if (!media) return res.status(404).json({ error: 'Media not found' });
  const { hlsManifestKey, pdfKey, ...safe } = media;
  return res.json(safe);
});
