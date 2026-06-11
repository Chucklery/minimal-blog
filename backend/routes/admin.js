// backend/routes/admin.js
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import view from '@fastify/view';
import fastifyStatic from '@fastify/static';
import ejs from 'ejs';
import jwt from 'jsonwebtoken';
import * as postService from '../services/postService.js';
import * as mediaService from '../services/mediaService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || 'minimal-blog-dev-secret';

export async function registerAdminRoutes(app) {
  // Serve editor JS files
  await app.register(fastifyStatic, {
    root: join(__dirname, '..', 'admin', 'editor'),
    prefix: '/admin/editor/',
    decorateReply: false,
  });

  await app.register(view, {
    engine: { ejs },
    root: join(__dirname, '..', 'admin', 'views'),
    layout: false,
    defaultContext: {
      formatDate: (val) => {
        if (!val) return '—';
        try {
          const raw = String(val).trim();
          const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
          const d = new Date(normalized);
          if (isNaN(d.getTime())) return raw.slice(0, 10) || '—';
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const hh = String(d.getHours()).padStart(2, '0');
          const mm = String(d.getMinutes()).padStart(2, '0');
          return `${y}/${m}/${day} ${hh}:${mm}`;
        } catch {
          return String(val).slice(0, 10) || '—';
        }
      },
    },
  });

  // Login
  app.get('/admin/login', async (req, reply) => { return reply.view('login.ejs', { error: null }); });
  app.post('/admin/login', async (req, reply) => {
    const { username, password } = req.body || {};
    try {
      const { login } = await import('../services/authService.js');
      const result = await login(app.db, username, password);
      if (!result) return reply.view('login.ejs', { error: 'Invalid credentials' });
      reply.setCookie('token', result.token, { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 86400 });
      return reply.redirect('/admin/dashboard');
    } catch {
      return reply.view('login.ejs', { error: 'Login failed' });
    }
  });

  // Protected pages
  app.get('/admin/dashboard', { preHandler: adminAuth }, async (req, reply) => {
    const posts = postService.listPosts(app.db);
    const media = mediaService.listMedia(app.db);
    return reply.view('dashboard.ejs', { posts, media, user: req.adminUser });
  });

  app.get('/admin/posts', { preHandler: adminAuth }, async (req, reply) => {
    const posts = postService.listPosts(app.db);
    return reply.view('posts.ejs', { posts, user: req.adminUser });
  });

  app.get('/admin/posts/new', { preHandler: adminAuth }, async (req, reply) => {
    const html = renderEditorPage({ post: null, user: req.adminUser });
    return reply.type('text/html').send(html);
  });

  app.get('/admin/posts/:id/edit', { preHandler: adminAuth }, async (req, reply) => {
    const post = postService.getPost(app.db, req.params.id);
    if (!post) return reply.status(404).send('Not found');
    const html = renderEditorPage({ post, user: req.adminUser });
    return reply.type('text/html').send(html);
  });

  app.get('/admin/media', { preHandler: adminAuth }, async (req, reply) => {
    const list = mediaService.listMedia(app.db);
    return reply.view('media.ejs', { media: list, user: req.adminUser });
  });

  app.get('/admin/settings', { preHandler: adminAuth }, async (req, reply) => {
    return reply.view('settings.ejs', { user: req.adminUser });
  });
}

// Render editor page with data injection
const EDITOR_HTML = readFileSync(join(__dirname, '..', 'admin', 'editor', 'editor.ejs'), 'utf-8');

function escapeHtmlAttr(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderEditorPage({ post, user }) {
  const postId = post ? String(post.id) : '';
  const postMd = post ? String(post.content_md || '') : '';
  const title = post ? escapeHtmlAttr(post.title) : '';
  const slug = post ? escapeHtmlAttr(post.slug) : '';

  const created = post ? (post.created_at || '') : '';
  const updated = post ? (post.updated_at || '') : '';

  const dataScript = `<script>
window.__POST_ID__=${JSON.stringify(postId)};
window.__POST_MD__=${JSON.stringify(postMd)};
window.__POST_CREATED__=${JSON.stringify(created)};
window.__POST_UPDATED__=${JSON.stringify(updated)};
</script>`;

  return EDITOR_HTML
    .replace('__TITLE__', post ? 'Edit' : 'New')
    .replace('__POST_TITLE__', title)
    .replace('__POST_SLUG__', slug)
    .replace('</head>', `${dataScript}</head>`);
}

async function adminAuth(req, reply) {
  const token = req.cookies?.token;
  if (!token) return reply.redirect('/admin/login');
  try {
    req.adminUser = jwt.verify(token, JWT_SECRET);
  } catch {
    return reply.redirect('/admin/login');
  }
}
