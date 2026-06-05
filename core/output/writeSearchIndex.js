// core/output/writeSearchIndex.js
// 构建期生成搜索索引 JSON

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { DIST_ASSETS } from '../utils/paths.js';
import { formatDate } from '../utils/dates.js';

/**
 * 生成搜索索引
 * @param {Object} opts
 * @param {import('../content/loadPosts.js').Post[]} opts.posts
 */
export async function writeSearchIndex({ posts }) {
  await mkdir(DIST_ASSETS, { recursive: true });

  const index = posts.map((p) => ({
    title: p.title,
    slug: p.slug,
    description: p.description,
    date: formatDate(p.date, 'iso'),
    tags: p.tags || [],
  }));

  const json = JSON.stringify(index);
  await writeFile(join(DIST_ASSETS, 'search-index.json'), json, 'utf-8');

  const sizeKB = (json.length / 1024).toFixed(1);
  console.log(`  Search index: dist/assets/search-index.json (${sizeKB}KB)`);
}
