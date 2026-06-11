// backend/routes/auth.js
import { login } from '../services/authService.js';
import { requireAuth } from '../middleware/auth.js';

export async function registerAuthRoutes(app) {
  app.post('/api/auth/login', async (req, reply) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return reply.status(400).send({ success: false, message: 'Missing username or password' });
    }
    try {
      const result = await login(app.db, username, password);
      if (!result) return reply.status(401).send({ success: false, message: 'Invalid credentials' });
      reply.setCookie('token', result.token, { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 86400 });
      return { success: true, data: result };
    } catch (err) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  app.post('/api/auth/logout', async (req, reply) => {
    reply.clearCookie('token', { path: '/' });
    return { success: true };
  });

  app.get('/api/auth/profile', { preHandler: requireAuth }, async (req) => {
    return { success: true, data: req.user };
  });
}
