// scripts/check-dist.js
// 构建产物校验

import { stat, readdir } from 'node:fs/promises';
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
    'search/index.html',
    'assets/search-index.json',
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
  } catch {
    console.log(`  ❌ posts/ — MISSING`);
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
