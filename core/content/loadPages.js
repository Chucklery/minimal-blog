// core/content/loadPages.js
// 读取 content/pages/*.md（独立页面：关于等）

import { readFile, readdir } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import matter from 'gray-matter';
import { PAGES_DIR } from '../utils/paths.js';
import { slugify } from '../utils/slug.js';

/**
 * @typedef {Object} Page
 * @property {string} slug
 * @property {string} title
 * @property {string} rawContent - 原始 Markdown
 */

/**
 * 加载独立页面
 * @returns {Promise<Page[]>}
 */
export async function loadPages() {
  let files;
  try {
    files = await readdir(PAGES_DIR);
  } catch {
    console.warn(`Pages directory not found: ${PAGES_DIR}`);
    return [];
  }

  const mdFiles = files.filter((f) => extname(f) === '.md');

  const pages = [];

  for (const filename of mdFiles) {
    const filepath = join(PAGES_DIR, filename);
    const raw = await readFile(filepath, 'utf-8');
    const { data: frontmatter, content } = matter(raw);

    const slug = frontmatter.slug || slugify(basename(filename, '.md'));

    pages.push({
      slug,
      title: frontmatter.title || basename(filename, '.md'),
      rawContent: content.trim(),
      filename,
    });
  }

  return pages;
}
