// core/template/renderHome.js
// 首页模板 — steipete.me 风格

import { formatDate } from '../utils/dates.js';
import { escapeAttr } from '../utils/escapeHtml.js';

/**
 * 生成首页主体内容
 */
export function renderHome({ posts, site }) {
  const bp = site.basePath || '';
  const recent = posts.slice(0, site.build?.postsPerHomePage || 12);

  return `
<main class="home">
  <section class="hero">
    <h1 class="hero-title">Hi, I'm ${escapeHtml(site.author?.handle || site.author?.name || site.title)}</h1>
    <p class="hero-subtitle">${escapeHtml(site.description)}</p>
  </section>

  <hr>

  <section class="post-list">
    ${recent.map((post) => renderEntry(post, bp)).join('\n')}
  </section>

  ${
    posts.length > (site.build?.postsPerHomePage || 12)
      ? `
  <hr>
  <div class="view-all">
    <a href="${bp}/archive/">All Posts →</a>
  </div>`
      : ''
  }
</main>`;
}

function renderEntry(post, bp) {
  return `
  <article class="post-entry" data-prefetch>
    <h3 class="post-entry-title">
      <a href="${bp}/posts/${escapeAttr(post.slug)}.html">${escapeHtml(post.title)}</a>
    </h3>
    <div class="post-entry-meta">
      Published: ${formatDate(post.date, 'short')}${post.readingTime ? ` • ${post.readingTime} min read` : ''}
    </div>
    <p class="post-entry-desc">${escapeHtml(post.description)}</p>
  </article>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
