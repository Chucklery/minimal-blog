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
    <a href="${bp}/" class="post-back-cover"><img src="${bp}/left-arrow.svg" alt="←" class="arrow-icon" width="16" height="16"></a>
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
          ? `<a href="${bp}/posts/${escapeAttr(prevPost.slug)}.html" class="post-nav-prev"><img src="${bp}/left-arrow.svg" alt="←" class="arrow-icon" width="14" height="14"> ${escapeHtml(prevPost.title)}</a>`
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
