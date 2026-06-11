// backend/routes/media.js
import { requireAuth } from '../middleware/auth.js';
import * as mediaService from '../services/mediaService.js';

export async function registerMediaRoutes(app) {
  app.get('/api/media', async (req) => {
    const list = mediaService.listMedia(app.db);
    return { success: true, data: list };
  });

  app.post('/api/media/upload', { preHandler: requireAuth }, async (req, reply) => {
    try {
      const file = await req.file();
      if (!file) return reply.status(400).send({ success: false, message: 'No file' });
      const result = await mediaService.uploadMedia(app.db, file);
      return { success: true, data: result };
    } catch (err) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  app.delete('/api/media/:id', { preHandler: requireAuth }, async (req) => {
    mediaService.deleteMedia(app.db, req.params.id);
    return { success: true };
  });
}
