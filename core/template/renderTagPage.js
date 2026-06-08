// core/template/renderTagPage.js
// Tag 页面模板

import { formatDate } from '../utils/dates.js';
import { escapeAttr } from '../utils/escapeHtml.js';

export function renderTagPage({ tag, posts, site }) {
  const bp = site.basePath || '';

  return `
<main class="tag-page">
  <header class="tag-header">
    <a href="${bp}/archive/" class="tag-back">← Archive</a>
    <h1>#${escapeHtml(tag)}</h1>
    <p class="tag-count">${posts.length} article${posts.length > 1 ? 's' : ''}</p>
  </header>

  <ul class="tag-post-list">
    ${posts
      .map(
        (post) => `
    <li>
      <time datetime="${post.date.toISOString().split('T')[0]}">${formatDate(post.date, 'iso')}</time>
      <a href="${bp}/posts/${escapeAttr(post.slug)}.html">${escapeHtml(post.title)}</a>
    </li>`
      )
      .join('')}
  </ul>
</main>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
