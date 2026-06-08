// core/output/writeTagPages.js
// 构建期生成 /tags/{tag}/index.html

import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { DIST_DIR } from '../utils/paths.js';
import { writePage } from './writePage.js';

/**
 * 收集所有 tag → 文章映射
 */
function buildTagMap(posts) {
  const map = new Map();
  for (const post of posts) {
    if (!post.tags || post.tags.length === 0) continue;
    for (const tag of post.tags) {
      const key = tag.toLowerCase();
      if (!map.has(key)) map.set(key, { label: tag, posts: [] });
      map.get(key).posts.push(post);
    }
  }
  // 按文章数降序
  return new Map([...map.entries()].sort((a, b) => b[1].posts.length - a[1].posts.length));
}

/**
 * 生成 tag 页并写入
 */
export async function writeTagPages({ posts, site, renderTagPage, renderLayout, minify }) {
  const tagMap = buildTagMap(posts);
  if (tagMap.size === 0) return tagMap;

  await mkdir(join(DIST_DIR, 'tags'), { recursive: true });

  for (const [key, { label, posts: tagPosts }] of tagMap) {
    const bodyContent = renderTagPage({ tag: label, posts: tagPosts, site });
    let html = renderLayout({
      site,
      page: 'tag',
      title: `#${label}`,
      description: `${tagPosts.length} article${tagPosts.length > 1 ? 's' : ''} tagged "${label}"`,
      bodyContent,
      canonicalUrl: `${site.baseUrl}/tags/${key}/`,
    });

    if (site.build?.minifyHtml && minify) {
      const { minify: minifyFn } = await import('html-minifier-terser');
      html = await minifyFn(html, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
      });
    }

    await writePage(`tags/${key}/index.html`, html);
  }

  console.log(`  Tags: ${tagMap.size} pages → dist/tags/`);
  return tagMap;
}
