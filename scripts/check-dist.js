// scripts/check-dist.js
// 构建产物校验

import { stat, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createReadStream } from 'node:fs';
import { createGzip } from 'node:zlib';
import { DIST_DIR } from '../core/utils/paths.js';

const BUDGETS = {
  'main.js': 8 * 1024,    // < 8KB gzip
};

// 所有 CSS 文件合并大小 < 15KB gzip
const CSS_BUDGET = 15 * 1024;
const CSS_FILES = ['reset.css', 'tokens.css', 'base.css', 'layout.css', 'prose.css', 'components.css'];

async function getGzipSize(filepath) {
  return new Promise((resolve) => {
    const stream = createReadStream(filepath);
    const gzip = createGzip();
    let size = 0;
    stream
      .pipe(gzip)
      .on('data', (chunk) => {
        size += chunk.length;
      })
      .on('end', () => resolve(size));
  });
}

async function check() {
  console.log('🔍 Checking dist/...\n');

  let passed = 0;
  let failed = 0;

  // 必需文件
  const required = [
    'index.html',
    '404.html',
    'rss.xml',
    'sitemap.xml',
    'archive/index.html',
    'about/index.html',
    'assets/reset.css',
    'assets/tokens.css',
    'assets/base.css',
    'assets/layout.css',
    'assets/prose.css',
    'assets/components.css',
    'assets/main.js',
    'assets/search-page.js',
    'search/index.html',
    'assets/search-index.json',
    'og/default.jpg',
  ];

  for (const file of required) {
    const fullPath = join(DIST_DIR, file);
    try {
      await stat(fullPath);
      console.log(`  ✅ ${file}`);
      passed++;
    } catch {
      console.log(`  ❌ ${file} — MISSING`);
      failed++;
    }
  }

  // 生产构建时校验 RSS 内所有站点链接，避免泄漏 localhost 或遗漏子路径
  if (process.env.SITE_URL) {
    const expectedBase = `${process.env.SITE_URL.replace(/\/+$/, '')}/`;
    const rss = await readFile(join(DIST_DIR, 'rss.xml'), 'utf-8');
    const rssUrls = [
      ...[...rss.matchAll(/<(?:link|guid)(?:\s[^>]*)?>([^<]+)<\/(?:link|guid)>/g)]
        .map((match) => match[1]),
      ...[...rss.matchAll(/<atom:link\s[^>]*href="([^"]+)"/g)]
        .map((match) => match[1]),
    ];
    const invalidUrls = rssUrls.filter((url) => !url.startsWith(expectedBase));

    if (
      rssUrls.length > 0 &&
      invalidUrls.length === 0 &&
      rss.includes(`<atom:link href="${expectedBase}rss.xml"`)
    ) {
      console.log(`  ✅ rss.xml: ${rssUrls.length} production links`);
      passed++;
    } else {
      console.log(`  ❌ rss.xml — INVALID PRODUCTION LINKS`);
      invalidUrls.forEach((url) => console.log(`     ${url}`));
      failed++;
    }
  }

  // 检查 JS 大小预算
  for (const [file, budget] of Object.entries(BUDGETS)) {
    const fullPath = join(DIST_DIR, 'assets', file);
    try {
      const gzSize = await getGzipSize(fullPath);
      const gzKB = (gzSize / 1024).toFixed(1);
      if (gzSize > budget) {
        console.log(`  ⚠️  ${file}: ${gzKB}KB gzip (budget: ${budget / 1024}KB) — OVER BUDGET`);
        failed++;
      } else {
        console.log(`  ✅ ${file}: ${gzKB}KB gzip (budget: ${budget / 1024}KB)`);
        passed++;
      }
    } catch {
      console.log(`  ⚠️  ${file} — could not check size`);
    }
  }

  // 检查 CSS 合并大小
  let cssTotal = 0;
  for (const file of CSS_FILES) {
    try {
      const size = await getGzipSize(join(DIST_DIR, 'assets', file));
      cssTotal += size;
    } catch { /* skip missing */ }
  }
  const cssKB = (cssTotal / 1024).toFixed(1);
  if (cssTotal > CSS_BUDGET) {
    console.log(`  ⚠️  CSS total: ${cssKB}KB gzip (budget: ${CSS_BUDGET / 1024}KB) — OVER BUDGET`);
    failed++;
  } else {
    console.log(`  ✅ CSS total: ${cssKB}KB gzip (budget: ${CSS_BUDGET / 1024}KB)`);
    passed++;
  }

  // 检查 posts 目录是否有输出
  try {
    const postFiles = await readdir(join(DIST_DIR, 'posts'));
    const htmlFiles = postFiles.filter((f) => f.endsWith('.html'));
    console.log(`  ✅ posts/: ${htmlFiles.length} html files`);
    passed++;

    const socialFiles = await readdir(join(DIST_DIR, 'assets', 'og'));
    const socialImages = socialFiles.filter((file) => file.endsWith('.jpg'));
    if (socialImages.length === htmlFiles.length) {
      console.log(`  ✅ social images: ${socialImages.length} article cards`);
      passed++;
    } else {
      console.log(`  ❌ social images — expected ${htmlFiles.length}, found ${socialImages.length}`);
      failed++;
    }
  } catch {
    console.log(`  ❌ posts/ — MISSING`);
    failed++;
  }

  const searchIndex = JSON.parse(
    await readFile(join(DIST_DIR, 'assets', 'search-index.json'), 'utf-8')
  );
  if (searchIndex.length > 0 && searchIndex.every((post) => typeof post.content === 'string')) {
    console.log(`  ✅ search index: full-text content included`);
    passed++;
  } else {
    console.log(`  ❌ search index — full-text content missing`);
    failed++;
  }

  const sitemap = await readFile(join(DIST_DIR, 'sitemap.xml'), 'utf-8');
  if (sitemap.includes('/tags/')) {
    console.log(`  ✅ sitemap.xml: tag pages included`);
    passed++;
  } else {
    console.log(`  ❌ sitemap.xml — tag pages missing`);
    failed++;
  }

  console.log(`\n${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

check().catch((err) => {
  console.error('Check failed:', err.message);
  process.exit(1);
});
