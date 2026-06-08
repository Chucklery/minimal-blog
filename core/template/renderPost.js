// core/template/renderPost.js
// 文章页模板

import { formatDate } from '../utils/dates.js';
import { escapeAttr } from '../utils/escapeHtml.js';

export function renderPost({ post, htmlBody, tocHtml = '', prevPost, nextPost, site }) {
  const bp = site.basePath || '';
  const hasToc = tocHtml && tocHtml.length > 0;
  const tagHtml = post.tags && post.tags.length > 0
    ? post.tags.map((t) => `<span class="post-tag">#${escapeHtml(t)}</span>`).join(' ')
    : '';

  return `
<div class="post-cover">
  <div class="post-cover-inner">
    <a href="${bp}/" class="post-back-cover"><svg class="arrow-icon" width="16" height="16" viewBox="0 0 16 16"><path d="M10 2 L5 7 l0.7 0.7 3.8-3.8 0 10.1 h1 V3.9 l3.8 3.8 L13 7 Z" fill="currentColor"/></svg></a>
    <h1 class="post-cover-title">${escapeHtml(post.title)}</h1>
    <div class="post-cover-meta">
      <span>Published</span>
      <time datetime="${post.date.toISOString().split('T')[0]}">${formatDate(post.date, 'short')}</time>
      ${post.readingTime ? `<span>· ${post.readingTime} min read</span>` : ''}
    </div>
    ${tagHtml ? `<div class="post-cover-tags">${tagHtml}</div>` : ''}
  </div>
</div>

<main class="post">
  <article class="post-article ${hasToc ? 'post-article--with-toc' : ''}">
    <div class="prose">
      ${htmlBody}
    </div>

    <footer class="post-footer">
      <nav class="post-nav">
        ${prevPost
          ? `<a href="${bp}/posts/${escapeAttr(prevPost.slug)}.html" class="post-nav-prev"><svg class="arrow-icon" width="14" height="14" viewBox="0 0 16 16"><path d="M10 2 L5 7 l0.7 0.7 3.8-3.8 0 10.1 h1 V3.9 l3.8 3.8 L13 7 Z" fill="currentColor"/></svg> ${escapeHtml(prevPost.title)}</a>`
          : '<span></span>'}
        ${nextPost
          ? `<a href="${bp}/posts/${escapeAttr(nextPost.slug)}.html" class="post-nav-next">${escapeHtml(nextPost.title)} →</a>`
          : '<span></span>'}
      </nav>
    </footer>
  </article>

  ${hasToc ? `
  <aside class="post-toc">
    <div class="toc-sticky">${tocHtml}</div>
  </aside>` : ''}
</main>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
