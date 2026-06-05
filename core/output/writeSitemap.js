// core/output/writeSitemap.js
// 生成 sitemap.xml

import { writeFile } from 'node:fs/promises';
import { DIST_DIR } from '../utils/paths.js';
import { formatDate } from '../utils/dates.js';
import { join } from 'node:path';

/**
 * 生成并写入 sitemap
 * @param {Object} opts
 * @param {import('../content/loadPosts.js').Post[]} opts.posts
 * @param {Object} opts.site
 * @returns {Promise<void>}
 */
export async function writeSitemap({ posts, site }) {
  const urls = [
    { loc: site.baseUrl, priority: '1.0', changefreq: 'daily' },
    { loc: `${site.baseUrl}/archive/`, priority: '0.7' },
    { loc: `${site.baseUrl}/about/`, priority: '0.6' },
    ...posts.map((p) => ({
      loc: `${site.baseUrl}/posts/${p.slug}.html`,
      priority: '0.8',
      lastmod: formatDate(p.date, 'iso'),
    })),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <priority>${u.priority}</priority>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    ${u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;

  const outPath = join(DIST_DIR, 'sitemap.xml');
  await writeFile(outPath, sitemap, 'utf-8');
  console.log('  Sitemap: dist/sitemap.xml');
}
