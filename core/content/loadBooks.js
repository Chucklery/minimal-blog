// 读取 content/books/*/book.json，并按清单顺序加载章节 Markdown

import { readFile, readdir } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import matter from 'gray-matter';
import { BOOKS_DIR } from '../utils/paths.js';

/**
 * @typedef {Object} BookChapter
 * @property {string} id
 * @property {number} number
 * @property {string} title
 * @property {string} description
 * @property {string} filename
 * @property {string} rawContent
 */

/**
 * @typedef {Object} Book
 * @property {string} slug
 * @property {string} title
 * @property {string} description
 * @property {string} author
 * @property {Date|null} date
 * @property {string[]} tags
 * @property {boolean} draft
 * @property {BookChapter[]} chapters
 */

/**
 * @param {{includeDrafts?: boolean}} options
 * @returns {Promise<Book[]>}
 */
export async function loadBooks({ includeDrafts = false } = {}) {
  let entries;
  try {
    entries = await readdir(BOOKS_DIR, { withFileTypes: true });
  } catch {
    return [];
  }

  const directories = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .sort((a, b) => a.name.localeCompare(b.name));
  const books = [];
  const seenSlugs = new Set();

  for (const directory of directories) {
    const bookDir = join(BOOKS_DIR, directory.name);
    const manifestPath = join(bookDir, 'book.json');
    let manifest;

    try {
      manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
    } catch (error) {
      throw new Error(`Invalid book manifest: ${manifestPath} (${error.message})`);
    }

    validateManifest(manifest, directory.name);
    if (manifest.draft && !includeDrafts) continue;
    if (seenSlugs.has(manifest.slug)) {
      throw new Error(`Duplicate book slug: "${manifest.slug}"`);
    }
    seenSlugs.add(manifest.slug);

    const chapters = [];
    const seenChapterIds = new Set();
    for (let index = 0; index < manifest.chapters.length; index += 1) {
      const filename = manifest.chapters[index];
      if (filename !== basename(filename) || extname(filename) !== '.md') {
        throw new Error(`Unsafe chapter path in ${manifestPath}: "${filename}"`);
      }

      const chapterPath = join(bookDir, filename);
      const raw = await readFile(chapterPath, 'utf-8');
      const { data, content } = matter(raw);
      const number = index + 1;
      const numericPrefix = basename(filename, '.md').match(/^\d+/)?.[0];
      const id = data.id || `chapter-${numericPrefix || String(number).padStart(2, '0')}`;
      if (!/^[A-Za-z0-9_-]+$/.test(id)) {
        throw new Error(`Invalid chapter id in ${chapterPath}: "${id}"`);
      }
      if (seenChapterIds.has(id)) {
        throw new Error(`Duplicate chapter id in ${manifestPath}: "${id}"`);
      }
      seenChapterIds.add(id);

      chapters.push({
        id,
        number,
        title: String(data.title || `第 ${number} 章`).trim(),
        description: String(data.description || '').trim(),
        filename,
        rawContent: content.trim(),
      });
    }

    books.push({
      slug: manifest.slug,
      title: manifest.title.trim(),
      description: manifest.description.trim(),
      author: String(manifest.author || '').trim(),
      date: manifest.date ? new Date(manifest.date) : null,
      tags: Array.isArray(manifest.tags) ? manifest.tags : [],
      draft: Boolean(manifest.draft),
      chapters,
    });
  }

  return books.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
}

function validateManifest(manifest, directoryName) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error(`Invalid book "${directoryName}": must be a JSON object`);
  }
  if (!manifest.title || typeof manifest.title !== 'string') errors.push('"title" is required');
  if (!manifest.slug || typeof manifest.slug !== 'string') errors.push('"slug" is required');
  if (
    typeof manifest.slug === 'string'
    && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.slug)
  ) {
    errors.push('"slug" must use lowercase letters, numbers, and single hyphens');
  }
  if (!manifest.description || typeof manifest.description !== 'string') {
    errors.push('"description" is required');
  }
  if (!Array.isArray(manifest.chapters) || manifest.chapters.length === 0) {
    errors.push('"chapters" must contain at least one Markdown filename');
  }
  if (
    Array.isArray(manifest.chapters)
    && manifest.chapters.some((chapter) => typeof chapter !== 'string' || !chapter.endsWith('.md'))
  ) {
    errors.push('"chapters" must contain only Markdown filenames');
  }
  if (
    Array.isArray(manifest.chapters)
    && new Set(manifest.chapters).size !== manifest.chapters.length
  ) {
    errors.push('"chapters" contains duplicate filenames');
  }
  if (manifest.date && Number.isNaN(new Date(manifest.date).getTime())) {
    errors.push('"date" must be a valid date');
  }
  if (errors.length) {
    throw new Error(`Invalid book "${directoryName}": ${errors.join('; ')}`);
  }
}
