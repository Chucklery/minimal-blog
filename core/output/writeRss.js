// core/output/writeRss.js
// 生成 RSS 2.0 feed

import { writeFile } from 'node:fs/promises';
import { DIST_DIR } from '../utils/paths.js';
import { toUTCString, formatDate } from '../utils/dates.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { join } from 'node:path';

/**
 * 生成并写入 RSS
 * @param {Object} opts
 * @param {import('../content/loadPosts.js').Post[]} opts.posts
 * @param {Object} opts.site
 * @returns {Promise<void>}
 */
export async function writeRss({ posts, site }) {
  const items = posts.slice(0, 20).map(
    (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${site.baseUrl}/posts/${post.slug}.html</link>
      <guid isPermaLink="true">${site.baseUrl}/posts/${post.slug}.html</guid>
      <description><![CDATA[${post.description}]]></description>
      <pubDate>${toUTCString(post.date)}</pubDate>
    </item>`
  );

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(site.title)}</title>
    <link>${site.baseUrl}</link>
    <description>${escapeHtml(site.description)}</description>
    <language>${site.language || 'zh-CN'}</language>
    <lastBuildDate>${toUTCString(new Date())}</lastBuildDate>
    <atom:link href="${site.baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items.join('')}
  </channel>
</rss>`;

  const outPath = join(DIST_DIR, 'rss.xml');
  await writeFile(outPath, rss, 'utf-8');
  console.log('  RSS: dist/rss.xml');
}
