// backend/routes/ai.js — AI Chat API
import { chatWithContext } from '../services/aiService.js';

export async function registerAiRoutes(app) {
  app.post('/api/ai/chat', async (req, reply) => {
    const { message } = req.body || {};
    if (!message) return reply.status(400).send({ success: false, message: 'Missing message' });
    try {
      const result = await chatWithContext(app.db, message);
      return { success: true, data: result };
    } catch (err) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });
}
