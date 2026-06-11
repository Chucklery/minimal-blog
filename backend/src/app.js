// backend/src/app.js
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import multipart from '@fastify/multipart';
import { initDatabase } from './db/database.js';
import { seedAdmin } from '../services/authService.js';
import { registerAuthRoutes } from '../routes/auth.js';
import { registerPostRoutes } from '../routes/posts.js';
import { registerMediaRoutes } from '../routes/media.js';
import { registerViewRoutes } from '../routes/views.js';
import { registerSearchRoutes } from '../routes/search.js';
import { registerAdminRoutes } from '../routes/admin.js';
import { registerAiRoutes } from '../routes/ai.js';

const app = Fastify({ logger: { level: 'warn' } });
await app.register(cors);
await app.register(cookie);
await app.register(formbody);
await app.register(multipart);

const db = initDatabase();
await seedAdmin(db);
app.decorate('db', db);

await app.register(registerAuthRoutes);
await app.register(registerPostRoutes);
await app.register(registerMediaRoutes);
await app.register(registerViewRoutes, { prefix: '/api/posts' });
await app.register(registerSearchRoutes);
await app.register(registerAdminRoutes);
await app.register(registerAiRoutes);

app.addHook('onRequest', async (request, reply) => {
  request.raw.on('close', () => {
    if (request.raw.aborted) {
      app.log.info('request closed')
    }
  })
})

app.get('/health', async () => ({ status: 'ok' }));

try {
  await app.listen({ port: 8055, host: '0.0.0.0' });
  console.log('Backend: http://localhost:8055');
} catch (err) {
  console.error('Start failed:', err.message);
  process.exit(1);
}

export { app };
