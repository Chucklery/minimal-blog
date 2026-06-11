// backend/routes/posts.js
import { requireAuth } from '../middleware/auth.js';
import * as postService from '../services/postService.js';

export async function registerPostRoutes(app) {
  app.get('/api/posts', async (req) => {
    const posts = postService.listPosts(app.db, { status: req.query.status });
    return { success: true, data: posts };
  });

  app.get('/api/posts/:id', async (req, reply) => {
    const post = postService.getPost(app.db, req.params.id);
    if (!post) return reply.status(404).send({ success: false, message: 'Not found' });
    return { success: true, data: post };
  });

  app.post('/api/posts', { preHandler: requireAuth }, async (req, reply) => {
    try {
      const post = postService.createPost(app.db, req.body);
      return reply.status(201).send({ success: true, data: post });
    } catch (err) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  app.put('/api/posts/:id', { preHandler: requireAuth }, async (req, reply) => {
    try {
      const post = postService.updatePost(app.db, req.params.id, req.body);
      return { success: true, data: post };
    } catch (err) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  app.delete('/api/posts/:id', { preHandler: requireAuth }, async (req, reply) => {
    try {
      const deleted = postService.deletePost(app.db, req.params.id);
      return { success: true, data: { slug: deleted.slug } };
    } catch (err) {
      return reply.status(404).send({ success: false, message: err.message });
    }
  });

  app.post('/api/posts/draft', { preHandler: requireAuth }, async (req, reply) => {
    const { id, title, slug, content_md } = req.body || {};
    if (!title) return reply.status(400).send({ success: false, message: 'Title required' });
    try {
      const post = postService.saveDraft(app.db, { id, title, slug, content_md });
      return { success: true, data: post };
    } catch (err) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  app.post('/api/posts/:id/publish', { preHandler: requireAuth }, async (req, reply) => {
    try {
      const post = await postService.publishPost(app.db, req.params.id);
      return { success: true, data: post };
    } catch (err) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });
}
