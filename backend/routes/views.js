// backend/routes/views.js
import { getViews, incrementView } from '../services/viewService.js';

export async function registerViewRoutes(app) {
  app.get('/:slug/views', async (req, reply) => {
    try {
      const count = getViews(app.db, req.params.slug);
      return { success: true, data: { count } };
    } catch (err) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  app.post('/:slug/view', async (req, reply) => {
    try {
      const count = incrementView(app.db, req.params.slug);
      return { success: true, data: { count } };
    } catch (err) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });
}
