// backend/routes/search.js
import { searchPosts } from '../services/searchService.js';

export async function registerSearchRoutes(app) {
  app.get('/api/search', async (req, reply) => {
    const q = req.query.q || '';
    if (!q.trim()) return { success: true, data: [] };
    try {
      const results = searchPosts(app.db, q);
      return { success: true, data: results };
    } catch (err) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });
}
