// core/template/renderPost.js
// 文章页模板

import { formatDate } from '../utils/dates.js';
import { escapeAttr } from '../utils/escapeHtml.js';

export function renderPost({ post, htmlBody, tocHtml = '', prevPost, nextPost, site }) {
  const hasToc = tocHtml && tocHtml.length > 0;
  const tagHtml = post.tags && post.tags.length > 0
    ? post.tags.map((t) => `<span class="post-tag">#${escapeHtml(t)}</span>`).join(' ')
    : '';

  return `
<!-- 深色封面区（仅标题+meta，不含导航） -->
<div class="post-cover">
  <div class="post-cover-inner">
    <a href="/" class="post-back-cover">← Back</a>
    <h1 class="post-cover-title">${escapeHtml(post.title)}</h1>
    <div class="post-cover-meta">
      <span>Published</span>
      <time datetime="${post.date.toISOString().split('T')[0]}">${formatDate(post.date, 'short')}</time>
      ${post.readingTime ? `<span>· ${post.readingTime} min read</span>` : ''}
    </div>
    ${tagHtml ? `<div class="post-cover-tags">${tagHtml}</div>` : ''}
  </div>
</div>

<!-- 正文区 -->
<main class="post">
  <article class="post-article ${hasToc ? 'post-article--with-toc' : ''}">
    <div class="prose">
      ${htmlBody}
    </div>

    <footer class="post-footer">
      <nav class="post-nav">
        ${prevPost
          ? `<a href="/posts/${escapeAttr(prevPost.slug)}.html" class="post-nav-prev">← ${escapeHtml(prevPost.title)}</a>`
          : '<span></span>'}
        ${nextPost
          ? `<a href="/posts/${escapeAttr(nextPost.slug)}.html" class="post-nav-next">${escapeHtml(nextPost.title)} →</a>`
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
