// core/output/writeRss.js
// 生成 RSS 2.0 feed

import { writeFile } from 'node:fs/promises';
import { DIST_DIR } from '../utils/paths.js';
import { toUTCString } from '../utils/dates.js';
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
  const siteUrl = `${site.baseUrl.replace(/\/+$/, '')}/`;
  const feedUrl = new URL('rss.xml', siteUrl).href;

  const items = posts.slice(0, 20).map(
    (post) => {
      const postUrl = new URL(`posts/${encodeURIComponent(post.slug)}.html`, siteUrl).href;
      return `
    <item>
      <title><![CDATA[${toCdata(post.title)}]]></title>
      <link>${escapeHtml(postUrl)}</link>
      <guid isPermaLink="true">${escapeHtml(postUrl)}</guid>
      <description><![CDATA[${toCdata(post.description)}]]></description>
      <pubDate>${toUTCString(post.date)}</pubDate>
    </item>`;
    }
  );

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(site.title)}</title>
    <link>${escapeHtml(siteUrl)}</link>
    <description>${escapeHtml(site.description)}</description>
    <language>${site.language || 'zh-CN'}</language>
    <lastBuildDate>${toUTCString(new Date())}</lastBuildDate>
    <atom:link href="${escapeHtml(feedUrl)}" rel="self" type="application/rss+xml"/>
    ${items.join('')}
  </channel>
</rss>`;

  const outPath = join(DIST_DIR, 'rss.xml');
  await writeFile(outPath, rss, 'utf-8');
  console.log('  RSS: dist/rss.xml');
}

function toCdata(value) {
  return String(value || '').replaceAll(']]>', ']]]]><![CDATA[>');
}
