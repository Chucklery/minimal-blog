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
 * @param {import('../content/loadBooks.js').Book[]} [opts.books]
 */
export async function writeSearchIndex({ posts, books = [] }) {
  await mkdir(DIST_ASSETS, { recursive: true });

  const postEntries = posts.map((p) => ({
    type: 'post',
    title: p.title,
    slug: p.slug,
    url: `/posts/${p.slug}.html`,
    description: p.description,
    date: formatDate(p.date, 'iso'),
    tags: p.tags || [],
    content: normalizeMarkdown(p.rawContent),
  }));

  const bookEntries = books.flatMap((book) =>
    book.chapters.map((chapter) => ({
      type: 'book-chapter',
      title: chapter.title,
      slug: `${book.slug}-${chapter.id}`,
      url: `/books/${book.slug}/#${chapter.id}`,
      description: chapter.description || book.description,
      date: book.date ? formatDate(book.date, 'iso') : '',
      tags: book.tags || [],
      content: normalizeMarkdown(chapter.rawContent),
      bookTitle: book.title,
    }))
  );

  const index = [...postEntries, ...bookEntries];
  const json = JSON.stringify(index);
  await writeFile(join(DIST_ASSETS, 'search-index.json'), json, 'utf-8');

  const sizeKB = (json.length / 1024).toFixed(1);
  console.log(`  Search index: dist/assets/search-index.json (${sizeKB}KB)`);
}

function normalizeMarkdown(markdown) {
  return String(markdown)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~`>|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
