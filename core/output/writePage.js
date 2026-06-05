// core/output/writePage.js
// 将 HTML 字符串写入 dist 目录

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { DIST_DIR } from '../utils/paths.js';

/**
 * 写入页面文件
 * @param {string} relativePath - 相对于 dist 的路径，如 'index.html', 'posts/hello.html'
 * @param {string} html
 * @returns {Promise<void>}
 */
export async function writePage(relativePath, html) {
  const fullPath = join(DIST_DIR, relativePath);

  // 确保父目录存在
  const dir = dirname(fullPath);
  await mkdir(dir, { recursive: true });

  await writeFile(fullPath, html, 'utf-8');
}
