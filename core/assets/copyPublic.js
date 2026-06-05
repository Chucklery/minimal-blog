// core/assets/copyPublic.js
// 复制 site/public/ + robots.txt 到 dist/

import { cp, mkdir } from 'node:fs/promises';
import { PUBLIC_DIR, DIST_DIR } from '../utils/paths.js';
import { join } from 'node:path';

/**
 * 递归复制 public 目录到 dist
 */
export async function copyPublic() {
  try {
    await cp(PUBLIC_DIR, DIST_DIR, { recursive: true });
    console.log('  Public: site/public/ → dist/');
  } catch {
    console.warn('  Public: No public directory found, skipping');
  }
}
