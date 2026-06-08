// core/template/renderArchive.js
// 归档页模板

import { formatDate, getYear, groupByYear } from '../utils/dates.js';
import { escapeAttr } from '../utils/escapeHtml.js';

/**
 * 生成归档页主体内容
 * @param {Object} opts
 * @param {import('../content/loadPosts.js').Post[]} opts.posts
 * @param {Object} opts.site
 * @returns {string}
 */
export function renderArchive({ posts, site }) {
  const bp = site.basePath || '';
  const grouped = groupByYear(posts);
  const years = Array.from(grouped.keys()).sort((a, b) => b - a);
  const tagCloud = buildTagCloud(posts, bp);

  return `
<main class="archive">
  <header class="archive-header">
    <h1>Archive</h1>
    <p>${posts.length} posts</p>
  </header>

  ${tagCloud ? `<nav class="tag-cloud">${tagCloud}</nav>` : ''}

  <div class="archive-list">
    ${years
      .map(
        (year) => `
    <section class="archive-year">
      <h2 class="archive-year-title">${year}</h2>
      <ul class="archive-year-list">
        ${grouped
          .get(year)
          .map(
            (post) => `
        <li>
          <time datetime="${post.date.toISOString().split('T')[0]}">${formatDate(post.date, 'iso')}</time>
          <a href="${bp}/posts/${escapeAttr(post.slug)}.html">${escapeHtml(post.title)}</a>
        </li>`
          )
          .join('')}
      </ul>
    </section>`
      )
      .join('\n')}
  </div>
</main>`;
}

function buildTagCloud(posts, bp) {
  const map = new Map();
  for (const post of posts) {
    if (!post.tags || post.tags.length === 0) continue;
    for (const tag of post.tags) {
      const key = tag.toLowerCase();
      if (!map.has(key)) map.set(key, { label: tag, count: 0 });
      map.get(key).count++;
    }
  }
  if (map.size === 0) return '';

  const entries = [...map.entries()].sort((a, b) => b[1].count - a[1].count);
  return entries
    .map(([key, { label, count }]) => {
      let cls = 'tag-cloud-sm';
      if (count >= 5) cls = 'tag-cloud-lg';
      else if (count >= 2) cls = 'tag-cloud-md';
      return `<a href="${bp}/tags/${key}/" class="tag-cloud-link ${cls}">#${escapeHtml(label)}</a>`;
    })
    .join(' ');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
