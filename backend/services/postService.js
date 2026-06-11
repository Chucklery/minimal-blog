// backend/services/postService.js
import * as postRepo from '../repositories/postRepository.js';
import { buildPublish } from './publishService.js';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { unlinkSync, existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = join(__dirname, '..', '..');

export function listPosts(db, opts) {
  return postRepo.findAll(db, opts);
}

export function getPost(db, id) {
  return postRepo.findById(db, id);
}

export function createPost(db, data) {
  const result = postRepo.create(db, data);
  return postRepo.findById(db, result.lastInsertRowid);
}

export function updatePost(db, id, data) {
  postRepo.update(db, id, data);
  return postRepo.findById(db, id);
}

export function deletePost(db, id) {
  // Phase 1: get post info, then remove from DB
  const post = postRepo.findById(db, id);
  if (!post) throw new Error('Post not found');
  postRepo.remove(db, id);

  // Phase 2: delete .md source file and dist HTML
  const postsDir = join(FRONTEND_ROOT, 'site', 'content', 'posts');
  const mdPath = join(postsDir, `${post.slug}.md`);
  if (existsSync(mdPath)) {
    try { unlinkSync(mdPath); } catch {}
  }

  const distHtml = join(FRONTEND_ROOT, 'dist', 'posts', `${post.slug}.html`);
  if (existsSync(distHtml)) {
    try { unlinkSync(distHtml); } catch {}
  }

  // Phase 3: trigger static site rebuild
  const buildPath = pathToFileURL(join(FRONTEND_ROOT, 'scripts', 'build.js')).href;
  import(buildPath).then(() => {
    console.log(`Deleted and rebuilt: ${post.slug}`);
  }).catch((err) => {
    console.error('Rebuild after delete failed:', err.message);
  });

  return post;
}

export function saveDraft(db, { id, title, slug, content_md }) {
  const s = slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-一-鿿]/g, '').slice(0, 80);
  if (id) {
    postRepo.update(db, id, { title, slug: s, content_md, status: 'draft', updated_at: new Date().toISOString() });
    return postRepo.findById(db, id);
  }
  const existing = postRepo.findBySlug(db, s);
  if (existing) {
    postRepo.update(db, existing.id, { title, content_md, status: 'draft' });
    return postRepo.findById(db, existing.id);
  }
  postRepo.create(db, { title, slug: s, content_md, excerpt: content_md.slice(0, 200), status: 'draft' });
  const created = postRepo.findBySlug(db, s);
  return created;
}

export async function publishPost(db, id) {
  const post = postRepo.findById(db, id);
  if (!post) throw new Error('Post not found');

  // Strip frontmatter from md before rendering (frontmatter lives inside content_md now)
  const mdBody = (post.content_md || '')
    .replace(/^\uFEFF/, '')
    .replace(/^---\s*\n[\s\S]*?\n---\s*(?:\n|$)/, '');

  // Render MD → HTML (using project's existing markdown renderer)
  const { renderMarkdown } = await import('../../core/markdown/renderMarkdown.js');
  const html = await renderMarkdown(mdBody);

  postRepo.update(db, id, {
    content_html: html,
    status: 'published',
    published_at: new Date().toISOString(),
  });

  // Index for search
  const { indexPost } = await import('../repositories/searchRepository.js');
  indexPost(db, post.id, post.content_md.replace(/<[^>]+>/g, '').replace(/[#*`_~\[\]]/g, ''));

  // Index for AI (async, don't block publish)
  import('../services/aiService.js').then(m => {
    m.indexPostForAi(db, post.id, post.title, post.content_md).catch(() => {});
  });

  // Trigger static site rebuild — pass old slug to clean up stale files
  await buildPublish(db, { ...post, content_html: html }, post.slug);
  return postRepo.findById(db, id);
}
