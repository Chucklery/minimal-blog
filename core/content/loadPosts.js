// core/content/loadPosts.js
// 读取 content/posts/*.md，解析 frontmatter，校验，排序

import { readFile, readdir } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import matter from 'gray-matter';
import { POSTS_DIR } from '../utils/paths.js';
import { validateFrontmatter } from './validateFrontmatter.js';
import { slugify } from '../utils/slug.js';

/**
 * @typedef {Object} Post
 * @property {string} slug
 * @property {string} title
 * @property {Date} date
 * @property {string} description
 * @property {string[]} tags
 * @property {boolean} draft
 * @property {boolean} featured
 * @property {string} [cover]
 * @property {string} [updated]
 * @property {string} rawContent   - 原始 Markdown
 * @property {string} filename     - 源文件名
 * @property {number} [readingTime] - 阅读时间，稍后填充
 */

/**
 * 加载所有文章
 * @param {Object} [options]
 * @param {boolean} [options.includeDrafts=false]
 * @returns {Promise<Post[]>}
 */
export async function loadPosts(options = {}) {
  const { includeDrafts = false } = options;

  let files;
  try {
    files = await readdir(POSTS_DIR);
  } catch {
    console.warn(`Posts directory not found: ${POSTS_DIR}`);
    return [];
  }

  const mdFiles = files.filter((f) => extname(f) === '.md');

  if (mdFiles.length === 0) {
    console.warn('No markdown files found in posts directory');
    return [];
  }

  const posts = [];

  for (const filename of mdFiles) {
    const filepath = join(POSTS_DIR, filename);
    const raw = await readFile(filepath, 'utf-8');
    const { data: frontmatter, content } = matter(raw);

    // 校验
    const { valid, errors } = validateFrontmatter(frontmatter, filename);
    if (!valid) {
      console.error('Frontmatter validation failed:');
      errors.forEach((e) => console.error('  ' + e));
      continue; // 跳过无效文章
    }

    const slug = frontmatter.slug || slugify(basename(filename, '.md'));

    posts.push({
      slug,
      title: frontmatter.title.trim(),
      date: new Date(frontmatter.date),
      description: frontmatter.description.trim(),
      tags: frontmatter.tags || [],
      draft: frontmatter.draft || false,
      featured: frontmatter.featured || false,
      cover: frontmatter.cover || null,
      updated: frontmatter.updated || null,
      rawContent: content.trim(),
      filename,
    });
  }

  // 过滤草稿
  const filtered = includeDrafts ? posts : posts.filter((p) => !p.draft);

  // 按日期降序排列
  filtered.sort((a, b) => b.date - a.date);

  // 确保 slug 唯一
  const seen = new Set();
  for (const post of filtered) {
    let candidate = post.slug;
    let counter = 1;
    while (seen.has(candidate)) {
      candidate = `${post.slug}-${counter}`;
      counter++;
    }
    post.slug = candidate;
    seen.add(candidate);
  }

  return filtered;
}
